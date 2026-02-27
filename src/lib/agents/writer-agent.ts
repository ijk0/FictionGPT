import { query } from '@anthropic-ai/claude-agent-sdk';
import { getWriterSystemPrompt } from './prompts/writer';
import { getAgentEnv } from './env';
import type { ChapterContext } from '@/lib/context/context-builder';
import type { AgentYield } from './types';

export interface WriterAgentParams {
  context: ChapterContext;
  chapterNumber: number;
  styleModifier: string;
}

/**
 * Build the user prompt that provides the writer agent with all the context
 * needed to write a single chapter.
 */
function buildWriterPrompt(
  context: ChapterContext,
  chapterNumber: number
): string {
  const parts: string[] = [];

  parts.push(`# 写作任务：撰写第 ${chapterNumber} 章`);
  parts.push('');

  parts.push('## 故事基本信息');
  parts.push(context.storyInfo);
  parts.push('');

  parts.push('## 相关角色信息');
  parts.push(context.characterInfo);
  parts.push('');

  if (context.previousSummaries) {
    parts.push('## 前面章节摘要');
    parts.push(context.previousSummaries);
    parts.push('');
  }

  if (context.unresolvedThreads) {
    parts.push('## 未解决的线索和伏笔');
    parts.push(context.unresolvedThreads);
    parts.push('');
  }

  parts.push('## 本章大纲');
  parts.push(context.chapterPlan);
  parts.push('');

  parts.push('请根据以上信息撰写本章。确保与前面章节的内容连贯一致，按照本章大纲完成所有关键事件。');

  return parts.join('\n');
}

/**
 * Run the writer agent as an async generator.
 *
 * The writer agent is a single-shot agent that writes one chapter at a time.
 * It does not support session resumption; each chapter is written in a fresh
 * session. The style modifier is injected into the system prompt to control
 * the writing style.
 *
 * Yields:
 *   - { type: 'session', sessionId } on init
 *   - { type: 'text', content } for streaming text deltas
 *   - { type: 'result', content } when the agent completes
 */
export async function* runWriterAgent(
  params: WriterAgentParams
): AsyncGenerator<AgentYield, void, undefined> {
  const { context, chapterNumber, styleModifier } = params;

  const systemPrompt = getWriterSystemPrompt(styleModifier);
  const prompt = buildWriterPrompt(context, chapterNumber);

  const queryIterator = query({
    prompt,
    options: {
      model: 'claude-sonnet-4-6',
      systemPrompt,
      tools: [],
      allowedTools: [],
      includePartialMessages: true,
      persistSession: false,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 1,
      env: getAgentEnv(),
    },
  });

  let lastTextLength = 0;

  for await (const sdkMessage of queryIterator) {
    switch (sdkMessage.type) {
      case 'system': {
        if (sdkMessage.subtype === 'init') {
          yield { type: 'session', sessionId: sdkMessage.session_id };
        }
        break;
      }

      case 'stream_event': {
        const event = sdkMessage.event;
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { type: 'text', content: event.delta.text };
        }
        break;
      }

      case 'assistant': {
        const contentBlocks = sdkMessage.message.content as Array<{ type: string; text?: string }>;
        const fullText = contentBlocks
          .filter((block) => block.type === 'text' && typeof block.text === 'string')
          .map((block) => block.text as string)
          .join('');

        if (fullText.length > 0 && lastTextLength === 0) {
          yield { type: 'text', content: fullText };
        }
        lastTextLength = fullText.length;
        break;
      }

      case 'result': {
        const resultContent =
          sdkMessage.subtype === 'success' ? sdkMessage.result : '';
        yield { type: 'result', content: resultContent };
        break;
      }

      default:
        break;
    }
  }
}

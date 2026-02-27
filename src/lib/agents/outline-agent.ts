import { query } from '@anthropic-ai/claude-agent-sdk';
import { OUTLINE_SYSTEM_PROMPT } from './prompts/outline';
import { getAgentEnv } from './env';
import type { StoryCanvas } from '@/lib/types/project';
import type { AgentYield } from './types';

export interface OutlineAgentParams {
  canvas: StoryCanvas;
}

/**
 * Build the user prompt that includes the StoryCanvas JSON for the outline agent.
 */
function buildOutlinePrompt(canvas: StoryCanvas): string {
  return `请根据以下故事画布设计完整的章节大纲。

## 故事画布（StoryCanvas）

\`\`\`json
${JSON.stringify(canvas, null, 2)}
\`\`\`

请先分析故事画布中的各个要素，然后设计一份完整的章节大纲。确保大纲覆盖从开篇到结局的完整叙事弧线，并合理安排所有角色的出场和情节点的分布。`;
}

/**
 * Run the outline agent as an async generator.
 *
 * The outline agent is a single-shot agent that takes a StoryCanvas and
 * generates a complete chapter outline. It does not support session resumption
 * since each invocation generates a fresh outline.
 *
 * Yields:
 *   - { type: 'session', sessionId } on init
 *   - { type: 'text', content } for streaming text deltas
 *   - { type: 'result', content } when the agent completes
 */
export async function* runOutlineAgent(
  params: OutlineAgentParams
): AsyncGenerator<AgentYield, void, undefined> {
  const { canvas } = params;

  const prompt = buildOutlinePrompt(canvas);

  const queryIterator = query({
    prompt,
    options: {
      model: 'claude-opus-4-6',
      systemPrompt: OUTLINE_SYSTEM_PROMPT,
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

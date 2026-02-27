import { query } from '@anthropic-ai/claude-agent-sdk';
import { BRAINSTORM_SYSTEM_PROMPT } from './prompts/brainstorm';
import { getAgentEnv } from './env';
import type { AgentYield } from './types';

export interface BrainstormAgentParams {
  message: string;
  sessionId?: string;
  projectId: string;
}

/**
 * Run the brainstorm agent as an async generator.
 *
 * The brainstorm agent is a conversational agent that guides the user through
 * the story planning process. It uses no tools (pure conversation) and supports
 * session resumption for multi-turn dialogue.
 *
 * Yields:
 *   - { type: 'session', sessionId } on init
 *   - { type: 'text', content } for streaming text deltas
 *   - { type: 'result', content } when the agent completes
 */
export async function* runBrainstormAgent(
  params: BrainstormAgentParams
): AsyncGenerator<AgentYield, void, undefined> {
  const { message, sessionId, projectId } = params;

  const queryIterator = query({
    prompt: message,
    options: {
      systemPrompt: BRAINSTORM_SYSTEM_PROMPT,
      tools: [],
      allowedTools: [],
      includePartialMessages: true,
      persistSession: true,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 1,
      env: getAgentEnv(),
      ...(sessionId ? { resume: sessionId } : {}),
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
        // Handle streaming text deltas from partial messages
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
        // When we get a complete assistant message, extract any remaining text
        // that might not have been streamed via partial messages.
        const contentBlocks = sdkMessage.message.content as Array<{ type: string; text?: string }>;
        const fullText = contentBlocks
          .filter((block) => block.type === 'text' && typeof block.text === 'string')
          .map((block) => block.text as string)
          .join('');

        // If includePartialMessages is on, we already streamed the text.
        // Only yield the full text if we didn't get partial messages for it.
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
        // Ignore other message types (keep_alive, auth_status, etc.)
        break;
    }
  }
}

export interface AgentConfig {
  systemPrompt: string;
  allowedTools: string[];
  model?: string;
}

export interface AgentTextDelta {
  type: 'text';
  content: string;
}

export interface AgentSessionInfo {
  type: 'session';
  sessionId: string;
}

export interface AgentResult {
  type: 'result';
  content: string;
}

export type AgentYield = AgentTextDelta | AgentSessionInfo | AgentResult;

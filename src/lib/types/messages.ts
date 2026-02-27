import type { StoryCanvas, Outline, ChapterSummary } from './project';

export type SSEEventType =
  | 'text'
  | 'canvas'
  | 'outline'
  | 'summary'
  | 'session'
  | 'done'
  | 'error';

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
}

export interface TextEvent {
  content: string;
}

export interface CanvasEvent {
  canvas: Partial<StoryCanvas>;
}

export interface OutlineEvent {
  outline: Outline;
}

export interface SummaryEvent {
  summary: ChapterSummary;
}

export interface SessionEvent {
  sessionId: string;
}

export interface ErrorEvent {
  message: string;
}

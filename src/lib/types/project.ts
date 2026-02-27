export type WritingStyle =
  | 'literary'
  | 'webnovel'
  | 'mystery'
  | 'scifi'
  | 'fantasy'
  | 'romance'
  | 'custom';

export type ProjectPhase =
  | 'brainstorm'
  | 'outline'
  | 'writing'
  | 'completed';

export interface ProjectMeta {
  id: string;
  title: string;
  description: string;
  style: WritingStyle;
  customStyleDescription?: string;
  status: ProjectPhase;
  createdAt: string;
  updatedAt: string;
  brainstormSessionId?: string;
}

export interface StoryCanvas {
  premise: string;
  genre: string;
  setting: WorldSetting;
  characters: Character[];
  plotPoints: PlotPoint[];
  themes: string[];
  tone: string;
  targetWordCount?: number;
}

export interface WorldSetting {
  timePeriod: string;
  location: string;
  rules: string;
  atmosphere: string;
}

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  motivation: string;
  arc: string;
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'rising' | 'climax' | 'falling' | 'resolution';
}

export interface Outline {
  totalChapters: number;
  estimatedWordCount: number;
  chapters: ChapterOutline[];
}

export interface ChapterOutline {
  number: number;
  title: string;
  synopsis: string;
  keyEvents: string[];
  characters: string[];
  emotionalTone: string;
  estimatedWords: number;
}

export interface ChapterSummary {
  chapterNumber: number;
  summary: string;
  characterStates: Record<string, string>;
  unresolved: string[];
}

export interface BrainstormMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function createEmptyCanvas(): StoryCanvas {
  return {
    premise: '',
    genre: '',
    setting: {
      timePeriod: '',
      location: '',
      rules: '',
      atmosphere: '',
    },
    characters: [],
    plotPoints: [],
    themes: [],
    tone: '',
  };
}

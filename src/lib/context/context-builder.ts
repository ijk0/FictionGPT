import fs from 'fs/promises';
import { getCanvas } from '@/lib/storage/canvas';
import { getChapterSummary } from '@/lib/storage/chapters';
import { outlinePath } from '@/lib/storage/paths';
import type {
  StoryCanvas,
  Outline,
  ChapterOutline,
  ChapterSummary,
  Character,
} from '@/lib/types/project';

export interface ChapterContext {
  /** Story premise, genre, and setting information. */
  storyInfo: string;
  /** Relevant character descriptions for this chapter. */
  characterInfo: string;
  /** Summaries of the last 3 chapters (sliding window). */
  previousSummaries: string;
  /** Unresolved threads collected from previous chapter summaries. */
  unresolvedThreads: string;
  /** The current chapter's outline plan. */
  chapterPlan: string;
}

/**
 * Read the outline JSON for a project.
 * Returns null if the outline file does not exist.
 */
async function getOutline(projectId: string): Promise<Outline | null> {
  try {
    const raw = await fs.readFile(outlinePath(projectId), 'utf-8');
    return JSON.parse(raw) as Outline;
  } catch {
    return null;
  }
}

/**
 * Format the story's high-level information into a readable string.
 */
function formatStoryInfo(canvas: StoryCanvas): string {
  const lines: string[] = [];

  if (canvas.premise) {
    lines.push(`故事前提：${canvas.premise}`);
  }
  if (canvas.genre) {
    lines.push(`类型：${canvas.genre}`);
  }
  if (canvas.tone) {
    lines.push(`基调：${canvas.tone}`);
  }
  if (canvas.themes.length > 0) {
    lines.push(`主题：${canvas.themes.join('、')}`);
  }

  const { setting } = canvas;
  if (setting.timePeriod || setting.location || setting.rules || setting.atmosphere) {
    lines.push('');
    lines.push('### 世界观设定');
    if (setting.timePeriod) {
      lines.push(`时代背景：${setting.timePeriod}`);
    }
    if (setting.location) {
      lines.push(`地理环境：${setting.location}`);
    }
    if (setting.rules) {
      lines.push(`世界规则：${setting.rules}`);
    }
    if (setting.atmosphere) {
      lines.push(`整体氛围：${setting.atmosphere}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a single character's information into a readable string.
 */
function formatCharacter(character: Character): string {
  const roleLabels: Record<Character['role'], string> = {
    protagonist: '主角',
    antagonist: '对手/反派',
    supporting: '重要配角',
    minor: '次要角色',
  };

  const lines: string[] = [];
  lines.push(`**${character.name}**（${roleLabels[character.role]}）`);
  if (character.description) {
    lines.push(`  描述：${character.description}`);
  }
  if (character.motivation) {
    lines.push(`  动机：${character.motivation}`);
  }
  if (character.arc) {
    lines.push(`  成长弧线：${character.arc}`);
  }
  return lines.join('\n');
}

/**
 * Format relevant character information for a specific chapter.
 * Only includes characters that are listed in the chapter's outline.
 * If no outline characters are specified, includes all characters.
 */
function formatCharacterInfo(
  canvas: StoryCanvas,
  chapterOutline: ChapterOutline | null
): string {
  if (canvas.characters.length === 0) {
    return '（无角色信息）';
  }

  let relevantCharacters: Character[];

  if (chapterOutline && chapterOutline.characters.length > 0) {
    // Filter to only characters appearing in this chapter
    const chapterCharNames = new Set(
      chapterOutline.characters.map((name) => name.toLowerCase())
    );

    relevantCharacters = canvas.characters.filter((char) =>
      chapterCharNames.has(char.name.toLowerCase())
    );

    // If filtering produced no matches (perhaps due to name mismatches),
    // fall back to all characters
    if (relevantCharacters.length === 0) {
      relevantCharacters = canvas.characters;
    }
  } else {
    relevantCharacters = canvas.characters;
  }

  return relevantCharacters.map(formatCharacter).join('\n\n');
}

/**
 * Format a chapter outline into a readable plan string.
 */
function formatChapterPlan(chapterOutline: ChapterOutline): string {
  const lines: string[] = [];

  lines.push(`第 ${chapterOutline.number} 章：${chapterOutline.title}`);
  lines.push('');
  lines.push(`概要：${chapterOutline.synopsis}`);
  lines.push('');

  if (chapterOutline.keyEvents.length > 0) {
    lines.push('关键事件：');
    for (const event of chapterOutline.keyEvents) {
      lines.push(`- ${event}`);
    }
    lines.push('');
  }

  if (chapterOutline.characters.length > 0) {
    lines.push(`出场角色：${chapterOutline.characters.join('、')}`);
  }

  if (chapterOutline.emotionalTone) {
    lines.push(`情感基调：${chapterOutline.emotionalTone}`);
  }

  if (chapterOutline.estimatedWords) {
    lines.push(`目标字数：约 ${chapterOutline.estimatedWords} 字`);
  }

  return lines.join('\n');
}

/**
 * Format previous chapter summaries into a readable string.
 * Uses a sliding window of the last 3 chapters.
 */
function formatPreviousSummaries(summaries: ChapterSummary[]): string {
  if (summaries.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const summary of summaries) {
    lines.push(`### 第 ${summary.chapterNumber} 章摘要`);
    lines.push(summary.summary);

    if (Object.keys(summary.characterStates).length > 0) {
      lines.push('');
      lines.push('角色状态：');
      for (const [name, state] of Object.entries(summary.characterStates)) {
        lines.push(`- ${name}：${state}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Collect all unresolved threads from previous chapter summaries.
 */
function formatUnresolvedThreads(summaries: ChapterSummary[]): string {
  const allUnresolved: string[] = [];

  for (const summary of summaries) {
    if (summary.unresolved && summary.unresolved.length > 0) {
      for (const thread of summary.unresolved) {
        allUnresolved.push(`- [第${summary.chapterNumber}章] ${thread}`);
      }
    }
  }

  if (allUnresolved.length === 0) {
    return '';
  }

  return allUnresolved.join('\n');
}

/**
 * Build the complete context for writing a specific chapter.
 *
 * Reads the story canvas, outline, and previous chapter summaries (sliding
 * window of last 3 chapters), then assembles them into a structured context
 * object that the writer agent can use.
 *
 * @param projectId - The project identifier
 * @param chapterNumber - The 1-based chapter number to write
 * @returns A structured ChapterContext object
 */
export async function buildChapterContext(
  projectId: string,
  chapterNumber: number
): Promise<ChapterContext> {
  // Load canvas and outline in parallel
  const [canvas, outline] = await Promise.all([
    getCanvas(projectId),
    getOutline(projectId),
  ]);

  // Find the current chapter's outline
  let chapterOutline: ChapterOutline | null = null;
  if (outline) {
    chapterOutline =
      outline.chapters.find((ch) => ch.number === chapterNumber) ?? null;
  }

  // Load previous chapter summaries (sliding window: last 3 chapters)
  const summaryStart = Math.max(1, chapterNumber - 3);
  const summaryPromises: Promise<ChapterSummary | null>[] = [];

  for (let i = summaryStart; i < chapterNumber; i++) {
    summaryPromises.push(getChapterSummary(projectId, i));
  }

  const summaryResults = await Promise.all(summaryPromises);
  const previousSummaries = summaryResults.filter(
    (s): s is ChapterSummary => s !== null
  );

  // Assemble the context
  const storyInfo = formatStoryInfo(canvas);
  const characterInfo = formatCharacterInfo(canvas, chapterOutline);
  const formattedSummaries = formatPreviousSummaries(previousSummaries);
  const unresolvedThreads = formatUnresolvedThreads(previousSummaries);

  const chapterPlan = chapterOutline
    ? formatChapterPlan(chapterOutline)
    : `第 ${chapterNumber} 章（无详细大纲，请根据故事信息自由发挥）`;

  return {
    storyInfo,
    characterInfo,
    previousSummaries: formattedSummaries,
    unresolvedThreads,
    chapterPlan,
  };
}

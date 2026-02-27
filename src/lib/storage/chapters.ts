import fs from 'fs/promises';
import type { ChapterSummary } from '../types/project';
import { chaptersDir, chapterPath, summariesDir, summaryPath } from './paths';

/**
 * Read a chapter's markdown content by project ID and chapter number.
 * Returns null if the chapter file does not exist.
 */
export async function getChapter(
  projectId: string,
  num: number
): Promise<string | null> {
  try {
    const content = await fs.readFile(chapterPath(projectId, num), 'utf-8');
    return content;
  } catch {
    return null;
  }
}

/**
 * Write a chapter's markdown content.
 * Creates the chapters directory if it does not already exist.
 */
export async function saveChapter(
  projectId: string,
  num: number,
  content: string
): Promise<void> {
  await fs.mkdir(chaptersDir(projectId), { recursive: true });
  await fs.writeFile(chapterPath(projectId, num), content, 'utf-8');
}

/**
 * Read a chapter's summary JSON by project ID and chapter number.
 * Returns null if the summary file does not exist.
 */
export async function getChapterSummary(
  projectId: string,
  num: number
): Promise<ChapterSummary | null> {
  try {
    const raw = await fs.readFile(summaryPath(projectId, num), 'utf-8');
    return JSON.parse(raw) as ChapterSummary;
  } catch {
    return null;
  }
}

/**
 * Write a chapter's summary JSON.
 * Creates the summaries directory if it does not already exist.
 */
export async function saveChapterSummary(
  projectId: string,
  num: number,
  summary: ChapterSummary
): Promise<void> {
  await fs.mkdir(summariesDir(projectId), { recursive: true });
  await fs.writeFile(
    summaryPath(projectId, num),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
}

/**
 * List all existing chapter numbers for a project by scanning the chapters
 * directory for files matching the naming pattern `chapter-NN.md`.
 * Returns a sorted array of chapter numbers.
 */
export async function listChapters(projectId: string): Promise<number[]> {
  const dir = chaptersDir(projectId);

  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const chapterPattern = /^chapter-(\d+)\.md$/;
  const numbers: number[] = [];

  for (const entry of entries) {
    const match = entry.match(chapterPattern);
    if (match) {
      numbers.push(parseInt(match[1], 10));
    }
  }

  numbers.sort((a, b) => a - b);
  return numbers;
}

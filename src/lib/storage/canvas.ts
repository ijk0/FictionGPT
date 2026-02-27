import fs from 'fs/promises';
import { createEmptyCanvas, type StoryCanvas } from '../types/project';
import { canvasPath, projectDir } from './paths';

/**
 * Read the story canvas for a project.
 * Returns an empty canvas if the file does not exist.
 */
export async function getCanvas(projectId: string): Promise<StoryCanvas> {
  try {
    const raw = await fs.readFile(canvasPath(projectId), 'utf-8');
    return JSON.parse(raw) as StoryCanvas;
  } catch {
    return createEmptyCanvas();
  }
}

/**
 * Write the full story canvas for a project, replacing any existing data.
 * Creates the project directory if it does not already exist.
 */
export async function saveCanvas(
  projectId: string,
  canvas: StoryCanvas
): Promise<void> {
  await fs.mkdir(projectDir(projectId), { recursive: true });
  await fs.writeFile(
    canvasPath(projectId),
    JSON.stringify(canvas, null, 2),
    'utf-8'
  );
}

/**
 * Merge a partial canvas update into the existing canvas.
 *
 * Top-level primitive fields are replaced. Nested objects (like `setting`)
 * are shallow-merged. Arrays (like `characters`, `plotPoints`, `themes`)
 * are replaced wholesale — pass the full array if you need to update them.
 *
 * Returns the merged canvas.
 */
export async function updateCanvas(
  projectId: string,
  partial: Partial<StoryCanvas>
): Promise<StoryCanvas> {
  const existing = await getCanvas(projectId);

  const merged: StoryCanvas = {
    ...existing,
    ...partial,
    setting: {
      ...existing.setting,
      ...(partial.setting ?? {}),
    },
  };

  await saveCanvas(projectId, merged);
  return merged;
}

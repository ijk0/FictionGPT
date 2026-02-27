import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

/** Root directory for all projects. */
export const projectsDir = () => path.join(DATA_DIR, 'projects');

/** Directory for a single project. */
export const projectDir = (id: string) => path.join(projectsDir(), id);

/** Path to a project's metadata file. */
export const metaPath = (id: string) => path.join(projectDir(id), 'meta.json');

/** Path to a project's story canvas file. */
export const canvasPath = (id: string) => path.join(projectDir(id), 'canvas.json');

/** Path to a project's outline file. */
export const outlinePath = (id: string) => path.join(projectDir(id), 'outline.json');

/** Directory containing chapter markdown files. */
export const chaptersDir = (id: string) => path.join(projectDir(id), 'chapters');

/** Path to a specific chapter's markdown file (zero-padded number). */
export const chapterPath = (id: string, num: number) =>
  path.join(chaptersDir(id), `chapter-${String(num).padStart(2, '0')}.md`);

/** Directory containing chapter summary JSON files. */
export const summariesDir = (id: string) => path.join(projectDir(id), 'summaries');

/** Path to a specific chapter's summary JSON file (zero-padded number). */
export const summaryPath = (id: string, num: number) =>
  path.join(summariesDir(id), `chapter-${String(num).padStart(2, '0')}.json`);

/** Path to a project's brainstorm messages file. */
export const brainstormMessagesPath = (id: string) =>
  path.join(projectDir(id), 'brainstorm-messages.json');

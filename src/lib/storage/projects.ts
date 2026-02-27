import fs from 'fs/promises';
import { generateId } from '../utils/id';
import { createEmptyCanvas, type ProjectMeta, type WritingStyle } from '../types/project';
import {
  projectsDir,
  projectDir,
  metaPath,
  canvasPath,
  chaptersDir,
  summariesDir,
} from './paths';

/**
 * Input data required to create a new project.
 */
export interface CreateProjectInput {
  title: string;
  description: string;
  style: WritingStyle;
  customStyleDescription?: string;
}

/**
 * Fields that can be updated on an existing project.
 */
export type UpdateProjectInput = Partial<
  Pick<
    ProjectMeta,
    'title' | 'description' | 'style' | 'customStyleDescription' | 'status' | 'brainstormSessionId'
  >
>;

/**
 * Ensure the root projects directory exists.
 */
async function ensureProjectsDir(): Promise<void> {
  await fs.mkdir(projectsDir(), { recursive: true });
}

/**
 * List all projects by reading each project directory and loading its meta.json.
 * Returns projects sorted by updatedAt descending (most recent first).
 */
export async function listProjects(): Promise<ProjectMeta[]> {
  await ensureProjectsDir();

  let entries: string[];
  try {
    const dirEntries = await fs.readdir(projectsDir(), { withFileTypes: true });
    entries = dirEntries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }

  const projects: ProjectMeta[] = [];

  for (const dirName of entries) {
    try {
      const raw = await fs.readFile(metaPath(dirName), 'utf-8');
      const meta: ProjectMeta = JSON.parse(raw);
      projects.push(meta);
    } catch {
      // Skip directories that don't have a valid meta.json
      continue;
    }
  }

  projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return projects;
}

/**
 * Get a single project's metadata by its ID.
 * Returns null if the project does not exist.
 */
export async function getProject(id: string): Promise<ProjectMeta | null> {
  try {
    const raw = await fs.readFile(metaPath(id), 'utf-8');
    return JSON.parse(raw) as ProjectMeta;
  } catch {
    return null;
  }
}

/**
 * Create a new project with the given input data.
 * Creates the project directory, meta.json, empty canvas.json,
 * and subdirectories for chapters and summaries.
 */
export async function createProject(data: CreateProjectInput): Promise<ProjectMeta> {
  const id = generateId();
  const now = new Date().toISOString();

  const meta: ProjectMeta = {
    id,
    title: data.title,
    description: data.description,
    style: data.style,
    status: 'brainstorm',
    createdAt: now,
    updatedAt: now,
  };

  if (data.customStyleDescription) {
    meta.customStyleDescription = data.customStyleDescription;
  }

  // Create project directory and subdirectories
  await fs.mkdir(projectDir(id), { recursive: true });
  await fs.mkdir(chaptersDir(id), { recursive: true });
  await fs.mkdir(summariesDir(id), { recursive: true });

  // Write meta.json
  await fs.writeFile(metaPath(id), JSON.stringify(meta, null, 2), 'utf-8');

  // Write an empty canvas.json
  const emptyCanvas = createEmptyCanvas();
  await fs.writeFile(canvasPath(id), JSON.stringify(emptyCanvas, null, 2), 'utf-8');

  return meta;
}

/**
 * Update an existing project's metadata with a partial set of fields.
 * Automatically updates the `updatedAt` timestamp.
 * Returns the updated project, or null if the project does not exist.
 */
export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<ProjectMeta | null> {
  const existing = await getProject(id);
  if (!existing) return null;

  const updated: ProjectMeta = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(metaPath(id), JSON.stringify(updated, null, 2), 'utf-8');

  return updated;
}

/**
 * Delete a project and all of its associated files.
 * No-op if the project directory does not exist.
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await fs.rm(projectDir(id), { recursive: true, force: true });
  } catch {
    // Directory may not exist; ignore.
  }
}

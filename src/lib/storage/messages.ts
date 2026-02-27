import fs from 'fs/promises';
import { projectDir, brainstormMessagesPath } from './paths';
import path from 'path';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/** Read brainstorm chat messages for a project. */
export async function getBrainstormMessages(projectId: string): Promise<StoredMessage[]> {
  try {
    const raw = await fs.readFile(brainstormMessagesPath(projectId), 'utf-8');
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

/** Save brainstorm chat messages for a project. */
export async function saveBrainstormMessages(
  projectId: string,
  messages: StoredMessage[]
): Promise<void> {
  await fs.mkdir(projectDir(projectId), { recursive: true });
  await fs.writeFile(
    brainstormMessagesPath(projectId),
    JSON.stringify(messages, null, 2),
    'utf-8'
  );
}

/** Read outline chat messages for a project. */
export async function getOutlineMessages(projectId: string): Promise<StoredMessage[]> {
  try {
    const raw = await fs.readFile(
      path.join(projectDir(projectId), 'outline-messages.json'),
      'utf-8'
    );
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

/** Save outline chat messages for a project. */
export async function saveOutlineMessages(
  projectId: string,
  messages: StoredMessage[]
): Promise<void> {
  await fs.mkdir(projectDir(projectId), { recursive: true });
  await fs.writeFile(
    path.join(projectDir(projectId), 'outline-messages.json'),
    JSON.stringify(messages, null, 2),
    'utf-8'
  );
}

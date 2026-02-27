import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Parse a .env file into a key-value map.
 */
function parseDotenv(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && value) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

let initialized = false;

/**
 * Ensure .env.local values override process.env.
 *
 * The SDK spawns child processes and may also make direct API calls that
 * read from process.env. Next.js loads .env.local but does NOT override
 * existing system env vars. We explicitly read .env.local and write the
 * values into process.env so they take precedence everywhere — both in
 * the current process and in any child processes that inherit it.
 */
function ensureEnvLoaded(): void {
  if (initialized) return;
  initialized = true;

  const dotenvPath = resolve(process.cwd(), '.env.local');
  const localVars = parseDotenv(dotenvPath);

  for (const [key, value] of Object.entries(localVars)) {
    process.env[key] = value;
  }
}

/**
 * Build the environment variables to pass to the Claude Agent SDK.
 *
 * Also ensures process.env has been patched with .env.local values
 * so that any SDK code reading process.env directly gets the right values.
 */
export function getAgentEnv(): Record<string, string | undefined> {
  ensureEnvLoaded();
  return process.env;
}

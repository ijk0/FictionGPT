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

let cachedEnv: Record<string, string | undefined> | null = null;

/**
 * Build the environment variables to pass to the Claude Agent SDK.
 *
 * The SDK spawns a child process that inherits system env by default.
 * Next.js loads .env.local but does NOT override existing system env vars.
 * We explicitly read .env.local and merge it on top of process.env so that
 * .env.local values always take precedence.
 */
export function getAgentEnv(): Record<string, string | undefined> {
  if (cachedEnv) return cachedEnv;

  const dotenvPath = resolve(process.cwd(), '.env.local');
  const localVars = parseDotenv(dotenvPath);

  cachedEnv = {
    ...process.env,
    ...localVars,
  };
  return cachedEnv;
}

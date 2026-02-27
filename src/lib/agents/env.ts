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

let cachedEnv: Record<string, string> | null = null;

/**
 * Build the environment variables to pass to the Claude Agent SDK.
 *
 * The SDK spawns a child process via child_process.spawn and passes the
 * `env` option as its environment. We must return a plain object (not
 * process.env itself, which is a special Node.js Proxy) with .env.local
 * values merged on top so they always take precedence.
 *
 * We also write the values into process.env so any SDK code that reads
 * process.env directly (e.g. for internal routing calls) gets them too.
 */
export function getAgentEnv(): Record<string, string> {
  if (cachedEnv) return cachedEnv;

  const dotenvPath = resolve(process.cwd(), '.env.local');
  const localVars = parseDotenv(dotenvPath);

  // Patch process.env for any direct reads by SDK internals
  for (const [key, value] of Object.entries(localVars)) {
    process.env[key] = value;
  }

  // Return a plain object for the SDK's child process env option
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }

  cachedEnv = env;
  return cachedEnv;
}

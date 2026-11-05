import fs from 'node:fs';
import path from 'node:path';

/**
 * The version comes from the server's package.json, so it moves with every release instead of being typed in
 * by hand. Built (dist/utils) and run with tsx (src/utils), this file sits two levels below that package.json;
 * in the Docker image the server's package.json is copied next to dist/.
 */
function readVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
    if (typeof pkg.version === 'string' && pkg.version) return pkg.version;
  } catch {
    // fall through
  }
  return '0.0.0';
}

export const APP_VERSION = readVersion();

export type Channel = 'beta' | 'stable';

/**
 * The build channel follows the compose tag (VEHICLEVAULT_TAG): any tag that contains "beta" is the
 * beta channel, everything else (latest, a version number, unset) is stable.
 */
export function getChannel(tag: string | undefined = process.env.VEHICLEVAULT_TAG): Channel {
  return (tag || '').toLowerCase().includes('beta') ? 'beta' : 'stable';
}

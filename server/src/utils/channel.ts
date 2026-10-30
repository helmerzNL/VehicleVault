export const APP_VERSION = '2.0.0';

export type Channel = 'beta' | 'stable';

/**
 * The build channel follows the compose tag (VEHICLEVAULT_TAG): any tag that contains "beta" is the
 * beta channel, everything else (latest, a version number, unset) is stable.
 */
export function getChannel(tag: string | undefined = process.env.VEHICLEVAULT_TAG): Channel {
  return (tag || '').toLowerCase().includes('beta') ? 'beta' : 'stable';
}

/**
 * Safe area of the screen: the strip the notch / Dynamic Island / status bar and the home indicator cover.
 *
 * The layout reads it from the `--safe-top` (and -right / -bottom / -left) CSS variables in index.css, which
 * take the browser's own value, env(safe-area-inset-*), and nothing else. That is right wherever the browser
 * reports the inset. In an installed iOS web app the page is drawn under the translucent status bar
 * (black-translucent + viewport-fit=cover); if the inset does not come through there, the top bar would sit
 * behind the Dynamic Island. This module notices that case and gives `--safe-top` an estimate for the device,
 * through `--safe-top-fallback`, so the bar still clears it. It never overrides a value the browser reports.
 */

export interface SafeAreaInfo {
  /** Running as an installed app (home-screen web app) rather than in a browser tab. */
  standalone: boolean;
  /** Safe area as the browser reports it, in px. */
  env: { top: number; right: number; bottom: number; left: number };
  /** Estimated top inset in use because the browser reported none, in px (0 = not used). */
  fallbackTop: number;
}

const isIPhone = () => /iPhone|iPod/.test(navigator.userAgent);

const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

/**
 * Height the status bar / Dynamic Island takes at the top of an iPhone in portrait, by screen size
 * ([short side, long side] in CSS px). Only used when the browser does not report the inset itself.
 */
const IPHONE_TOP_INSETS: Array<[number, number, number]> = [
  [440, 956, 62], // 16 Pro Max, 17 Pro Max
  [420, 912, 62], // Air
  [402, 874, 62], // 16 Pro, 17, 17 Pro
  [430, 932, 59], // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [393, 852, 59], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 47], // 12 / 13 Pro Max, 14 Plus
  [390, 844, 47], // 12, 12 Pro, 13, 13 Pro, 14, 16e
  [414, 896, 48], // XR, 11, XS Max, 11 Pro Max
  [375, 812, 44], // X, XS, 11 Pro
  [360, 780, 50], // 12 mini, 13 mini
];

function estimateIPhoneTopInset(short: number, long: number): number {
  const match = IPHONE_TOP_INSETS.find(([s, l]) => Math.abs(s - short) <= 1 && Math.abs(l - long) <= 1);
  if (match) return match[2];
  if (long >= 812) return 47; // some other phone with a notch or island
  return 20; // phone with a home button: the plain 20px status bar
}

/** What the browser reports for env(safe-area-inset-*), measured through a throw-away element. */
function measureEnv() {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const px = (value: string) => Math.round(parseFloat(value) || 0);
  const env = {
    top: px(style.paddingTop),
    right: px(style.paddingRight),
    bottom: px(style.paddingBottom),
    left: px(style.paddingLeft),
  };
  probe.remove();
  return env;
}

/** The estimate to use right now, or 0 when the browser reports the inset or the page is not under the status bar. */
function currentFallbackTop(envTop: number): number {
  if (envTop > 0 || !isIPhone() || !isStandalone()) return 0;
  const portrait = window.innerHeight > window.innerWidth;
  if (!portrait) return 0;
  const long = Math.max(window.screen.width, window.screen.height);
  const short = Math.min(window.screen.width, window.screen.height);
  // Only when the page really is drawn under the status bar (it is as tall as the screen). With an opaque
  // status bar the page starts below it and needs no padding.
  if (Math.abs(window.innerHeight - long) > 2) return 0;
  return estimateIPhoneTopInset(short, long);
}

/** Read the current safe area, and (re)apply the fallback to the page. */
export function applySafeArea(): SafeAreaInfo {
  const env = measureEnv();
  const fallbackTop = currentFallbackTop(env.top);
  const root = document.documentElement;
  if (fallbackTop > 0) root.style.setProperty('--safe-top-fallback', `${fallbackTop}px`);
  else root.style.removeProperty('--safe-top-fallback');
  return { standalone: isStandalone(), env, fallbackTop };
}

/**
 * Call once at start-up. Safe areas can be reported late (after the first paint, after a rotation, after the
 * app comes back from the background), so check again on those events.
 */
export function installSafeArea(): void {
  const update = () => applySafeArea();
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') update();
  });
  // Once more when everything has loaded, and shortly after: iOS fills in the inset after the first layout
  window.addEventListener('load', () => {
    update();
    window.setTimeout(update, 500);
  });
}

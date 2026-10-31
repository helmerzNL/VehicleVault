import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { applySafeArea, SafeAreaInfo } from '../utils/safeArea.js';

/** Which build of the page is running: the name of the hashed script the page was loaded with. */
const bundleName = () => {
  const src = document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute('src') || '';
  return src.split('/').pop()?.replace(/\.js$/, '') || '-';
};

/**
 * Settings tile that shows how the page sits on this screen: installed app or browser tab, the safe area the
 * device reports (notch / Dynamic Island / home indicator) and which build is running. It is what to look at
 * when the top bar does not clear the camera cut-out on a phone.
 */
export const DisplayDiagnostics: React.FC = () => {
  const { lang } = useLanguage();
  const [info, setInfo] = useState<SafeAreaInfo>(() => applySafeArea());

  useEffect(() => {
    const refresh = () => setInfo(applySafeArea());
    refresh();
    window.addEventListener('resize', refresh);
    return () => window.removeEventListener('resize', refresh);
  }, []);

  const nl = lang === 'nl';
  const topInUse = info.fallbackTop > 0 ? info.fallbackTop : info.env.top;

  return (
    <div className="col-span-2 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
      <span className="text-[10px] text-slate-400 uppercase font-bold block">
        {nl ? 'Weergave op dit toestel' : 'Display on this device'}
      </span>
      <dl className="mt-1.5 space-y-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">{nl ? 'Modus' : 'Mode'}</dt>
          <dd className="font-bold">{info.standalone ? (nl ? 'Geïnstalleerde app' : 'Installed app') : 'Browser'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">{nl ? 'Veilig vlak boven' : 'Safe area top'}</dt>
          <dd className="font-bold whitespace-nowrap">
            {topInUse}px
            {info.fallbackTop > 0 && (
              <span className="ml-1 font-normal text-amber-600 dark:text-amber-400">({nl ? 'geschat' : 'estimated'})</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">{nl ? 'Veilig vlak onder' : 'Safe area bottom'}</dt>
          <dd className="font-bold">{info.env.bottom}px</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">{nl ? 'Veilig vlak links / rechts' : 'Safe area left / right'}</dt>
          <dd className="font-bold">
            {info.env.left}px / {info.env.right}px
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Build</dt>
          <dd className="font-bold truncate">{bundleName()}</dd>
        </div>
      </dl>
    </div>
  );
};

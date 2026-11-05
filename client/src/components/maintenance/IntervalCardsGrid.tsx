import React from 'react';
import { ShieldCheck, Edit2, Trash2 } from 'lucide-react';
import { MaintenanceInterval } from '../../types/index.js';
import { IntervalProgressBar } from '../IntervalProgressBar.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface IntervalCardsGridProps {
  intervals: MaintenanceInterval[];
  onEditInterval: (interval: MaintenanceInterval) => void;
  onDeleteInterval: (id: string) => Promise<void>;
}

export const IntervalCardsGrid: React.FC<IntervalCardsGridProps> = ({
  intervals,
  onEditInterval,
  onDeleteInterval,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t('monitoredParts')} ({intervals.length})</span>
          </h2>
          <p className="text-[11px] text-slate-500">{t('colorLegend')}</p>
        </div>
      </div>

      {intervals.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-10">
          {t('noIntervalsConfigured')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intervals.map((interval) => (
            <div
              key={interval.id}
              className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <IntervalProgressBar interval={interval} />
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800/80 font-medium">
                <span>
                  {t('everyKm')} {interval.intervalKm?.toLocaleString() || '—'} km /{' '}
                  {interval.intervalMonths ? `${interval.intervalMonths} ${t('months')}` : '—'}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEditInterval(interval)}
                    className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                    title={t('editPart')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteInterval(interval.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


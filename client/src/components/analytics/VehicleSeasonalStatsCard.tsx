import React from 'react';
import { Sun, Snowflake, TrendingUp, TrendingDown, Fuel } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface SeasonalStatsProps {
  seasonalStats?: {
    hasData: boolean;
    summer: {
      period: string;
      fillCount: number;
      totalLiters: number;
      totalCost: number;
      totalDistanceKm: number;
      avgLPer100Km: number | null;
      avgKmPerLiter: number | null;
      avgCostPer100Km: number | null;
      avgPricePerLiter: number | null;
    };
    winter: {
      period: string;
      fillCount: number;
      totalLiters: number;
      totalCost: number;
      totalDistanceKm: number;
      avgLPer100Km: number | null;
      avgKmPerLiter: number | null;
      avgCostPer100Km: number | null;
      avgPricePerLiter: number | null;
    };
    delta: {
      diffLPer100Km: number | null;
      percentDiff: number | null;
      isWinterHigher: boolean;
    };
  };
}

export const VehicleSeasonalStatsCard: React.FC<SeasonalStatsProps> = ({ seasonalStats }) => {
  const { lang } = useLanguage();

  if (!seasonalStats || !seasonalStats.hasData) {
    return null;
  }

  const { summer, winter, delta } = seasonalStats;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'nl' ? 'Seizoensinvloed op Verbruik (Zomer vs. Winter)' : 'Seasonal Fuel Impact (Summer vs. Winter)'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'nl'
              ? 'Vergelijking van verbruik en brandstofkosten tussen de warme (apr-sep) en koude (okt-mrt) maanden.'
              : 'Direct efficiency comparison between warm (Apr-Sep) and cold (Oct-Mar) periods.'}
          </p>
        </div>

        {delta.diffLPer100Km !== null && (
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              delta.isWinterHigher
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50'
            }`}
          >
            {delta.isWinterHigher ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {delta.isWinterHigher ? '+' : ''}
              {delta.diffLPer100Km.toFixed(2)} l/100km ({delta.percentDiff && delta.percentDiff > 0 ? '+' : ''}
              {delta.percentDiff}%) {lang === 'nl' ? (delta.isWinterHigher ? 'in de winter' : 'in de winter') : 'in winter'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Summer Period Card */}
        <div className="p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-linear-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {lang === 'nl' ? 'Zomerperiode' : 'Summer Period'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {summer.period} • {summer.fillCount} {lang === 'nl' ? 'tankbeurten' : 'fill-ups'}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {summer.totalDistanceKm ? summer.totalDistanceKm.toLocaleString() : 0} km
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/50 dark:border-amber-900/30">
            <div>
              <span className="text-[10px] text-slate-500 block">{lang === 'nl' ? 'Gem. verbruik' : 'Avg consumption'}</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {summer.avgLPer100Km !== null ? `${summer.avgLPer100Km.toFixed(2)}` : '—'}
                <span className="text-[10px] font-normal text-slate-400 ml-1">l/100km</span>
              </span>
              {summer.avgKmPerLiter !== null && (
                <span className="text-[10px] text-slate-500 block font-mono">1 op {summer.avgKmPerLiter.toFixed(1)}</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">{lang === 'nl' ? 'Kosten / 100km' : 'Cost / 100km'}</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                € {summer.avgCostPer100Km !== null ? summer.avgCostPer100Km.toFixed(2) : '—'}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {summer.avgPricePerLiter !== null ? `€ ${summer.avgPricePerLiter.toFixed(3)}/L` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Winter Period Card */}
        <div className="p-4 rounded-xl border border-sky-200/70 dark:border-sky-900/40 bg-linear-to-br from-sky-50/50 to-indigo-50/30 dark:from-sky-950/20 dark:to-indigo-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
                <Snowflake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {lang === 'nl' ? 'Winterperiode' : 'Winter Period'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {winter.period} • {winter.fillCount} {lang === 'nl' ? 'tankbeurten' : 'fill-ups'}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {winter.totalDistanceKm ? winter.totalDistanceKm.toLocaleString() : 0} km
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-sky-200/50 dark:border-sky-900/30">
            <div>
              <span className="text-[10px] text-slate-500 block">{lang === 'nl' ? 'Gem. verbruik' : 'Avg consumption'}</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {winter.avgLPer100Km !== null ? `${winter.avgLPer100Km.toFixed(2)}` : '—'}
                <span className="text-[10px] font-normal text-slate-400 ml-1">l/100km</span>
              </span>
              {winter.avgKmPerLiter !== null && (
                <span className="text-[10px] text-slate-500 block font-mono">1 op {winter.avgKmPerLiter.toFixed(1)}</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">{lang === 'nl' ? 'Kosten / 100km' : 'Cost / 100km'}</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                € {winter.avgCostPer100Km !== null ? winter.avgCostPer100Km.toFixed(2) : '—'}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {winter.avgPricePerLiter !== null ? `€ ${winter.avgPricePerLiter.toFixed(3)}/L` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


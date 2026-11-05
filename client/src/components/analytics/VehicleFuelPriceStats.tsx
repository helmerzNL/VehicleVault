import React from 'react';
import { Fuel, TrendingDown, TrendingUp, Coins } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TcoSummary } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { formatDisplayDate } from '../../utils/format.js';

interface VehicleFuelPriceStatsProps {
  tco: TcoSummary | null;
}

export const VehicleFuelPriceStats: React.FC<VehicleFuelPriceStatsProps> = ({ tco }) => {
  const { t, lang } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Fuel className="w-4 h-4 text-amber-500" />
            <span>{t('fuelPriceStatsTitle')}</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            {t('fuelPriceStatsSubtitle')}
          </p>
        </div>
        {tco?.priceStats?.avgPrice && (
          <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800/40 self-start sm:self-auto font-mono">
            {t('weightedAverageOver', { liters: tco.fuelStats?.totalFuelLiters ? tco.fuelStats.totalFuelLiters.toFixed(1) : '0' })}
          </span>
        )}
      </div>

      {/* 3 Price Highlight Cards: Gemiddeld, Goedkoopste, Duurste */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gemiddelde Brandstofprijs */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">{t('avgFuelPrice')}</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {tco?.priceStats?.avgPrice ? `€ ${tco.priceStats.avgPrice.toFixed(3)}` : '—'}{' '}
              <span className="text-xs font-normal text-slate-400">/ L</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'nl' ? 'Gewogen gemiddelde literprijs' : 'Weighted average price per liter'}
            </p>
          </div>
        </div>

        {/* Goedkoopste Tankbeurt */}
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-1.5">
            <span className="text-xs font-bold flex items-center space-x-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('cheapestFuel')}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              {lang === 'nl' ? 'Laagste prijs' : 'Lowest price'}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {tco?.priceStats?.minPrice ? `€ ${tco.priceStats.minPrice.price.toFixed(3)}` : '—'}{' '}
              <span className="text-xs font-normal text-emerald-600/70 dark:text-emerald-400/70">/ L</span>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-1">
              {tco?.priceStats?.minPrice ? (
                <>
                  <span className="font-semibold">{formatDisplayDate(tco.priceStats.minPrice.date)}</span> • {tco.priceStats.minPrice.liters.toFixed(1)} L
                  {tco.priceStats.minPrice.station && ` • ${tco.priceStats.minPrice.station}`}
                </>
              ) : (
                lang === 'nl' ? 'Nog geen gegevens' : 'No data yet'
              )}
            </p>
          </div>
        </div>

        {/* Duurste Tankbeurt */}
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-800/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 mb-1.5">
            <span className="text-xs font-bold flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{t('mostExpensiveFuel')}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              {lang === 'nl' ? 'Hoogste prijs' : 'Highest price'}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
              {tco?.priceStats?.maxPrice ? `€ ${tco.priceStats.maxPrice.price.toFixed(3)}` : '—'}{' '}
              <span className="text-xs font-normal text-rose-600/70 dark:text-rose-400/70">/ L</span>
            </div>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-1">
              {tco?.priceStats?.maxPrice ? (
                <>
                  <span className="font-semibold">{formatDisplayDate(tco.priceStats.maxPrice.date)}</span> • {tco.priceStats.maxPrice.liters.toFixed(1)} L
                  {tco.priceStats.maxPrice.station && ` • ${tco.priceStats.maxPrice.station}`}
                </>
              ) : (
                lang === 'nl' ? 'Nog geen gegevens' : 'No data yet'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Price Evolution Chart */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('priceEvolution')}</span>
          </h4>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-amber-500 inline-block rounded-xs" />
              <span>{lang === 'nl' ? 'Literprijs (€/L)' : 'Price / L (€)'}</span>
            </span>
            {tco?.priceStats?.avgPrice && (
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 border-t border-dashed border-sky-400 inline-block" />
                <span>{lang === 'nl' ? 'Gemiddelde' : 'Average'} (€{tco.priceStats.avgPrice.toFixed(3)})</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-64 w-full bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60">
          {tco?.priceStats?.history && tco.priceStats.history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tco.priceStats.history}>
                <defs>
                  <linearGradient id="colorFuelPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={['dataMin - 0.05', 'dataMax + 0.05']}
                  tickFormatter={(v) => `€${Number(v).toFixed(2)}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const avg = tco?.priceStats?.avgPrice;
                      const diff = avg ? data.pricePerLiter - avg : 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-white text-xs space-y-1">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-4">
                            <span>{formatDisplayDate(data.date)}</span>
                            <span className="font-mono text-slate-400">{data.odometer.toLocaleString()} km</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">{lang === 'nl' ? 'Literprijs:' : 'Price/L:'}</span>
                            <span className="font-mono font-black text-amber-400 text-sm">€ {data.pricePerLiter.toFixed(3)}/L</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">{lang === 'nl' ? 'Aantal liters:' : 'Volume:'}</span>
                            <span className="font-mono font-semibold">{data.liters.toFixed(2)} L</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">{lang === 'nl' ? 'Totaalbedrag:' : 'Total Cost:'}</span>
                            <span className="font-mono font-semibold">€ {data.totalCost.toFixed(2)}</span>
                          </div>
                          {data.station && (
                            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800/80 text-[11px]">
                              <span className="text-slate-400">{lang === 'nl' ? 'Pomp/Notitie:' : 'Station:'}</span>
                              <span className="text-slate-300 font-medium truncate max-w-[150px]">{data.station}</span>
                            </div>
                          )}
                          {avg && (
                            <div className="pt-1 text-[10px] font-medium flex items-center space-x-1">
                              <span className={diff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                {diff > 0 ? `+€${diff.toFixed(3)}` : `-€${Math.abs(diff).toFixed(3)}`} {diff > 0 ? t('aboveAverage') : t('belowAverage')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {tco?.priceStats?.avgPrice && (
                  <ReferenceLine
                    y={tco.priceStats.avgPrice}
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="pricePerLiter"
                  name={lang === 'nl' ? 'Literprijs (€/L)' : 'Price / L (€)'}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFuelPrice)"
                  dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#f59e0b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              {lang === 'nl' ? 'Voer minimaal 1 tankbeurt in om het brandstofprijsverloop te zien.' : 'Log at least 1 fill-up to view fuel price evolution.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


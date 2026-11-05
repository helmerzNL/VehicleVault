import React from 'react';
import { Fuel, Gauge, Coins, MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { TcoSummary } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface VehicleTankDistanceStatsProps {
  tco: TcoSummary | null;
}

export const VehicleTankDistanceStats: React.FC<VehicleTankDistanceStatsProps> = ({ tco }) => {
  const { t, lang } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Fuel className="w-4 h-4 text-amber-500" />
            <span>{t('extendedTankStats')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('fullTankOnlyWarning')}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800/40 self-start sm:self-auto">
          Actieradius &amp; Station Intelligence
        </span>
      </div>

      {/* 4 Mini KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">{t('avgTankDistance')}</span>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {tco?.fuelStats?.avgDistancePerTank ? `${tco.fuelStats.avgDistancePerTank.toLocaleString()} km` : '—'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">{t('maxTankDistance')}</span>
          <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {tco?.fuelStats?.maxDistancePerTank ? `${tco.fuelStats.maxDistancePerTank.toLocaleString()} km` : '—'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">{t('fuelCostPer100Km')}</span>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {tco?.fuelStats?.avgCostPer100Km ? `€ ${tco.fuelStats.avgCostPer100Km.toFixed(2)}` : '—'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">{lang === 'nl' ? 'Totaal Getankte Liters' : 'Total Fuel Liters'}</span>
          <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
            {tco?.fuelStats?.totalFuelLiters ? `${tco.fuelStats.totalFuelLiters.toFixed(1)} L` : '—'}
          </span>
        </div>
      </div>

      {/* Towing Consumption Split */}
      {Boolean(tco?.fuelStats?.avgTowingLPer100Km) && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏕️</span>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-300">
                {lang === 'nl' ? 'Caravan / Aanhanger Verbruiksvergelijking' : 'Towing / Trailer Consumption Split'}
              </span>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                {lang === 'nl'
                  ? 'Verbruikscijfers gesplitst op basis van tankbeurten met aanhanger/caravan.'
                  : 'Fuel consumption isolated for towing vs. solo driving.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 font-mono font-bold self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-sans">SOLO VERBRUIK</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {tco?.fuelStats?.avgNormalLPer100Km ? `${tco.fuelStats.avgNormalLPer100Km.toFixed(2)} L/100km` : '—'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-sans">MET AANHANGER</span>
              <span className="text-amber-600 dark:text-amber-400">
                {tco?.fuelStats?.avgTowingLPer100Km ? `${tco.fuelStats.avgTowingLPer100Km.toFixed(2)} L/100km` : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Actieradius per Tankbeurt Chart */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-500" />
            <span>{t('tankDistanceTrend')}</span>
          </h4>
          <div className="h-60 w-full bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60">
            {tco?.fuelStats?.tripMetrics && tco.fuelStats.tripMetrics.filter((m) => m.deltaKm !== null).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tco.fuelStats.tripMetrics.filter((m) => m.deltaKm !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      borderColor: '#334155',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="deltaKm" name={lang === 'nl' ? 'Actieradius (km)' : 'Range (km)'} fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {lang === 'nl' ? 'Minimaal 2 tankbeurten vereist om actieradius per tank te berekenen.' : 'Need at least 2 fill-ups to calculate tank range.'}
              </div>
            )}
          </div>
        </div>

        {/* Brandstofkosten per 100km Trend */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('fuelCost100KmTrend')}</span>
          </h4>
          <div className="h-60 w-full bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60">
            {tco?.fuelStats?.tripMetrics && tco.fuelStats.tripMetrics.filter((m) => m.costPer100Km !== null).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tco.fuelStats.tripMetrics.filter((m) => m.costPer100Km !== null)}>
                  <defs>
                    <linearGradient id="colorCost100" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      borderColor: '#334155',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="costPer100Km"
                    name={lang === 'nl' ? 'Kosten per 100km (€)' : 'Cost / 100km (€)'}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCost100)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {lang === 'nl' ? 'Geen kosten per 100km gegevens beschikbaar.' : 'No cost per 100km data available.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tankstation & Brand Analysis Table */}
      {tco?.fuelStats?.stations && tco.fuelStats.stations.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('stationComparison')}</span>
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{t('station')}</th>
                  <th className="py-2.5 px-3">{t('fillCount')}</th>
                  <th className="py-2.5 px-3">{t('liters')}</th>
                  <th className="py-2.5 px-3">{t('avgPricePerLiterShort')}</th>
                  <th className="py-2.5 px-3 text-right">{t('totalSpendShort')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tco.fuelStats.stations.map((st) => (
                  <tr key={st.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {st.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {st.fillCount}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {st.totalLiters.toFixed(1)} L
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-mono font-semibold">
                      € {st.avgPricePerLiter.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      € {st.totalSpend.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


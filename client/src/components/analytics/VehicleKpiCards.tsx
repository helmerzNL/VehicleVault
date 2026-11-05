import React from 'react';
import { Coins, Gauge, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  Line,
} from 'recharts';
import { TcoSummary } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface VehicleKpiCardsProps {
  tco: TcoSummary | null;
  includePurchasePrice: boolean;
  includeFixedExpenses: boolean;
  economyUnit: 'l100km' | 'kml';
  setEconomyUnit: (v: 'l100km' | 'kml') => void;
}

export const VehicleKpiCards: React.FC<VehicleKpiCardsProps> = ({
  tco,
  includePurchasePrice,
  includeFixedExpenses,
  economyUnit,
  setEconomyUnit,
}) => {
  const { t, lang } = useLanguage();

  const fuelSpend = tco?.fuelTotal || 0;
  const serviceSpend = tco?.serviceTotal || 0;
  const fixedSpend = includeFixedExpenses ? (tco?.fixedExpensesTotal || 0) : 0;
  const grandTotal = (fuelSpend + serviceSpend + fixedSpend) || 1;

  const fuelPercent = Math.round((fuelSpend / grandTotal) * 100);
  const servicePercent = Math.round((serviceSpend / grandTotal) * 100);
  const fixedPercent = Math.round((fixedSpend / grandTotal) * 100);

  const validConsumption = tco?.fuelTrends
    ? tco.fuelTrends
        .filter((f) => f.lPer100Km !== null && f.lPer100Km > 0)
        .map((f) => f.lPer100Km as number)
    : [];

  const bestL100 = validConsumption.length > 0 ? Math.min(...validConsumption) : null;
  const worstL100 = validConsumption.length > 0 ? Math.max(...validConsumption) : null;

  return (
    <div className="space-y-6">
      {/* Uitgebreide KPI Kaarten */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Totale Uitgaven */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">
              {includePurchasePrice ? t('assetTco') : t('operationalTco')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            € {tco?.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {t('fuelSpend')}: €{tco?.fuelTotal.toFixed(2)} • {t('maintenanceSpend')}: €{tco?.serviceTotal.toFixed(2)}
            {tco?.fixedExpensesTotal ? ` • Vaste lasten: €${tco.fixedExpensesTotal.toFixed(2)}` : ''}
          </div>
        </div>

        {/* Kosten per KM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('costPerKm')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            € {tco?.costPerKm.toFixed(2) || '0.00'} <span className="text-xs font-normal text-slate-400">/ km</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'nl' ? `Over ${tco?.totalDistanceKm.toLocaleString() || 0} gereden km` : `Over ${tco?.totalDistanceKm.toLocaleString() || 0} driven km`}
          </span>
        </div>

        {/* Kosten per Maand */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('costPerMonth')}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            € {tco?.costPerMonth.toFixed(2) || '0.00'} <span className="text-xs font-normal text-slate-400">/ {t('months')}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'nl'
              ? `Gemiddeld over ${tco?.totalMonths || 1} ${tco?.totalMonths === 1 ? 'maand' : 'maanden'}${tco?.monthlyFixedCost ? ` (incl. €${tco.monthlyFixedCost.toFixed(2)} vaste lasten)` : ''}`
              : `Averaged over ${tco?.totalMonths || 1} ${tco?.totalMonths === 1 ? 'month' : 'months'}`}
          </span>
        </div>

        {/* Brandstofverbruik */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('consumption')}</span>
            <button
              onClick={() => setEconomyUnit(economyUnit === 'l100km' ? 'kml' : 'l100km')}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold uppercase hover:bg-slate-200 transition"
            >
              {economyUnit === 'l100km' ? 'L/100km' : (lang === 'nl' ? '1 op X' : 'km/L')}
            </button>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {economyUnit === 'kml'
              ? tco?.avgKmPerLiter
                ? (lang === 'nl' ? `1 op ${tco.avgKmPerLiter.toFixed(1)}` : `${tco.avgKmPerLiter.toFixed(1)} km/L`)
                : '—'
              : tco?.avgLPer100Km
              ? `${tco.avgLPer100Km.toFixed(2)} L/100`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between flex-wrap gap-1">
            <span>
              {economyUnit === 'kml'
                ? tco?.avgLPer100Km ? `(${tco.avgLPer100Km.toFixed(2)} L/100km)` : ''
                : tco?.avgKmPerLiter ? (lang === 'nl' ? `(1 op ${tco.avgKmPerLiter.toFixed(1)})` : `(${tco.avgKmPerLiter.toFixed(1)} km/L)`) : ''}
            </span>
            <span>{lang === 'nl' ? 'Gem. Literprijs:' : 'Avg Price/L:'} {tco?.avgPricePerLiter ? `€ ${tco.avgPricePerLiter.toFixed(3)}/L` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Financiële Uitsplitsing Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-colors">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
          {lang === 'nl' ? 'Verhouding Kostenposten (Operationeel)' : 'Cost Ratio (Operational)'}
        </h3>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${fuelPercent}%` }}
            title={`Fuel: ${fuelPercent}% (€${fuelSpend.toFixed(2)})`}
          />
          <div
            className="bg-sky-500 transition-all duration-500"
            style={{ width: `${servicePercent}%` }}
            title={`Maintenance: ${servicePercent}% (€${serviceSpend.toFixed(2)})`}
          />
          {includeFixedExpenses && fixedSpend > 0 && (
            <div
              className="bg-indigo-500 transition-all duration-500"
              style={{ width: `${fixedPercent}%` }}
              title={`Fixed: ${fixedPercent}% (€${fixedSpend.toFixed(2)})`}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-semibold mt-3 text-slate-600 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{t('fuelSpend')}: {fuelPercent}% (€{fuelSpend.toFixed(2)})</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>{t('maintenanceSpend')}: {servicePercent}% (€{serviceSpend.toFixed(2)})</span>
          </div>

          {includeFixedExpenses && fixedSpend > 0 && (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Vaste lasten: {fixedPercent}% (€{fixedSpend.toFixed(2)})</span>
            </div>
          )}

          {bestL100 && worstL100 && (
            <div className="text-[11px] text-slate-500 hidden sm:block">
              {lang === 'nl' ? 'Zuinigste:' : 'Best:'}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {lang === 'nl' ? `1 op ${(100 / bestL100).toFixed(1)} (${bestL100} L/100km)` : `${bestL100} L/100km`}
              </span>{' '}
              • {lang === 'nl' ? 'Hoogste verbruik:' : 'Worst:'}{' '}
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {lang === 'nl' ? `1 op ${(100 / worstL100).toFixed(1)} (${worstL100} L/100km)` : `${worstL100} L/100km`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Visualisaties (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brandstofverbruik Trend & Rolling Average */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('fuelEconomyTrend')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'nl' ? 'Liters per 100 km over opeenvolgende volle tanks' : 'Liters per 100 km across consecutive full tanks'}
              </p>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              {lang === 'nl' ? 'Lager = Zuiniger' : 'Lower = Better'}
            </span>
          </div>

          <div className="h-64 w-full">
            {tco && tco.fuelTrends.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tco.fuelTrends}>
                  <defs>
                    <linearGradient id="colorTrip" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      borderColor: '#334155',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="lPer100Km"
                    name={lang === 'nl' ? 'Verbruik Tankbeurt (L/100km)' : 'Fill-up (L/100km)'}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTrip)"
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingAvgLPer100Km"
                    name={t('rollingAverage')}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {lang === 'nl'
                  ? 'Voer minimaal 2 opeenvolgende volle tankbeurten in om het verbruiksverloop te zien.'
                  : 'Log at least 2 consecutive full tanks to see fuel consumption trend.'}
              </div>
            )}
          </div>
        </div>

        {/* Maandelijkse Kostenverdeling */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('monthlyCostBreakdown')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'nl' ? 'Uitsplitsing tussen brandstof, beurten en reparaties' : 'Breakdown between fuel, regular service and repairs'}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {lang === 'nl' ? 'Per kalendermaand' : 'Per month'}
            </span>
          </div>

          <div className="h-64 w-full">
            {tco && tco.monthlyBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tco.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="fuel" name={lang === 'nl' ? 'Brandstof (€)' : 'Fuel (€)'} stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="regularMaintenance" name={lang === 'nl' ? 'Periodiek Onderhoud (€)' : 'Maintenance (€)'} stackId="a" fill="#38bdf8" />
                  <Bar dataKey="unscheduledRepairs" name={lang === 'nl' ? 'Reparaties (€)' : 'Repairs (€)'} stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {lang === 'nl'
                  ? 'Nog geen maandelijkse uitgaven geregistreerd in dit tijdsbereik.'
                  : 'No monthly expenses recorded in this period.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

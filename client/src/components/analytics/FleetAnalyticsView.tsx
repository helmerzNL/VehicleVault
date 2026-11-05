import React from 'react';
import { Coins, Gauge, Fuel, Download } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext.js';
import { FleetBenchmarkCard } from './FleetBenchmarkCard.js';

interface FleetAnalyticsViewProps {
  fleetData: any;
  fleetLoading: boolean;
  exportCsv: () => void;
}

export const FleetAnalyticsView: React.FC<FleetAnalyticsViewProps> = ({
  fleetData,
  fleetLoading,
  exportCsv,
}) => {
  const { lang } = useLanguage();

  if (fleetLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        {lang === 'nl' ? 'Wagenpark data laden...' : 'Loading fleet analytics...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fleet KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">
              {lang === 'nl' ? 'Totale Garage Uitgaven' : 'Total Fleet Spend'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            € {fleetData?.fleetTotalCost ? fleetData.fleetTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {lang === 'nl' ? `Over ${fleetData?.vehicleCount || 0} actieve voertuigen` : `Across ${fleetData?.vehicleCount || 0} active vehicles`}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">
              {lang === 'nl' ? 'Gem. Kosten / KM (Vloot)' : 'Avg Cost / KM (Fleet)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            € {fleetData?.fleetCostPerKm ? fleetData.fleetCostPerKm.toFixed(2) : '0.00'}{' '}
            <span className="text-xs font-normal text-slate-400">/ km</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'nl'
              ? `Totaal ${fleetData?.fleetTotalDistanceKm ? fleetData.fleetTotalDistanceKm.toLocaleString() : 0} gereden km`
              : `Total ${fleetData?.fleetTotalDistanceKm ? fleetData.fleetTotalDistanceKm.toLocaleString() : 0} km`}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">
              {lang === 'nl' ? 'Brandstof & Laden' : 'Fuel & Charging'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            € {fleetData?.fleetFuelTotal ? fleetData.fleetFuelTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'nl' ? 'Brandstof- & laadkosten' : 'Fuel and charging costs'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">
              {lang === 'nl' ? 'Onderhoud & Reparaties' : 'Maintenance & Repairs'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            € {fleetData?.fleetServiceTotal ? fleetData.fleetServiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'nl' ? 'Periodiek onderhoud & herstel' : 'Regular service and repairs'}
          </span>
        </div>
      </div>

      {/* Voertuig-Benchmark & Kostenranking */}
      <FleetBenchmarkCard vehicles={fleetData?.vehicles || []} />

      {/* Wagenpark Vergelijkingstabel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'nl' ? 'Wagenpark Vergelijkingstabel' : 'Fleet Comparison Table'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'nl' ? 'Kosten en prestaties naast elkaar per voertuig' : 'Side-by-side cost and performance per vehicle'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">{lang === 'nl' ? 'Voertuig' : 'Vehicle'}</th>
                <th className="py-2.5 px-3">{lang === 'nl' ? 'Kenteken' : 'Plate'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Gereden KM' : 'Driven KM'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Brandstof' : 'Fuel'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Onderhoud' : 'Service'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Vaste Lasten' : 'Fixed'}</th>
                <th className="py-2.5 px-3 text-right font-bold">{lang === 'nl' ? 'Totale Kosten' : 'Total'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Kosten / KM' : 'Cost / KM'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(fleetData?.vehicles || []).map((fv: any) => (
                <tr key={fv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                    {fv.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {fv.license_plate || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {fv.totalDistanceKm ? `${fv.totalDistanceKm.toLocaleString()} km` : '0 km'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {fv.fuelTotal ? fv.fuelTotal.toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {fv.serviceTotal ? fv.serviceTotal.toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {fv.fixedExpensesTotal ? fv.fixedExpensesTotal.toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    € {fv.totalCost ? fv.totalCost.toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    € {fv.costPerKm ? fv.costPerKm.toFixed(2) : '0.00'} /km
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet Monthly Cost Chart & Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'nl' ? 'Geconsolideerde Maandelijkse Kosten (Wagenpark)' : 'Consolidated Monthly Fleet Spend'}
            </h3>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Exporteren</span>
          </button>
        </div>

        <div className="h-64 w-full">
          {fleetData && fleetData.monthlyBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetData.monthlyBreakdown}>
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
                <Bar dataKey="fuel" name={lang === 'nl' ? 'Brandstof (€)' : 'Fuel (€)'} stackId="a" fill="#f59e0b" />
                <Bar dataKey="regularMaintenance" name={lang === 'nl' ? 'Periodiek Onderhoud (€)' : 'Maintenance (€)'} stackId="a" fill="#38bdf8" />
                <Bar dataKey="unscheduledRepairs" name={lang === 'nl' ? 'Reparaties (€)' : 'Repairs (€)'} stackId="a" fill="#f43f5e" />
                <Bar dataKey="fixedExpenses" name={lang === 'nl' ? 'Vaste Lasten (€)' : 'Fixed Expenses (€)'} stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              {lang === 'nl' ? 'Geen maandelijkse gegevens beschikbaar voor het wagenpark.' : 'No monthly fleet data.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


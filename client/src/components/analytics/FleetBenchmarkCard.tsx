import React from 'react';
import { Trophy, Award, Fuel, Car, Bike, Truck, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface FleetBenchmarkVehicle {
  id: string;
  name: string;
  license_plate?: string | null;
  type: string;
  totalCost: number;
  fuelTotal: number;
  serviceTotal: number;
  fixedExpensesTotal: number;
  costPerKm: number;
  totalDistanceKm: number;
  avgLPer100Km: number | null;
  avgKmPerLiter: number | null;
}

interface FleetBenchmarkCardProps {
  vehicles: FleetBenchmarkVehicle[];
}

export const FleetBenchmarkCard: React.FC<FleetBenchmarkCardProps> = ({ vehicles }) => {
  const { lang } = useLanguage();

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  // Rank vehicles by cost per km (ascending: lowest cost per km first)
  const rankedByCostPerKm = [...vehicles]
    .filter((v) => v.costPerKm > 0 || v.totalDistanceKm > 0)
    .sort((a, b) => (a.costPerKm || 9999) - (b.costPerKm || 9999));

  // Find most economical vehicle by fuel
  const rankedByFuel = [...vehicles]
    .filter((v) => v.avgLPer100Km && v.avgLPer100Km > 0)
    .sort((a, b) => (a.avgLPer100Km || 99) - (b.avgLPer100Km || 99));

  const bestCostVehicle = rankedByCostPerKm[0] || null;
  const bestFuelVehicle = rankedByFuel[0] || null;

  const maxCostPerKm = Math.max(
    ...rankedByCostPerKm.map((v) => v.costPerKm || 0),
    0.5
  );

  const getVehicleIcon = (type: string) => {
    if (type === 'motorcycle') return <Bike className="w-4 h-4 text-sky-500" />;
    if (type === 'van' || type === 'trailer') return <Truck className="w-4 h-4 text-emerald-500" />;
    return <Car className="w-4 h-4 text-sky-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'nl' ? 'Voertuig-Benchmark & Kostenranking' : 'Vehicle Benchmark & Cost Ranking'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'nl'
              ? 'Vergelijk de kostenefficiëntie en het verbruik van al je eigen voertuigen onderling.'
              : 'Compare the cost efficiency and fuel economy across all your personal vehicles.'}
          </p>
        </div>
      </div>

      {/* Highlights / Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bestCostVehicle && (
          <div className="p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                {lang === 'nl' ? 'Meest voordelig per kilometer' : 'Lowest cost per kilometer'}
              </span>
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                {bestCostVehicle.name}
              </span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 ml-2">
                € {bestCostVehicle.costPerKm.toFixed(2)} /km
              </span>
            </div>
          </div>
        )}

        {bestFuelVehicle && (
          <div className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                {lang === 'nl' ? 'Zuinigste brandstofverbruik' : 'Best fuel economy'}
              </span>
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                {bestFuelVehicle.name}
              </span>
              <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 ml-2">
                {bestFuelVehicle.avgLPer100Km?.toFixed(2)} l/100km
                {bestFuelVehicle.avgKmPerLiter ? ` (1 op ${bestFuelVehicle.avgKmPerLiter.toFixed(1)})` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Comparative List with Relative Progress Bars */}
      <div className="space-y-3 pt-2">
        {rankedByCostPerKm.map((v, idx) => {
          const barWidthPercent = maxCostPerKm > 0 ? Math.min(100, Math.max(10, ((v.costPerKm || 0) / maxCostPerKm) * 100)) : 20;
          const rankBadge = idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;

          const totalSpend = v.totalCost || 1;
          const fuelShare = Math.round((v.fuelTotal / totalSpend) * 100);
          const serviceShare = Math.round((v.serviceTotal / totalSpend) * 100);
          const fixedShare = Math.max(0, 100 - fuelShare - serviceShare);

          return (
            <div
              key={v.id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shrink-0">
                    {rankBadge}
                  </span>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {getVehicleIcon(v.type)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {v.name}
                    </span>
                    {v.license_plate && (
                      <span className="text-[10px] font-mono text-slate-400 ml-2 font-medium">
                        [{v.license_plate}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  {v.avgLPer100Km !== null && (
                    <span className="text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                      <Fuel className="w-3 h-3 text-amber-500" />
                      <span>{v.avgLPer100Km.toFixed(1)} l/100km</span>
                    </span>
                  )}
                  <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      € {v.costPerKm ? v.costPerKm.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">/km</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Relative Cost / KM */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${barWidthPercent}%` }}
                    className={`h-full transition-all duration-500 rounded-full ${
                      idx === 0
                        ? 'bg-emerald-500'
                        : idx === 1
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Mini Cost Breakdown Pills */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                <span>
                  {lang === 'nl' ? 'Totaal gereden:' : 'Total driven:'}{' '}
                  <strong className="text-slate-700 dark:text-slate-300 font-mono">
                    {v.totalDistanceKm ? v.totalDistanceKm.toLocaleString() : 0} km
                  </strong>
                </span>
                <div className="flex items-center space-x-2 font-mono text-[10px]">
                  <span>⛽ Brandstof: {fuelShare}%</span>
                  <span>•</span>
                  <span>🔧 Onderhoud: {serviceShare}%</span>
                  <span>•</span>
                  <span>📑 Vast: {fixedShare}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

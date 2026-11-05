import React from 'react';
import {
  Sun,
  Snowflake,
  CloudSun,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TireSet } from '../../types/index.js';

interface MountedTireCardProps {
  activeMountedSet: TireSet;
  onTread: (set: TireSet) => void;
  onEdit: (set: TireSet) => void;
}

export const MountedTireCard: React.FC<MountedTireCardProps> = ({
  activeMountedSet,
  onTread,
  onEdit,
}) => {
  const getTreadColorClass = (depth: number | null | undefined, season: string) => {
    if (depth === null || depth === undefined) return 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    if (depth < 1.6) return 'text-rose-700 bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 font-black';
    if (season === 'winter' && depth < 4.0) return 'text-amber-700 bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 font-bold';
    if (depth < 2.5) return 'text-amber-700 bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 font-bold';
    return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 font-bold';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Momenteel Gemonteerd</span>
            </span>

            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/90 border border-white/10 flex items-center space-x-1.5">
              {activeMountedSet.season === 'summer' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zomerset</span>
                </>
              ) : activeMountedSet.season === 'winter' ? (
                <>
                  <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                  <span>Winterset</span>
                </>
              ) : (
                <>
                  <CloudSun className="w-3.5 h-3.5 text-emerald-400" />
                  <span>4-Seizoenen</span>
                </>
              )}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight">{activeMountedSet.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-bold text-white">
                {activeMountedSet.brand
                  ? `${activeMountedSet.brand}${activeMountedSet.model ? ` ${activeMountedSet.model}` : ''}`
                  : (activeMountedSet.brand_model || 'Merk onbekend')}
              </span>
              {activeMountedSet.tire_size && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 font-mono text-[11px] font-bold border border-white/10">
                  {activeMountedSet.tire_size}
                </span>
              )}
              {activeMountedSet.rim_size && (
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-400/30">
                  {activeMountedSet.rim_size} velgen
                </span>
              )}
              {activeMountedSet.speed_index && (
                <span className="px-2 py-0.5 rounded-md bg-sky-400/20 text-sky-200 font-mono text-[11px] font-bold border border-sky-400/30" title="Draagkracht & snelheidsindex">
                  Index: {activeMountedSet.speed_index}
                </span>
              )}
              {activeMountedSet.dot_code && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono text-[11px] border border-white/10">
                  DOT {activeMountedSet.dot_code}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Gereden Kilometers</span>
              <span className="text-sm font-black font-mono text-white">
                {((activeMountedSet.current_km !== undefined ? activeMountedSet.current_km : activeMountedSet.total_km) || 0).toLocaleString('nl-NL')} km
              </span>
            </div>
            {activeMountedSet.storage_location && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Opslaglocatie (indien gewisseld)</span>
                <span className="text-sm font-semibold text-slate-200">{activeMountedSet.storage_location}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Wettelijke Status</span>
              {activeMountedSet.treadStatus === 'critical' ? (
                <span className="text-xs font-black text-rose-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Afkeur APK (&lt;1.6 mm)</span>
                </span>
              ) : activeMountedSet.treadStatus === 'warning' ? (
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Vervanging advies</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Veilig profiel</span>
                </span>
              )}
            </div>
            {Number(activeMountedSet.purchase_price) > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Aanschaf & Slijtage</span>
                <span className="text-sm font-black font-mono text-emerald-300">
                  € {Number(activeMountedSet.purchase_price).toFixed(2)}
                  {activeMountedSet.wear_cost_per_1000km ? ` (${activeMountedSet.wear_cost_per_1000km}/1.000 km)` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={() => onTread(activeMountedSet)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 border border-white/15"
            >
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Profieldiepte Meten</span>
            </button>
            <button
              onClick={() => onEdit(activeMountedSet)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              Details & Km Bewerken
            </button>
          </div>
        </div>

        {/* Visual 4-Wheel Chassis Tread Depth Diagram */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-700/80 shrink-0 self-center">
          <div className="text-[11px] font-bold text-slate-400 text-center mb-3 uppercase tracking-wider flex items-center justify-center space-x-1">
            <span>Voertuig Onderstel (Bovenaanzicht)</span>
          </div>

          <div className="relative w-52 h-44 mx-auto flex flex-col justify-between p-2">
            <div className="absolute inset-x-12 inset-y-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center">
              <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest rotate-90">
                VOOR ➔
              </div>
            </div>

            <div className="flex items-center justify-between z-10">
              <div className={`p-2 rounded-xl border text-center min-w-[70px] ${getTreadColorClass(activeMountedSet.tread_depth_fl, activeMountedSet.season)} shadow-sm`}>
                <div className="text-[9px] uppercase font-bold tracking-wider">LV</div>
                <div className="text-xs font-black">{activeMountedSet.tread_depth_fl !== null ? `${activeMountedSet.tread_depth_fl} mm` : '-'}</div>
              </div>

              <div className={`p-2 rounded-xl border text-center min-w-[70px] ${getTreadColorClass(activeMountedSet.tread_depth_fr, activeMountedSet.season)} shadow-sm`}>
                <div className="text-[9px] uppercase font-bold tracking-wider">RV</div>
                <div className="text-xs font-black">{activeMountedSet.tread_depth_fr !== null ? `${activeMountedSet.tread_depth_fr} mm` : '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between z-10">
              <div className={`p-2 rounded-xl border text-center min-w-[70px] ${getTreadColorClass(activeMountedSet.tread_depth_rl, activeMountedSet.season)} shadow-sm`}>
                <div className="text-[9px] uppercase font-bold tracking-wider">LA</div>
                <div className="text-xs font-black">{activeMountedSet.tread_depth_rl !== null ? `${activeMountedSet.tread_depth_rl} mm` : '-'}</div>
              </div>

              <div className={`p-2 rounded-xl border text-center min-w-[70px] ${getTreadColorClass(activeMountedSet.tread_depth_rr, activeMountedSet.season)} shadow-sm`}>
                <div className="text-[9px] uppercase font-bold tracking-wider">RA</div>
                <div className="text-xs font-black">{activeMountedSet.tread_depth_rr !== null ? `${activeMountedSet.tread_depth_rr} mm` : '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


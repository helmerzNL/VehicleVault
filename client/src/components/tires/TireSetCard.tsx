import React from 'react';
import {
  Sun,
  Snowflake,
  CloudSun,
  ArrowLeftRight,
  Gauge,
  Warehouse,
  Pencil,
  Trash2,
} from 'lucide-react';
import { TireSet } from '../../types/index.js';

interface TireSetCardProps {
  tireSet: TireSet;
  isMounted: boolean;
  onSwap: (set: TireSet) => void;
  onTread: (set: TireSet) => void;
  onEdit: (set: TireSet) => void;
  onDelete: (id: string) => void;
}

export const TireSetCard: React.FC<TireSetCardProps> = ({
  tireSet: set,
  isMounted,
  onSwap,
  onTread,
  onEdit,
  onDelete,
}) => {
  const getTreadColorClass = (depth: number | null | undefined, season: string) => {
    if (depth === null || depth === undefined) return 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    if (depth < 1.6) return 'text-rose-700 bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 font-black';
    if (season === 'winter' && depth < 4.0) return 'text-amber-700 bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 font-bold';
    if (depth < 2.5) return 'text-amber-700 bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 font-bold';
    return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 font-bold';
  };

  return (
    <div
      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
        isMounted
          ? 'bg-white dark:bg-slate-900 border-emerald-500/50 dark:border-emerald-500/40'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1">
            {set.season === 'summer' ? (
              <><Sun className="w-3 h-3 text-amber-500" /><span>Zomer</span></>
            ) : set.season === 'winter' ? (
              <><Snowflake className="w-3 h-3 text-sky-500" /><span>Winter</span></>
            ) : (
              <><CloudSun className="w-3 h-3 text-emerald-500" /><span>4-Seizoenen</span></>
            )}
          </span>

          {isMounted ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Gemonteerd
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center space-x-1">
              <Warehouse className="w-3 h-3" />
              <span>{set.storage_location || 'Opslag'}</span>
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{set.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {set.brand ? `${set.brand}${set.model ? ` ${set.model}` : ''}` : set.brand_model || 'Merk onbekend'}
            {set.tire_size && ` • ${set.tire_size}`}
            {set.rim_size && ` (${set.rim_size})`}
          </p>
        </div>

        {/* 4-Wheel Tread Matrix */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[
            { label: 'LV', val: set.tread_depth_fl },
            { label: 'RV', val: set.tread_depth_fr },
            { label: 'LA', val: set.tread_depth_rl },
            { label: 'RA', val: set.tread_depth_rr },
          ].map((w) => (
            <div
              key={w.label}
              className={`p-1.5 rounded-lg border text-center ${getTreadColorClass(w.val, set.season)}`}
            >
              <div className="text-[9px] font-bold opacity-75">{w.label}</div>
              <div className="text-xs font-black">{w.val !== null ? `${w.val}` : '-'}</div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center text-slate-500 dark:text-slate-400">
          <div>
            <span className="text-[10px] block text-slate-400">Gereden:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {((set.current_km !== undefined ? set.current_km : set.total_km) || 0).toLocaleString('nl-NL')} km
            </span>
          </div>
          {Number(set.purchase_price) > 0 && (
            <div className="text-right">
              <span className="text-[10px] block text-slate-400">Prijs:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                € {Number(set.purchase_price).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-1">
          {!isMounted && (
            <button
              onClick={() => onSwap(set)}
              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold inline-flex items-center space-x-1"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Monteren</span>
            </button>
          )}
          <button
            onClick={() => onTread(set)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Profieldiepte meten"
          >
            <Gauge className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(set)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Bewerken"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onDelete(set.id)}
          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
          title="Verwijderen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

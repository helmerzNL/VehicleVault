import React from 'react';
import { Gauge, Briefcase, Building2, Home } from 'lucide-react';
import { TripSummary } from '../../types/index.js';

interface TripSummaryCardsProps {
  summary: TripSummary | null;
}

export const TripSummaryCards: React.FC<TripSummaryCardsProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Totaal Afstand</span>
          <Gauge className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
          {summary.totalDistance.toLocaleString('nl-NL')} <span className="text-xs font-normal text-slate-500">km</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">{summary.totalTrips} ritten geregistreerd</div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Zakelijk</span>
          <Briefcase className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
          {summary.businessDistance.toLocaleString('nl-NL')} <span className="text-xs font-normal text-slate-500">km</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{summary.businessPercentage}% zakelijk aandeel</div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Woon-werk</span>
          <Building2 className="w-4 h-4 text-sky-500" />
        </div>
        <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400">
          {summary.commuteDistance.toLocaleString('nl-NL')} <span className="text-xs font-normal text-slate-500">km</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">Vaste woon-werkkilometers</div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Privé</span>
          <Home className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
          {summary.privateDistance.toLocaleString('nl-NL')} <span className="text-xs font-normal text-slate-500">km</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {summary.privateDistance <= 500 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Onder de 500 km grens</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Boven de 500 km grens</span>
          )}
        </div>
      </div>
    </div>
  );
};


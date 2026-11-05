import React from 'react';
import { Landmark } from 'lucide-react';
import { Vehicle, TcoSummary } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface TcoFiltersProps {
  timePreset: '30d' | '6m' | 'ytd' | 'all';
  onPresetChange: (preset: '30d' | '6m' | 'ytd' | 'all') => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  minOdometer: string;
  setMinOdometer: (v: string) => void;
  maxOdometer: string;
  setMaxOdometer: (v: string) => void;
  includePurchasePrice: boolean;
  setIncludePurchasePrice: (v: boolean) => void;
  includeFixedExpenses: boolean;
  setIncludeFixedExpenses: (v: boolean) => void;
  setTimePreset: (v: '30d' | '6m' | 'ytd' | 'all') => void;
  selectedVehicle: Vehicle | null;
  tco: TcoSummary | null;
}

export const TcoFilters: React.FC<TcoFiltersProps> = ({
  timePreset,
  onPresetChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  minOdometer,
  setMinOdometer,
  maxOdometer,
  setMaxOdometer,
  includePurchasePrice,
  setIncludePurchasePrice,
  includeFixedExpenses,
  setIncludeFixedExpenses,
  setTimePreset,
  selectedVehicle,
  tco,
}) => {
  const { t, lang } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-xs shadow-xs transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
          <button
            onClick={() => onPresetChange('30d')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timePreset === '30d'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('last30Days')}
          </button>
          <button
            onClick={() => onPresetChange('6m')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timePreset === '6m'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('last6Months')}
          </button>
          <button
            onClick={() => onPresetChange('ytd')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timePreset === 'ytd'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('ytd')}
          </button>
          <button
            onClick={() => onPresetChange('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timePreset === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('allTime')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Explicit TCO Toggle: Vaste lasten meerekenen */}
          <label className="flex items-center space-x-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer select-none shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={includeFixedExpenses}
              onChange={(e) => setIncludeFixedExpenses(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5 text-xs">
              <Landmark className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {lang === 'nl' ? 'Vaste lasten meerekenen' : 'Include fixed expenses'}
                {tco?.fixedExpensesTotal ? ` (€${tco.fixedExpensesTotal.toFixed(0)})` : ''}
              </span>
            </span>
          </label>

          {/* Explicit TCO Toggle: Aankoopbedrag meerekenen */}
          {selectedVehicle && (
            <label className="flex items-center space-x-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer select-none shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={includePurchasePrice}
                onChange={(e) => setIncludePurchasePrice(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                {t('includePurchaseToggle')} (€{selectedVehicle.purchase_price?.toLocaleString() || 0})
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Custom DatePicker Range & Odometer Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
        <div>
          <DatePicker
            label={lang === 'nl' ? 'Vanaf Datum' : 'Start Date'}
            value={startDate}
            onChange={(v) => {
              setTimePreset('all');
              setStartDate(v);
            }}
            placeholder={lang === 'nl' ? 'Geen beginfilter' : 'No start filter'}
          />
        </div>
        <div>
          <DatePicker
            label={lang === 'nl' ? 'Tot en met Datum' : 'End Date'}
            value={endDate}
            onChange={(v) => {
              setTimePreset('all');
              setEndDate(v);
            }}
            placeholder={lang === 'nl' ? 'Geen eindfilter' : 'No end filter'}
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
            {lang === 'nl' ? 'Minimale KM-stand' : 'Minimum Odometer (km)'}
          </label>
          <input
            type="number"
            value={minOdometer}
            onChange={(e) => setMinOdometer(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
            {lang === 'nl' ? 'Maximale KM-stand' : 'Maximum Odometer (km)'}
          </label>
          <input
            type="number"
            value={maxOdometer}
            onChange={(e) => setMaxOdometer(e.target.value)}
            placeholder="e.g. 75000"
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};


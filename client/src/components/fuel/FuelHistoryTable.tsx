import React, { useState } from 'react';
import {
  History,
  Fuel,
  MapPin,
  FileText,
  Image,
  Sparkles,
  Camera,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FuelEntry } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { formatDisplayDate } from '../../utils/format.js';

interface FuelHistoryTableProps {
  entries: FuelEntry[];
  towingFilter: 'all' | 'solo' | 'towing';
  setTowingFilter: (filter: 'all' | 'solo' | 'towing') => void;
  onEditEntry: (entry: FuelEntry, shouldScan?: boolean) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onAttachReceipt: (entry: FuelEntry) => void;
}

export const FuelHistoryTable: React.FC<FuelHistoryTableProps> = ({
  entries,
  towingFilter,
  setTowingFilter,
  onEditEntry,
  onDeleteEntry,
  onAttachReceipt,
}) => {
  const { t, lang } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Split consumption calculations (Solo vs. Towing)
  const soloPairs: { km: number; liters: number }[] = [];
  const towingPairs: { km: number; liters: number }[] = [];

  for (let i = 0; i < entries.length - 1; i++) {
    const curr = entries[i];
    const prev = entries[i + 1];
    if (curr.is_full_tank && !curr.missed_previous && prev.is_full_tank) {
      const deltaKm = curr.odometer - prev.odometer;
      if (deltaKm > 0 && curr.liters > 0) {
        if (curr.is_towing) {
          towingPairs.push({ km: deltaKm, liters: curr.liters });
        } else {
          soloPairs.push({ km: deltaKm, liters: curr.liters });
        }
      }
    }
  }

  const soloKmTotal = soloPairs.reduce((a, b) => a + b.km, 0);
  const soloLitersTotal = soloPairs.reduce((a, b) => a + b.liters, 0);
  const soloAvgKmL = soloLitersTotal > 0 ? soloKmTotal / soloLitersTotal : null;
  const soloAvgL100 = soloKmTotal > 0 ? (soloLitersTotal / soloKmTotal) * 100 : null;

  const towingKmTotal = towingPairs.reduce((a, b) => a + b.km, 0);
  const towingLitersTotal = towingPairs.reduce((a, b) => a + b.liters, 0);
  const towingAvgKmL = towingLitersTotal > 0 ? towingKmTotal / towingLitersTotal : null;
  const towingAvgL100 = towingKmTotal > 0 ? (towingLitersTotal / towingKmTotal) * 100 : null;

  const filteredEntries = entries.filter((e) => {
    if (towingFilter === 'solo') return !e.is_towing;
    if (towingFilter === 'towing') return Boolean(e.is_towing);
    return true;
  });

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage) || 1;
  const displayedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('recentFuelEntries')} ({filteredEntries.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {soloAvgKmL !== null && (
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[10px] font-bold">
              {lang === 'nl' ? 'Solo' : 'Normal'}: 1 op {soloAvgKmL.toFixed(1)} ({soloAvgL100?.toFixed(1)} L/100)
            </span>
          )}
          {towingAvgKmL !== null && (
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[10px] font-bold flex items-center space-x-1">
              <span>🏕️</span>
              <span>{lang === 'nl' ? 'Aanhanger' : 'Towing'}: 1 op {towingAvgKmL.toFixed(1)} ({towingAvgL100?.toFixed(1)} L/100)</span>
            </span>
          )}

          {/* Towing Filter Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold border border-slate-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTowingFilter('all')}
              className={`px-2 py-0.5 rounded-lg transition ${
                towingFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'nl' ? 'Alles' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setTowingFilter('solo')}
              className={`px-2 py-0.5 rounded-lg transition ${
                towingFilter === 'solo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => setTowingFilter('towing')}
              className={`px-2 py-0.5 rounded-lg transition flex items-center space-x-1 ${
                towingFilter === 'towing'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <span>🏕️</span>
              <span>{lang === 'nl' ? 'Aanhanger' : 'Towing'}</span>
            </button>
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          <Fuel className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <span>{lang === 'nl' ? 'Nog geen tankbeurten geregistreerd voor dit filter.' : 'No entries found for this filter.'}</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">{t('date')} &amp; {t('station')}</th>
                <th className="py-2.5 px-4">{t('odometer')}</th>
                <th className="py-2.5 px-4">{t('liters')} / kWh</th>
                <th className="py-2.5 px-4">{t('pricePerLiter')}</th>
                <th className="py-2.5 px-4">{t('totalCost')}</th>
                <th className="py-2.5 px-4">{lang === 'nl' ? 'Details' : 'Details'}</th>
                <th className="py-2.5 px-4">{lang === 'nl' ? 'Bon' : 'Receipt'}</th>
                <th className="py-2.5 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayedEntries.map((f) => {
                const globalIdx = entries.findIndex((e) => e.id === f.id);
                const prev = entries[globalIdx + 1];

                let economyText: string | null = null;
                if (f.is_full_tank && !f.missed_previous && prev && prev.is_full_tank) {
                  const deltaKm = f.odometer - prev.odometer;
                  if (deltaKm > 0 && f.liters > 0) {
                    const kmPerLiter = deltaKm / f.liters;
                    const litersPer100Km = (f.liters / deltaKm) * 100;
                    economyText = `1 op ${kmPerLiter.toFixed(1)} (${litersPer100Km.toFixed(1)} L/100)`;
                  }
                }

                return (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">{formatDisplayDate(f.date)}</div>
                      {(f.station_name || f.station_address) && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={f.station_name || ''}>
                            {f.station_name || ''}
                          </span>
                          {f.station_name && f.station_address && <span>•</span>}
                          <span className="truncate max-w-[150px]" title={f.station_address || ''}>
                            {f.station_address || ''}
                          </span>
                          {f.latitude && f.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-500 hover:text-sky-600 inline-flex items-center ml-0.5"
                              title={t('openInMaps')}
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {f.odometer.toLocaleString()} km
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {f.liters ? `${f.liters.toFixed(2)} L` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      € {f.price_per_liter?.toFixed(3) || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      € {f.total_cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 w-fit">
                          {f.is_full_tank ? t('fullTank') : (lang === 'nl' ? 'Deeltank' : 'Partial')}
                        </span>
                        {Boolean(f.is_towing) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800/60 w-fit inline-flex items-center space-x-1">
                            <span>🏕️</span>
                            <span>{lang === 'nl' ? 'Aanhanger' : 'Towing'}</span>
                          </span>
                        )}
                        {economyText && (
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {economyText}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {f.receipt_path ? (
                        <div className="flex items-center space-x-2">
                          <a
                            href={`/uploads/receipts/${f.receipt_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-1 font-semibold"
                          >
                            {f.receipt_path.toLowerCase().endsWith('.pdf') ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : (
                              <Image className="w-3.5 h-3.5" />
                            )}
                            <span>{t('view')}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => onEditEntry(f, true)}
                            className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 transition inline-flex items-center shadow-xs"
                            title={lang === 'nl' ? 'Bon opnieuw uitlezen met AI / OCR' : 'Rescan receipt with AI / OCR'}
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAttachReceipt(f)}
                          className="text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 inline-flex items-center space-x-1 text-[11px] font-medium transition hover:underline"
                          title={lang === 'nl' ? 'Bon scannen en toevoegen aan deze tankbeurt' : 'Scan and attach receipt to this entry'}
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-500" />
                          <span>{lang === 'nl' ? 'Bon toevoegen' : 'Add receipt'}</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {f.receipt_path && (
                          <button
                            type="button"
                            onClick={() => onEditEntry(f, true)}
                            className="text-slate-400 hover:text-amber-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title={lang === 'nl' ? 'Bon opnieuw uitlezen met AI / OCR' : 'Rescan receipt with AI / OCR'}
                          >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditEntry(f)}
                          className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={t('edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(f.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Pagina {currentPage} van {totalPages}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  Route as RouteIcon,
  Briefcase,
  Building2,
  Home,
  Plus,
  ArrowRight,
  ArrowLeftRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Trip } from '../../types/index.js';
import { formatDisplayDate } from '../../utils/format.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface TripTableProps {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedPurpose: string;
  setSelectedPurpose: (p: 'all' | 'business' | 'commute' | 'private') => void;
  currentYear: string;
  onOpenCreate: () => void;
  onOpenEdit: (trip: Trip) => void;
  onQuickReturn: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
}

export const TripTable: React.FC<TripTableProps> = ({
  trips,
  loading,
  error,
  selectedYear,
  setSelectedYear,
  selectedPurpose,
  setSelectedPurpose,
  currentYear,
  onOpenCreate,
  onOpenEdit,
  onQuickReturn,
  onDeleteTrip,
}) => {
  const { lang } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jaar:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Alle jaren</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={(parseInt(currentYear) - 1).toString()}>{parseInt(currentYear) - 1}</option>
            <option value={(parseInt(currentYear) - 2).toString()}>{parseInt(currentYear) - 2}</option>
          </select>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setSelectedPurpose('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedPurpose === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Alle Ritten
          </button>
          <button
            onClick={() => setSelectedPurpose('business')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 ${
              selectedPurpose === 'business'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-100/10'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Zakelijk</span>
          </button>
          <button
            onClick={() => setSelectedPurpose('commute')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 ${
              selectedPurpose === 'commute'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Woon-werk</span>
          </button>
          <button
            onClick={() => setSelectedPurpose('private')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 ${
              selectedPurpose === 'private'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Privé</span>
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">Ritten laden...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-500">{error}</div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center">
            <RouteIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nog geen ritten geregistreerd</h3>
            <p className="text-xs text-slate-500 mt-1">Begin direct met het vastleggen van je zakelijke en privé kilometers.</p>
            <button
              onClick={onOpenCreate}
              className="mt-4 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Eerste Rit Vastleggen</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Datum</th>
                  <th className="py-3 px-4">Traject (Van ➔ Naar)</th>
                  <th className="py-3 px-4">Karakter</th>
                  <th className="py-3 px-4 text-right">Begin (km)</th>
                  <th className="py-3 px-4 text-right">Eind (km)</th>
                  <th className="py-3 px-4 text-right">Afstand</th>
                  <th className="py-3 px-4">Toelichting</th>
                  <th className="py-3 px-4 text-center">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {formatDisplayDate(t.date, lang)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-900 dark:text-white">
                        <span>{t.from_location}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.to_location}</span>
                      </div>
                      {Boolean(t.is_return_trip) && (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-indigo-500 font-bold mt-0.5">
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Retourrit</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.purpose === 'business' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                          <Briefcase className="w-3 h-3" />
                          <span>Zakelijk</span>
                        </span>
                      ) : t.purpose === 'commute' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                          <Building2 className="w-3 h-3" />
                          <span>Woon-werk</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <Home className="w-3 h-3" />
                          <span>Privé</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {t.start_odometer.toLocaleString('nl-NL')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {t.end_odometer.toLocaleString('nl-NL')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {t.distance_km} km
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {t.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => onQuickReturn(t)}
                          title="1-klik Terugrit toevoegen"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEdit(t)}
                          title="Bewerken"
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTrip(t.id)}
                          title="Verwijderen"
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


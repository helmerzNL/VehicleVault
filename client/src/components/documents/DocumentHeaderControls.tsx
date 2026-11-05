import React from 'react';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { VehicleDocument } from '../../types/index.js';

export type DocCategory = 'all' | 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other';

interface DocumentHeaderControlsProps {
  documents: VehicleDocument[];
  activeCategory: DocCategory;
  setActiveCategory: (cat: DocCategory) => void;
  sortBy: 'date_desc' | 'date_asc' | 'name_asc';
  setSortBy: (sort: 'date_desc' | 'date_asc' | 'name_asc') => void;
  viewMode: 'list' | 'grid';
  onSetViewMode: (mode: 'list' | 'grid') => void;
}

export const DocumentHeaderControls: React.FC<DocumentHeaderControlsProps> = ({
  documents,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  viewMode,
  onSetViewMode,
}) => {
  const { t, lang } = useLanguage();

  const categories: { key: DocCategory; label: string }[] = [
    { key: 'all', label: t('docCatAll') },
    { key: 'registration', label: t('docCatRegistration') },
    { key: 'insurance', label: t('docCatInsurance') },
    { key: 'apk', label: t('docCatApk') },
    { key: 'invoice', label: t('docCatInvoices') },
    { key: 'manual', label: t('docCatManual') },
    { key: 'other', label: t('docCatOther') },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const count = cat.key === 'all' ? documents.length : documents.filter((d) => d.category === cat.key).length;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
        >
          <option value="date_desc">{lang === 'nl' ? 'Datum: Nieuwste eerst' : 'Date: Newest first'}</option>
          <option value="date_asc">{lang === 'nl' ? 'Datum: Oudste eerst' : 'Date: Oldest first'}</option>
          <option value="name_asc">{lang === 'nl' ? 'Naam (A-Z)' : 'Name (A-Z)'}</option>
        </select>

        <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => onSetViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'list'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


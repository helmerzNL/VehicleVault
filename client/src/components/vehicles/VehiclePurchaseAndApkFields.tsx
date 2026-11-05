import React from 'react';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { getInspectionTerm } from '../../utils/inspectionTerms.js';

interface VehiclePurchaseAndApkFieldsProps {
  plateCountry: 'NL' | 'BE' | 'DE' | 'EU' | 'OTHER';
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  initialOdometer: string;
  setInitialOdometer: (v: string) => void;
  purchasePrice: string;
  setPurchasePrice: (v: string) => void;
  apkDate: string;
  setApkDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export const VehiclePurchaseAndApkFields: React.FC<VehiclePurchaseAndApkFieldsProps> = ({
  plateCountry,
  purchaseDate,
  setPurchaseDate,
  initialOdometer,
  setInitialOdometer,
  purchasePrice,
  setPurchasePrice,
  apkDate,
  setApkDate,
  notes,
  setNotes,
}) => {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* Ownership & TCO Baseline Section */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            {lang === 'nl' ? 'Aankoopgegevens & TCO-startpunt' : 'Purchase Details & TCO Baseline'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {lang === 'nl'
              ? 'Bepaalt je bezitsduur en houdt historische facturen van vóór jouw aankoop automatisch buiten je eigen TCO.'
              : 'Determines ownership duration and automatically excludes pre-ownership invoices from your TCO.'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <DatePicker
              label={t('purchaseDate')}
              value={purchaseDate}
              onChange={setPurchaseDate}
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {lang === 'nl' ? 'Aankoopstand (km)' : t('initialOdometer')}
            </label>
            <input
              type="number"
              value={initialOdometer}
              onChange={(e) => setInitialOdometer(e.target.value)}
              placeholder="bijv. 67799"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('purchasePrice')} (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="bijv. 19995"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm font-mono"
            />
          </div>
        </div>
      </div>

      <div>
        <DatePicker
          label={getInspectionTerm(plateCountry, lang).dateLabel}
          value={apkDate}
          onChange={setApkDate}
        />
      </div>

      <div>
        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('vehicleNotes')}</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={lang === 'nl' ? 'Kleurcode, opties, bandenmaten...' : 'Paint code, options, tire sizes...'}
          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
        />
      </div>
    </>
  );
};


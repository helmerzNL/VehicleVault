import React from 'react';
import { Camera, X, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { VehicleType } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface VehicleBasicSpecsFieldsProps {
  imagePreview: string | null;
  setImagePreview: (v: string | null) => void;
  setImageFile: (f: File | null) => void;
  plateCountry: 'NL' | 'BE' | 'DE' | 'EU' | 'OTHER';
  setPlateCountry: (v: 'NL' | 'BE' | 'DE' | 'EU' | 'OTHER') => void;
  licensePlate: string;
  setLicensePlate: (v: string) => void;
  onRdwLookup: () => void;
  rdwLoading: boolean;
  rdwSuccess: boolean;
  name: string;
  setName: (v: string) => void;
  type: VehicleType;
  setType: (v: VehicleType) => void;
  make: string;
  setMake: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  fuelType: string;
  setFuelType: (v: string) => void;
  vin: string;
  setVin: (v: string) => void;
}

export const VehicleBasicSpecsFields: React.FC<VehicleBasicSpecsFieldsProps> = ({
  imagePreview,
  setImagePreview,
  setImageFile,
  plateCountry,
  setPlateCountry,
  licensePlate,
  setLicensePlate,
  onRdwLookup,
  rdwLoading,
  rdwSuccess,
  name,
  setName,
  type,
  setType,
  make,
  setMake,
  model,
  setModel,
  year,
  setYear,
  fuelType,
  setFuelType,
  vin,
  setVin,
}) => {
  const { t, lang } = useLanguage();

  const countries: { code: 'NL' | 'BE' | 'DE' | 'EU'; label: string; activeClass: string }[] = [
    { code: 'NL', label: '🇳🇱 NL', activeClass: 'bg-[#f5c518] text-slate-950 shadow-2xs border border-amber-500' },
    { code: 'BE', label: '🇧🇪 BE', activeClass: 'bg-rose-700 text-white shadow-2xs border border-rose-800' },
    { code: 'DE', label: '🇩🇪 DE', activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs border border-slate-400' },
    { code: 'EU', label: lang === 'nl' ? '🇪🇺 EU / Overig' : '🇪🇺 EU / Other', activeClass: 'bg-blue-600 text-white shadow-2xs border border-blue-700' },
  ];

  return (
    <>
      {/* Photo Upload Box */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-2">
          {t('vehiclePhoto')}
        </label>
        <div className="flex items-center space-x-4">
          {imagePreview ? (
            <div className="w-36 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700 relative group shadow-xs">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-xs"
                title={t('delete')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-36 h-24 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{t('noPhoto')}</span>
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  const reader = new FileReader();
                  reader.onload = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-slate-200 hover:file:bg-slate-200 text-xs"
            />
            <p className="text-[10px] text-slate-400 mt-1">{t('dragOrClickPhoto')}</p>
          </div>
        </div>
      </div>

      {/* License Plate & Country Selector */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-slate-700 dark:text-slate-300 font-semibold block">
            {t('licensePlate')}
          </label>
          <div className="flex items-center space-x-1.5 flex-wrap">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setPlateCountry(c.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  plateCountry === c.code
                    ? c.activeClass
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                }`}
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            placeholder={
              plateCountry === 'NL' ? 'bijv. GBB-01-B of 12-AB-34' :
              plateCountry === 'BE' ? 'bijv. 1-ABC-123' :
              plateCountry === 'DE' ? 'bijv. B-MW 1234' : 'bijv. ABC-1234'
            }
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 uppercase font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
          />
          {plateCountry === 'NL' && (
            <button
              type="button"
              onClick={onRdwLookup}
              disabled={rdwLoading || !licensePlate}
              className="px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 hover:bg-black dark:hover:bg-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition disabled:opacity-50 shadow-sm shrink-0"
            >
              {rdwLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>{t('rdwAutofill')}</span>
            </button>
          )}
        </div>

        {plateCountry !== 'NL' ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {plateCountry === 'BE' && (lang === 'nl' ? '🇧🇪 Belgisch kenteken: Vul specificaties en keuringsdatum handmatig in.' : '🇧🇪 Belgian plate: Enter specs and inspection date manually.')}
            {plateCountry === 'DE' && (lang === 'nl' ? '🇩🇪 Duits kenteken: Vul specificaties en TÜV-vervaldatum handmatig in.' : '🇩🇪 German plate: Enter specs and TÜV date manually.')}
            {plateCountry === 'EU' && (lang === 'nl' ? '🇪🇺 Internationaal kenteken: Voertuiggegevens kunnen handmatig worden ingevuld.' : '🇪🇺 International plate: Vehicle details can be entered manually.')}
          </p>
        ) : rdwSuccess ? (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('rdwFound')}</span>
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            {t('vehicleName')} *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === 'nl' ? 'bijv. Golf 7 Daily' : 'e.g. Golf 7 Daily'}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            {t('vehicleType')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as VehicleType)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm font-medium"
          >
            <option value="car">{t('car')}</option>
            <option value="motorcycle">{t('motorcycle')}</option>
            <option value="trailer">{t('trailer')}</option>
            <option value="van">{t('van')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('make')}</label>
          <input
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Volkswagen"
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('model')}</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Golf"
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('year')}</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2018"
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            {t('fuelType')}
          </label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm font-medium"
          >
            <option value="Benzine">{lang === 'nl' ? 'Benzine (Euro 95 / E10 / E5)' : 'Petrol / Gasoline'}</option>
            <option value="Diesel">{lang === 'nl' ? 'Diesel (B7 / B10)' : 'Diesel'}</option>
            <option value="Hybride (Benzine)">{lang === 'nl' ? 'Hybride (Benzine / HEV)' : 'Hybrid (Petrol / HEV)'}</option>
            <option value="Hybride (Diesel)">{lang === 'nl' ? 'Hybride (Diesel / HEV)' : 'Hybrid (Diesel / HEV)'}</option>
            <option value="Plug-in Hybride (Benzine)">{lang === 'nl' ? 'Plug-in Hybride (Benzine - PHEV)' : 'Plug-in Hybrid (Petrol - PHEV)'}</option>
            <option value="Plug-in Hybride (Diesel)">{lang === 'nl' ? 'Plug-in Hybride (Diesel - PHEV)' : 'Plug-in Hybrid (Diesel - PHEV)'}</option>
            <option value="Elektrisch">{lang === 'nl' ? 'Volledig Elektrisch (EV)' : 'Full Electric (EV)'}</option>
            <option value="LPG">LPG (Autogas)</option>
            <option value="CNG">{lang === 'nl' ? 'CNG (Aardgas)' : 'CNG (Natural Gas)'}</option>
            <option value="Waterstof">{lang === 'nl' ? 'Waterstof (FCEV)' : 'Hydrogen (FCEV)'}</option>
            <option value="Overig">{lang === 'nl' ? 'Overig' : 'Other'}</option>
            {fuelType && ![
              'Benzine', 'Diesel', 'Hybride (Benzine)', 'Hybride (Diesel)',
              'Plug-in Hybride (Benzine)', 'Plug-in Hybride (Diesel)', 'Elektrisch',
              'LPG', 'CNG', 'Waterstof', 'Overig'
            ].includes(fuelType) && (
              <option value={fuelType}>{fuelType}</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('vin')}</label>
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="WVWZZZ..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>
      </div>
    </>
  );
};

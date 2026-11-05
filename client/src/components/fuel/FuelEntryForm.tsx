import React, { useState } from 'react';
import {
  Fuel,
  Zap,
  AlertTriangle,
  MapPin,
  Navigation,
  Search,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Paperclip,
  X,
} from 'lucide-react';
import { Vehicle, FuelEntry, GasStation } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { apiFetch } from '../../api/client.js';
import { compressImage } from '../../utils/imageCompressor.js';
import { addToOfflineQueue } from '../../utils/offlineQueue.js';

interface FuelEntryFormProps {
  selectedVehicle: Vehicle;
  entries: FuelEntry[];
  onEntryAdded: () => Promise<void>;
  formPrefill?: {
    date?: string;
    odometer?: string;
    liters?: string;
    pricePerLiter?: string;
    totalCost?: string;
    stationName?: string;
    stationAddress?: string;
    receiptPath?: string;
    energyType?: 'fuel' | 'electric';
  } | null;
}

export const FuelEntryForm: React.FC<FuelEntryFormProps> = ({
  selectedVehicle,
  entries,
  onEntryAdded,
  formPrefill,
}) => {
  const { t, lang } = useLanguage();
  const isPhev = selectedVehicle.fuel_type?.toLowerCase().includes('phev') ||
    selectedVehicle.fuel_type?.toLowerCase().includes('plug-in');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState<string>('');
  const [energyType, setEnergyType] = useState<'fuel' | 'electric'>(
    selectedVehicle.fuel_type?.toLowerCase() === 'electric' ? 'electric' : 'fuel'
  );
  const [liters, setLiters] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<string>('');
  const [kwh, setKwh] = useState<string>('');
  const [pricePerKwh, setPricePerKwh] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [missedPrevious, setMissedPrevious] = useState(false);
  const [isTowing, setIsTowing] = useState(false);
  const [notes, setNotes] = useState('');
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  React.useEffect(() => {
    if (!formPrefill) return;
    if (formPrefill.date) setDate(formPrefill.date);
    if (formPrefill.odometer) setOdometer(formPrefill.odometer);
    if (formPrefill.liters) setLiters(formPrefill.liters);
    if (formPrefill.pricePerLiter) setPricePerLiter(formPrefill.pricePerLiter);
    if (formPrefill.totalCost) setTotalCost(formPrefill.totalCost);
    if (formPrefill.stationName) {
      setStationName(formPrefill.stationName);
      setShowLocationSection(true);
    }
    if (formPrefill.stationAddress) {
      setStationAddress(formPrefill.stationAddress);
      setShowLocationSection(true);
    }
    if (formPrefill.receiptPath) {
      setReceiptPath(formPrefill.receiptPath);
    }
    if (formPrefill.energyType) setEnergyType(formPrefill.energyType);
  }, [formPrefill]);

  // Station Location & GPS State
  const [stationName, setStationName] = useState('');
  const [stationAddress, setStationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showLocationSection, setShowLocationSection] = useState(false);

  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearbyStations, setNearbyStations] = useState<GasStation[]>([]);
  const [showStationPicker, setShowStationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingStations, setSearchingStations] = useState(false);

  // Warnings / Validation State
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Calculations
  const handleLitersChange = (val: string) => {
    setLiters(val);
    const l = parseFloat(val);
    const p = parseFloat(pricePerLiter);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalCost((l * p).toFixed(2));
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerLiter(val);
    const l = parseFloat(liters);
    const p = parseFloat(val);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalCost((l * p).toFixed(2));
    }
  };

  const handleKwhChange = (val: string) => {
    setKwh(val);
    const k = parseFloat(val);
    const p = parseFloat(pricePerKwh);
    if (!isNaN(k) && !isNaN(p) && k > 0 && p > 0) {
      setTotalCost((k * p).toFixed(2));
    }
  };

  const handlePricePerKwhChange = (val: string) => {
    setPricePerKwh(val);
    const k = parseFloat(kwh);
    const p = parseFloat(val);
    if (!isNaN(k) && !isNaN(p) && k > 0 && p > 0) {
      setTotalCost((k * p).toFixed(2));
    }
  };

  const handleTotalChange = (val: string) => {
    setTotalCost(val);
    const tVal = parseFloat(val);
    if (energyType === 'fuel') {
      const l = parseFloat(liters);
      if (!isNaN(tVal) && !isNaN(l) && l > 0 && tVal > 0) {
        setPricePerLiter((tVal / l).toFixed(3));
      }
    } else {
      const k = parseFloat(kwh);
      if (!isNaN(tVal) && !isNaN(k) && k > 0 && tVal > 0) {
        setPricePerKwh((tVal / k).toFixed(3));
      }
    }
  };

  const handleOdometerChange = (val: string) => {
    setOdometer(val);
    const valNum = parseInt(val, 10);
    if (isNaN(valNum)) {
      setWarningMessage(null);
      return;
    }
    if (entries.length > 0) {
      const highestOdo = Math.max(...entries.map((e) => e.odometer));
      if (valNum < highestOdo) {
        setWarningMessage(
          lang === 'nl'
            ? `Let op: Ingevoerde kilometerstand (${valNum.toLocaleString()} km) is lager dan de hoogste stand (${highestOdo.toLocaleString()} km).`
            : `Warning: Entered odometer (${valNum.toLocaleString()} km) is lower than the highest recorded (${highestOdo.toLocaleString()} km).`
        );
      } else {
        setWarningMessage(null);
      }
    }
  };

  const handleGetGpsStations = () => {
    setLoadingGps(true);
    setGpsError(null);
    setShowLocationSection(true);

    if (!navigator.geolocation) {
      setGpsError(lang === 'nl' ? 'GPS wordt niet ondersteund door je browser.' : 'GPS is not supported by your browser.');
      setLoadingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        try {
          const res = await apiFetch<{ stations: GasStation[] }>(
            `/api/fuel/stations/nearby?lat=${lat}&lon=${lon}&radius=15`
          );
          setNearbyStations(res.stations || []);
          setShowStationPicker(true);
          if (res.stations && res.stations.length > 0 && (res.stations[0].distanceMeters ?? 9999) < 1000) {
            setStationName(res.stations[0].name);
            if (res.stations[0].address) setStationAddress(res.stations[0].address);
          }
        } catch {
          setGpsError(lang === 'nl' ? 'Kon nabijgelegen tankstations niet ophalen.' : 'Could not fetch nearby stations.');
        } finally {
          setLoadingGps(false);
        }
      },
      () => {
        setGpsError(lang === 'nl' ? 'Toegang tot locatie geweigerd of mislukt.' : 'Location access denied or failed.');
        setLoadingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchStations = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setNearbyStations([]);
      return;
    }
    setSearchingStations(true);
    try {
      const res = await apiFetch<{ stations: GasStation[] }>(
        `/api/fuel/stations/search?q=${encodeURIComponent(query)}${latitude && longitude ? `&lat=${latitude}&lon=${longitude}` : ''}`
      );
      setNearbyStations(res.stations || []);
      setShowStationPicker(true);
    } catch {
      // ignore
    } finally {
      setSearchingStations(false);
    }
  };

  const handleSelectStation = (st: GasStation) => {
    setStationName(st.name);
    setStationAddress(st.address);
    setLatitude(st.lat);
    setLongitude(st.lon);
    setShowStationPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalReceiptPath = receiptPath;

    if (receiptFile) {
      setUploadingReceipt(true);
      try {
        const compressed = await compressImage(receiptFile);
        const formData = new FormData();
        formData.append('receipt', compressed);
        const uploadRes = await apiFetch<{ filePath?: string; fileName?: string }>('/api/fuel/upload-receipt', {
          method: 'POST',
          body: formData,
        });
        finalReceiptPath = uploadRes.filePath || uploadRes.fileName || null;
      } catch {
        alert(lang === 'nl' ? 'Uploaden van de bon is mislukt' : 'Receipt upload failed');
        setUploadingReceipt(false);
        setSubmitting(false);
        return;
      } finally {
        setUploadingReceipt(false);
      }
    }

    const parsedLiters = parseFloat(liters) || 0;
    const parsedPrice = parseFloat(pricePerLiter) || 0;
    const parsedKwh = parseFloat(kwh) || 0;
    const parsedPriceKwh = parseFloat(pricePerKwh) || 0;
    const parsedCost = parseFloat(totalCost) || (energyType === 'fuel' ? parsedLiters * parsedPrice : parsedKwh * parsedPriceKwh);

    const payload = {
      vehicle_id: selectedVehicle.id,
      date,
      odometer: parseInt(odometer, 10),
      energy_type: energyType,
      liters: energyType === 'fuel' ? parsedLiters : 0,
      price_per_liter: energyType === 'fuel' ? parsedPrice : 0,
      kwh: energyType === 'electric' ? parsedKwh : null,
      price_per_kwh: energyType === 'electric' ? parsedPriceKwh : null,
      fuel_amount: energyType === 'fuel' ? parsedLiters : parsedKwh,
      price_per_unit: energyType === 'fuel' ? parsedPrice : parsedPriceKwh,
      total_cost: parsedCost,
      is_full_tank: isFullTank,
      missed_previous: missedPrevious,
      is_towing: isTowing,
      notes: notes || null,
      station_name: stationName || null,
      station_address: stationAddress || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      receipt_path: finalReceiptPath || null,
    };

    try {
      if (!navigator.onLine) {
        addToOfflineQueue({
          vehicle_id: selectedVehicle.id,
          date,
          odometer: parseInt(odometer, 10),
          liters: energyType === 'fuel' ? parseFloat(liters) : parseFloat(kwh),
          price_per_liter: energyType === 'fuel' ? parseFloat(pricePerLiter) : parseFloat(pricePerKwh),
          total_cost: parseFloat(totalCost),
          is_full_tank: isFullTank,
          missed_previous: missedPrevious,
          is_towing: isTowing,
          notes: notes || null,
          station_name: stationName || null,
          station_address: stationAddress || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        });
        alert(lang === 'nl' ? 'Offline: Opgeslagen om te synchroniseren zodra er weer internet is.' : 'Offline: Saved to sync when online.');
      } else {
        await apiFetch('/api/fuel', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      // Reset form
      setOdometer('');
      setLiters('');
      setPricePerLiter('');
      setKwh('');
      setPricePerKwh('');
      setTotalCost('');
      setNotes('');
      setReceiptFile(null);
      setReceiptPath(null);
      setStationName('');
      setStationAddress('');
      setLatitude(null);
      setLongitude(null);
      setShowLocationSection(false);
      setWarningMessage(null);

      await onEntryAdded();
    } catch (err: any) {
      alert(err?.message || 'Fout bij opslaan van tankbeurt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
      {isPhev && (
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit mb-4 border border-slate-200/70 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setEnergyType('fuel')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              energyType === 'fuel'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'nl' ? 'Brandstof (Liters)' : 'Fuel (Liters)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setEnergyType('electric')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              energyType === 'electric'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-500" />
            <span>{lang === 'nl' ? 'Laadbeurt (kWh)' : 'Charging (kWh)'}</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {warningMessage && (
          <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 p-3 rounded-xl font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div>
            <DatePicker
              label={t('date')}
              value={date}
              onChange={setDate}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('odometer')} (km) *
            </label>
            <input
              type="number"
              required
              value={odometer}
              onChange={(e) => handleOdometerChange(e.target.value)}
              placeholder={lang === 'nl' ? 'bijv. 58240' : 'e.g. 58240'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          {energyType === 'fuel' ? (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('liters')} (L) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liters}
                  onChange={(e) => handleLitersChange(e.target.value)}
                  placeholder={lang === 'nl' ? 'bijv. 45.20' : 'e.g. 45.20'}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('pricePerLiter')} (€/L) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={pricePerLiter}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder={lang === 'nl' ? 'bijv. 1.949' : 'e.g. 1.949'}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {lang === 'nl' ? 'Stroom geladen (kWh) *' : 'Energy charged (kWh) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={kwh}
                  onChange={(e) => handleKwhChange(e.target.value)}
                  placeholder={lang === 'nl' ? 'bijv. 38.50' : 'e.g. 38.50'}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {lang === 'nl' ? 'Tarief (€/kWh) *' : 'Rate (€/kWh) *'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={pricePerKwh}
                  onChange={(e) => handlePricePerKwhChange(e.target.value)}
                  placeholder={lang === 'nl' ? 'bijv. 0.350' : 'e.g. 0.350'}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 shadow-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('totalCost')} (€)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={totalCost}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder={lang === 'nl' ? 'Berekend of handmatig' : 'Calculated or manual'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('notes')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'nl' ? 'bijv. Euro 95 E10, bandenspanning gecheckt' : 'e.g. Euro 95 E10, tire pressure checked'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-5 pb-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFullTank}
                onChange={(e) => setIsFullTank(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <span className="text-slate-800 dark:text-slate-200 font-bold">{t('fullTank')}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={missedPrevious}
                onChange={(e) => setMissedPrevious(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">{t('missedPrevious')}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTowing}
                onChange={(e) => setIsTowing(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-amber-500"
              />
              <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center space-x-1">
                <span>🏕️</span>
                <span>{lang === 'nl' ? 'Met caravan / aanhanger' : 'Towing caravan / trailer'}</span>
              </span>
            </label>
          </div>
        </div>

        {/* Optional Station & GPS Location Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowLocationSection(!showLocationSection)}
              className="text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-bold text-xs inline-flex items-center space-x-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>{t('stationAndLocation')}</span>
              {showLocationSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleGetGpsStations}
                disabled={loadingGps}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg text-[11px] font-bold transition shadow-sm disabled:opacity-50"
              >
                {loadingGps ? <Loader2 className="w-3 h-3 animate-spin text-sky-500" /> : <Navigation className="w-3 h-3 text-sky-500" />}
                <span>{loadingGps ? t('gettingGps') : t('findNearbyGps')}</span>
              </button>
            </div>
          </div>

          {showLocationSection && (
            <div className="space-y-3 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* Search Bar for Stations */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {searchingStations ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchStations(e.target.value)}
                  placeholder={t('searchStationPlaceholder')}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
                />
              </div>

              {gpsError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-[11px] flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Nearby Stations List Dropdown */}
              {showStationPicker && nearbyStations.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1 tracking-wider flex items-center justify-between">
                    <span>{t('gpsNearbyFound')} ({nearbyStations.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowStationPicker(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {nearbyStations.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectStation(st)}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                          <span>{st.name}</span>
                          {st.distanceFormatted && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-semibold border border-sky-100 dark:border-sky-900/40">
                              {st.distanceFormatted}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {st.address}
                        </div>
                      </div>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Direct Fields for Station Name and Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('stationName')}
                  </label>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    placeholder={lang === 'nl' ? 'Naam van het tankstation' : 'Name of gas station'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {t('stationAddress')}
                    </label>
                    {latitude && longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-0.5"
                      >
                        <span>{t('openInMaps')}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={stationAddress}
                    onChange={(e) => setStationAddress(e.target.value)}
                    placeholder={lang === 'nl' ? 'Straat, huisnummer en woonplaats' : 'Street, number and city'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Receipt Attachment or OCR Preview */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {receiptFile || receiptPath ? (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs shadow-sm">
                <Paperclip className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold max-w-[220px] truncate">
                  {receiptFile ? receiptFile.name : (lang === 'nl' ? 'Kassabon gekoppeld' : 'Receipt attached')}
                </span>
                {receiptPath && (
                  <a
                    href={`/uploads/receipts/${receiptPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 dark:text-sky-400 underline font-semibold hover:text-sky-700 ml-1 text-[11px]"
                  >
                    {lang === 'nl' ? 'Bekijken' : 'View'}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPath(null);
                  }}
                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-300 transition"
                  title={t('removeAttachment')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-sm">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('attachReceipt')}</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setReceiptFile(e.target.files[0]);
                      setReceiptPath(null);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            {entries.length > 0 ? (
              <span>
                {lang === 'nl'
                  ? `Vorige stand: ${Math.max(...entries.map((e) => e.odometer)).toLocaleString()} km`
                  : `Previous: ${Math.max(...entries.map((e) => e.odometer)).toLocaleString()} km`}
              </span>
            ) : (
              lang === 'nl'
                ? 'Tip: Gebruik de OCR scanner om snel je tankbon over te nemen.'
                : 'Tip: Use the OCR scanner to quickly capture your fuel receipt.'
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingReceipt}
            className="px-5 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 shadow-sm hover:scale-[1.02]"
          >
            {submitting || uploadingReceipt ? t('saving') : t('newFuelEntry')}
          </button>
        </div>
      </form>
    </div>
  );
};

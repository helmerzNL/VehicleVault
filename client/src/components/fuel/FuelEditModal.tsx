import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Zap,
  Camera,
  AlertTriangle,
  Trash2,
  Check,
  FileText,
  Paperclip,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { FuelEntry } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { apiFetch } from '../../api/client.js';
import { compressImage } from '../../utils/imageCompressor.js';

interface FuelEditModalProps {
  editingEntry: FuelEntry | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onRequestOcrScan: () => void;
}

export const FuelEditModal: React.FC<FuelEditModalProps> = ({
  editingEntry,
  onClose,
  onSaved,
  onRequestOcrScan,
}) => {
  const { t, lang } = useLanguage();

  const [editDate, setEditDate] = useState('');
  const [editOdometer, setEditOdometer] = useState('');
  const [editEnergyType, setEditEnergyType] = useState<'fuel' | 'electric'>('fuel');
  const [editLiters, setEditLiters] = useState('');
  const [editPricePerLiter, setEditPricePerLiter] = useState('');
  const [editKwh, setEditKwh] = useState('');
  const [editPricePerKwh, setEditPricePerKwh] = useState('');
  const [editTotalCost, setEditTotalCost] = useState('');
  const [editIsFullTank, setEditIsFullTank] = useState(true);
  const [editMissedPrevious, setEditMissedPrevious] = useState(false);
  const [editIsTowing, setEditIsTowing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editStationName, setEditStationName] = useState('');
  const [editStationAddress, setEditStationAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editReceiptPath, setEditReceiptPath] = useState<string | null>(null);
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [rescanningEdit, setRescanningEdit] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setEditDate(editingEntry.date ? editingEntry.date.split('T')[0] : '');
      setEditOdometer(editingEntry.odometer ? editingEntry.odometer.toString() : '');
      setEditEnergyType('fuel');
      setEditLiters(editingEntry.liters ? editingEntry.liters.toString() : '');
      setEditPricePerLiter(editingEntry.price_per_liter ? editingEntry.price_per_liter.toString() : '');
      setEditKwh('');
      setEditPricePerKwh('');
      setEditTotalCost(editingEntry.total_cost ? editingEntry.total_cost.toString() : '');
      setEditIsFullTank(Boolean(editingEntry.is_full_tank));
      setEditMissedPrevious(Boolean(editingEntry.missed_previous));
      setEditIsTowing(Boolean(editingEntry.is_towing));
      setEditNotes(editingEntry.notes || '');
      setEditStationName(editingEntry.station_name || '');
      setEditStationAddress(editingEntry.station_address || '');
      setEditLatitude(editingEntry.latitude ?? null);
      setEditLongitude(editingEntry.longitude ?? null);
      setEditReceiptPath(editingEntry.receipt_path || null);
      setEditReceiptFile(null);
      setScanFeedback(null);
      setScanError(null);
    }
  }, [editingEntry]);

  if (!editingEntry) return null;

  const handleEditLitersChange = (val: string) => {
    setEditLiters(val);
    const l = parseFloat(val);
    const p = parseFloat(editPricePerLiter);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setEditTotalCost((l * p).toFixed(2));
    }
  };

  const handleEditPriceChange = (val: string) => {
    setEditPricePerLiter(val);
    const l = parseFloat(editLiters);
    const p = parseFloat(val);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setEditTotalCost((l * p).toFixed(2));
    }
  };

  const handleEditKwhChange = (val: string) => {
    setEditKwh(val);
    const k = parseFloat(val);
    const p = parseFloat(editPricePerKwh);
    if (!isNaN(k) && !isNaN(p) && k > 0 && p > 0) {
      setEditTotalCost((k * p).toFixed(2));
    }
  };

  const handleEditPricePerKwhChange = (val: string) => {
    setEditPricePerKwh(val);
    const k = parseFloat(editKwh);
    const p = parseFloat(val);
    if (!isNaN(k) && !isNaN(p) && k > 0 && p > 0) {
      setEditTotalCost((k * p).toFixed(2));
    }
  };

  const handleRescanExistingReceipt = async () => {
    if (!editReceiptPath) return;
    setRescanningEdit(true);
    setScanFeedback(null);
    setScanError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: {
          date?: string;
          liters?: number;
          pricePerUnit?: number;
          totalCost?: number;
          stationName?: string;
          stationAddress?: string;
        };
      }>('/api/fuel/rescan-receipt', {
        method: 'POST',
        body: JSON.stringify({ receiptPath: editReceiptPath }),
      });

      if (res.success && res.data) {
        if (res.data.date) setEditDate(res.data.date);
        if (res.data.liters) setEditLiters(res.data.liters.toString());
        if (res.data.pricePerUnit) setEditPricePerLiter(res.data.pricePerUnit.toString());
        if (res.data.totalCost) setEditTotalCost(res.data.totalCost.toString());
        if (res.data.stationName) setEditStationName(res.data.stationName);
        if (res.data.stationAddress) setEditStationAddress(res.data.stationAddress);

        setScanFeedback(
          lang === 'nl'
            ? 'Bon succesvol opnieuw uitgelezen! Velden zijn bijgewerkt.'
            : 'Receipt successfully re-scanned! Fields have been updated.'
        );
      }
    } catch (err: any) {
      setScanError(err?.message || (lang === 'nl' ? 'Fout bij opnieuw analyseren' : 'Failed to re-scan receipt'));
    } finally {
      setRescanningEdit(false);
    }
  };

  const handleScanSelectedEditFile = async () => {
    if (!editReceiptFile) return;
    setRescanningEdit(true);
    setScanFeedback(null);
    setScanError(null);
    try {
      const compressed = await compressImage(editReceiptFile);
      const formData = new FormData();
      formData.append('receipt', compressed);

      const res = await apiFetch<{
        success: boolean;
        filePath?: string;
        data?: {
          date?: string;
          liters?: number;
          pricePerUnit?: number;
          totalCost?: number;
          stationName?: string;
          stationAddress?: string;
        };
      }>('/api/fuel/ocr-scan', {
        method: 'POST',
        body: formData,
      });

      if (res.filePath) {
        setEditReceiptPath(res.filePath);
        setEditReceiptFile(null);
      }

      if (res.data) {
        if (res.data.date) setEditDate(res.data.date);
        if (res.data.liters) setEditLiters(res.data.liters.toString());
        if (res.data.pricePerUnit) setEditPricePerLiter(res.data.pricePerUnit.toString());
        if (res.data.totalCost) setEditTotalCost(res.data.totalCost.toString());
        if (res.data.stationName) setEditStationName(res.data.stationName);
        if (res.data.stationAddress) setEditStationAddress(res.data.stationAddress);

        setScanFeedback(
          lang === 'nl'
            ? 'Bon uitgelezen en gekoppeld! Controleer de velden.'
            : 'Receipt scanned and linked! Review fields.'
        );
      }
    } catch (err: any) {
      setScanError(err?.message || (lang === 'nl' ? 'Fout bij analyseren' : 'Scanning failed'));
    } finally {
      setRescanningEdit(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);

    let finalReceiptPath = editReceiptPath;
    if (editReceiptFile) {
      try {
        const compressed = await compressImage(editReceiptFile);
        const formData = new FormData();
        formData.append('receipt', compressed);
        const uploadRes = await apiFetch<{ filePath?: string; fileName?: string }>('/api/fuel/upload-receipt', {
          method: 'POST',
          body: formData,
        });
        finalReceiptPath = uploadRes.filePath || uploadRes.fileName || null;
      } catch {
        alert(lang === 'nl' ? 'Uploaden van de bon is mislukt' : 'Receipt upload failed');
        setSavingEdit(false);
        return;
      }
    }

    const parsedLiters = parseFloat(editLiters) || 0;
    const parsedPrice = parseFloat(editPricePerLiter) || 0;
    const parsedKwh = parseFloat(editKwh) || 0;
    const parsedPriceKwh = parseFloat(editPricePerKwh) || 0;
    const parsedCost = parseFloat(editTotalCost) || (editEnergyType === 'fuel' ? parsedLiters * parsedPrice : parsedKwh * parsedPriceKwh);

    const payload = {
      date: editDate,
      odometer: parseInt(editOdometer, 10),
      energy_type: editEnergyType,
      liters: editEnergyType === 'fuel' ? parsedLiters : 0,
      price_per_liter: editEnergyType === 'fuel' ? parsedPrice : 0,
      kwh: editEnergyType === 'electric' ? parsedKwh : null,
      price_per_kwh: editEnergyType === 'electric' ? parsedPriceKwh : null,
      fuel_amount: editEnergyType === 'fuel' ? parsedLiters : parsedKwh,
      price_per_unit: editEnergyType === 'fuel' ? parsedPrice : parsedPriceKwh,
      total_cost: parsedCost,
      is_full_tank: editIsFullTank,
      missed_previous: editMissedPrevious,
      is_towing: editIsTowing,
      notes: editNotes || null,
      station_name: editStationName || null,
      station_address: editStationAddress || null,
      latitude: editLatitude ?? null,
      longitude: editLongitude ?? null,
      receipt_path: finalReceiptPath || null,
    };

    try {
      await apiFetch(`/api/fuel/${editingEntry.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Fout bij opslaan van wijzigingen');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 text-slate-900 dark:text-slate-100 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('editFuelEntry')}</h3>
              <p className="text-[11px] text-slate-500">
                {editingEntry.odometer.toLocaleString()} km
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onRequestOcrScan}
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-700 dark:text-amber-300 font-bold text-xs inline-flex items-center space-x-1.5 transition shadow-sm"
              title="Scan een nieuwe bon met camera of bestand via AI"
            >
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'nl' ? 'Bon Scannen (AI)' : 'Scan Receipt (AI)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          {scanFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{scanFeedback}</span>
              </div>
              <button type="button" onClick={() => setScanFeedback(null)} className="text-emerald-600 dark:text-emerald-400 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {scanError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{scanError}</span>
              </div>
              <button type="button" onClick={() => setScanError(null)} className="text-rose-600 dark:text-rose-400 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Date & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('date')}</label>
              <DatePicker value={editDate} onChange={setEditDate} />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('odometer')} (km)</label>
              <input
                type="number"
                step="1"
                required
                value={editOdometer}
                onChange={(e) => setEditOdometer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Energy Type Switcher in Edit Modal */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditEnergyType('fuel')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                editEnergyType === 'fuel'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Fuel className="w-3 h-3 text-amber-500" />
              <span>{lang === 'nl' ? 'Brandstof' : 'Fuel'}</span>
            </button>
            <button
              type="button"
              onClick={() => setEditEnergyType('electric')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                editEnergyType === 'electric'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Zap className="w-3 h-3 text-cyan-500" />
              <span>{lang === 'nl' ? 'Laadbeurt (kWh)' : 'Charging'}</span>
            </button>
          </div>

          {/* Liters & Price per Liter OR kWh & Price per kWh */}
          {editEnergyType === 'fuel' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('liters')} (L)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editLiters}
                  onChange={(e) => handleEditLitersChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('pricePerLiter')} (€)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={editPricePerLiter}
                  onChange={(e) => handleEditPriceChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'nl' ? 'Stroom (kWh)' : 'Energy (kWh)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editKwh}
                  onChange={(e) => handleEditKwhChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'nl' ? 'Tarief (€/kWh)' : 'Rate (€/kWh)'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={editPricePerKwh}
                  onChange={(e) => handleEditPricePerKwhChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Total Cost */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('totalCost')} (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editTotalCost}
              onChange={(e) => setEditTotalCost(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-4 py-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsFullTank}
                onChange={(e) => setEditIsFullTank(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('fullTank')}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editMissedPrevious}
                onChange={(e) => setEditMissedPrevious(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('missedPrevious')}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsTowing}
                onChange={(e) => setEditIsTowing(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1">
                <span>🏕️</span>
                <span>{lang === 'nl' ? 'Met caravan / aanhanger' : 'Towing caravan / trailer'}</span>
              </span>
            </label>
          </div>

          {/* Station Name & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('station')}</label>
              <input
                type="text"
                placeholder={lang === 'nl' ? 'Naam van het tankstation' : 'Name of gas station'}
                value={editStationName}
                onChange={(e) => setEditStationName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'nl' ? 'Adres / Plaats' : 'Address / City'}</label>
              <input
                type="text"
                placeholder={lang === 'nl' ? 'Straat, huisnummer en woonplaats' : 'Street, number and city'}
                value={editStationAddress}
                onChange={(e) => setEditStationAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('notes')}</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder={lang === 'nl' ? 'bijv. Euro 95 E10, bandenspanning gecheckt' : 'e.g. Euro 95 E10, tire pressure checked'}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Receipt File */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                {lang === 'nl' ? 'Tankbon / Factuur' : 'Receipt / Invoice'}
              </label>
              <button
                type="button"
                onClick={onRequestOcrScan}
                className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] font-bold inline-flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{lang === 'nl' ? 'Nieuwe bon scannen (AI)' : 'Scan receipt with AI'}</span>
              </button>
            </div>

            {editReceiptPath && !editReceiptFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                    <a
                      href={`/uploads/receipts/${editReceiptPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline truncate font-semibold text-xs"
                    >
                      {editReceiptPath}
                    </a>
                  </div>
                  <div className="flex items-center space-x-1">
                    <a
                      href={`/uploads/receipts/${editReceiptPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded"
                    >
                      {lang === 'nl' ? 'Bekijken' : 'View'}
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditReceiptPath(null)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded"
                      title={t('removeReceipt')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRescanExistingReceipt}
                  disabled={rescanningEdit}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 hover:from-amber-500/20 hover:via-sky-500/20 hover:to-emerald-500/20 text-slate-800 dark:text-slate-100 border border-amber-300/60 dark:border-amber-700/60 rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-2 transition shadow-sm disabled:opacity-50"
                >
                  {rescanningEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>
                    {rescanningEdit
                      ? (lang === 'nl' ? 'Bon wordt geanalyseerd door AI / OCR...' : 'Analyzing receipt...')
                      : (lang === 'nl' ? '⚡ Bestaande bon opnieuw uitlezen met AI / OCR' : '⚡ Re-scan existing receipt with AI / OCR')}
                  </span>
                </button>
              </div>
            )}

            {editReceiptFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="flex items-center space-x-2 truncate">
                    <Paperclip className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {editReceiptFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditReceiptFile(null)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleScanSelectedEditFile}
                  disabled={rescanningEdit}
                  className="w-full py-2 px-3 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-2 transition shadow-sm disabled:opacity-50"
                >
                  {rescanningEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  )}
                  <span>
                    {rescanningEdit
                      ? (lang === 'nl' ? 'Geselecteerde bon wordt uitgelezen...' : 'Reading receipt...')
                      : (lang === 'nl' ? 'Geselecteerde bon direct scannen met AI' : 'Scan selected receipt with AI')}
                  </span>
                </button>
              </div>
            )}

            {!editReceiptFile && (
              <div className="flex items-center space-x-2 pt-1">
                <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-sm">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>{editReceiptPath ? (lang === 'nl' ? 'Vervang bonbestand' : 'Replace file') : t('attachReceipt')}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditReceiptFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
            >
              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{savingEdit ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


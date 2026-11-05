import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { TireSet } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';

interface TireSetModalProps {
  isOpen: boolean;
  editingSet: TireSet | null;
  defaultOdometer: string;
  defaultStatus: 'mounted' | 'stored' | 'disposed';
  availableDocuments: { id: string; name: string; file_path: string }[];
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export const TireSetModal: React.FC<TireSetModalProps> = ({
  isOpen,
  editingSet,
  defaultOdometer,
  defaultStatus,
  availableDocuments,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [season, setSeason] = useState<'summer' | 'winter' | 'all_season'>('summer');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [tireSize, setTireSize] = useState('');
  const [rimSize, setRimSize] = useState('');
  const [speedIndex, setSpeedIndex] = useState('');
  const [dotCode, setDotCode] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [status, setStatus] = useState<'mounted' | 'stored' | 'disposed'>('stored');
  const [treadFl, setTreadFl] = useState('');
  const [treadFr, setTreadFr] = useState('');
  const [treadRl, setTreadRl] = useState('');
  const [treadRr, setTreadRr] = useState('');
  const [totalKm, setTotalKm] = useState('0');
  const [mountedOdometer, setMountedOdometer] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [invoiceDocumentId, setInvoiceDocumentId] = useState('');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setModalError(null);
    if (editingSet) {
      setName(editingSet.name);
      setSeason(editingSet.season);
      setBrand(editingSet.brand || (editingSet.brand_model ? editingSet.brand_model.split(' ')[0] : ''));
      setModel(editingSet.model || (editingSet.brand_model && editingSet.brand_model.includes(' ') ? editingSet.brand_model.substring(editingSet.brand_model.indexOf(' ') + 1) : ''));
      setTireSize(editingSet.tire_size || '');
      setRimSize(editingSet.rim_size || '');
      setSpeedIndex(editingSet.speed_index || '');
      setDotCode(editingSet.dot_code || '');
      setStorageLocation(editingSet.storage_location || '');
      setStatus(editingSet.status);
      setTreadFl(editingSet.tread_depth_fl !== null ? editingSet.tread_depth_fl.toString() : '');
      setTreadFr(editingSet.tread_depth_fr !== null ? editingSet.tread_depth_fr.toString() : '');
      setTreadRl(editingSet.tread_depth_rl !== null ? editingSet.tread_depth_rl.toString() : '');
      setTreadRr(editingSet.tread_depth_rr !== null ? editingSet.tread_depth_rr.toString() : '');
      setTotalKm((editingSet.total_km ?? 0).toString());
      setMountedOdometer(editingSet.mounted_odometer !== null && editingSet.mounted_odometer !== undefined ? editingSet.mounted_odometer.toString() : '');
      setPurchasePrice(editingSet.purchase_price ? editingSet.purchase_price.toString() : '');
      setPurchaseDate(editingSet.purchase_date || '');
      setInvoiceDocumentId(editingSet.invoice_document_id || '');
      setNotes(editingSet.notes || '');
    } else {
      setName('');
      setSeason('summer');
      setBrand('');
      setModel('');
      setTireSize('');
      setRimSize('');
      setSpeedIndex('');
      setDotCode('');
      setStorageLocation('');
      setStatus(defaultStatus);
      setTreadFl('7.5');
      setTreadFr('7.5');
      setTreadRl('7.5');
      setTreadRr('7.5');
      setTotalKm('0');
      setMountedOdometer(defaultOdometer);
      setPurchasePrice('');
      setPurchaseDate('');
      setInvoiceDocumentId('');
      setNotes('');
    }
  }, [isOpen, editingSet, defaultOdometer, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Naam van de bandenset is verplicht.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      const payload = {
        name: name.trim(),
        season,
        brand: brand.trim(),
        model: model.trim(),
        brandModel: brand.trim() ? `${brand.trim()}${model.trim() ? ` ${model.trim()}` : ''}` : '',
        tireSize: tireSize.trim(),
        rimSize: rimSize.trim(),
        speedIndex: speedIndex.trim(),
        dotCode: dotCode.trim(),
        storageLocation: storageLocation.trim(),
        status,
        totalKm: totalKm !== '' ? parseFloat(totalKm) : 0,
        mountedOdometer: mountedOdometer !== '' ? parseFloat(mountedOdometer) : null,
        treadDepthFl: treadFl !== '' ? parseFloat(treadFl) : null,
        treadDepthFr: treadFr !== '' ? parseFloat(treadFr) : null,
        treadDepthRl: treadRl !== '' ? parseFloat(treadRl) : null,
        treadDepthRr: treadRr !== '' ? parseFloat(treadRr) : null,
        notes: notes.trim(),
        purchasePrice: purchasePrice !== '' ? parseFloat(purchasePrice) : 0,
        purchaseDate: purchaseDate || null,
        invoiceDocumentId: invoiceDocumentId || null,
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setModalError(err?.message || 'Fout bij opslaan van bandenset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative text-xs my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingSet ? 'Bandenset Bewerken' : 'Nieuwe Bandenset Registreren'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {modalError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Setnaam / Label *</label>
              <input
                type="text"
                placeholder="bijv. Zomerset 19 inch turbine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Seizoenstype *</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                <option value="summer">Zomerbanden ☀️</option>
                <option value="winter">Winterbanden ❄️</option>
                <option value="all_season">4-Seizoenen / All-season 🌤️</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bandenmerk</label>
              <input
                type="text"
                placeholder="bijv. Michelin, Continental"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bandenmodel</label>
              <input
                type="text"
                placeholder="bijv. Pilot Sport 4S, WinterContact TS870"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bandenmaat</label>
              <input
                type="text"
                placeholder="bijv. 225/45 R18"
                value={tireSize}
                onChange={(e) => setTireSize(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Velgmaat</label>
              <input
                type="text"
                placeholder="bijv. 18 inch, 8.5J ET45"
                value={rimSize}
                onChange={(e) => setRimSize(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Snelheids-/Laadindex</label>
              <input
                type="text"
                placeholder="bijv. 95Y of 91V"
                value={speedIndex}
                onChange={(e) => setSpeedIndex(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">DOT / Productiecode</label>
              <input
                type="text"
                placeholder="bijv. 2423 (week 24, 2023)"
                value={dotCode}
                onChange={(e) => setDotCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Opslaglocatie</label>
              <input
                type="text"
                placeholder="bijv. Zolder, Bandenhotel Euromaster, Schuur"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Huidige Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                <option value="mounted">Gemonteerd onder de auto ✅</option>
                <option value="stored">In opslag / stalling 📦</option>
                <option value="disposed">Afgevoerd / Verkocht ❌</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Profieldiepte (mm)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Linksvoor</label>
                <input
                  type="number"
                  step="0.1"
                  value={treadFl}
                  onChange={(e) => setTreadFl(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rechtsvoor</label>
                <input
                  type="number"
                  step="0.1"
                  value={treadFr}
                  onChange={(e) => setTreadFr(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Linksachter</label>
                <input
                  type="number"
                  step="0.1"
                  value={treadRl}
                  onChange={(e) => setTreadRl(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rechtsachter</label>
                <input
                  type="number"
                  step="0.1"
                  value={treadRr}
                  onChange={(e) => setTreadRr(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Historisch Gereden km op deze set</label>
              <input
                type="number"
                value={totalKm}
                onChange={(e) => setTotalKm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
              />
            </div>
            {status === 'mounted' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Km-stand bij montage</label>
                <input
                  type="number"
                  placeholder="bijv. 124500"
                  value={mountedOdometer}
                  onChange={(e) => setMountedOdometer(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Aanschafprijs (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="bijv. 650.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Aankoopdatum</label>
              <DatePicker
                value={purchaseDate}
                onChange={setPurchaseDate}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Koppel Factuur / Document</label>
            <select
              value={invoiceDocumentId}
              onChange={(e) => setInvoiceDocumentId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="">-- Geen document gekoppeld --</option>
              {availableDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notities</label>
            <textarea
              rows={2}
              placeholder="Bijzonderheden, slijtagepatroon..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold bg-accent-600 hover:bg-accent-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Set Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

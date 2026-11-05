import React, { useEffect, useState } from 'react';
import { Route as RouteIcon, X, AlertCircle, Briefcase, Building2, Home } from 'lucide-react';
import { Trip } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';

interface TripModalProps {
  isOpen: boolean;
  editingTrip: Trip | null;
  defaultStartOdometer: string;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  editingTrip,
  defaultStartOdometer,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [startOdo, setStartOdo] = useState('');
  const [endOdo, setEndOdo] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [purpose, setPurpose] = useState<'business' | 'commute' | 'private'>('business');
  const [description, setDescription] = useState('');
  const [createReturnTrip, setCreateReturnTrip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setModalError(null);
    if (editingTrip) {
      setDate(editingTrip.date);
      setFromLoc(editingTrip.from_location);
      setToLoc(editingTrip.to_location);
      setStartOdo(editingTrip.start_odometer.toString());
      setEndOdo(editingTrip.end_odometer.toString());
      setDistanceKm(editingTrip.distance_km.toString());
      setPurpose(editingTrip.purpose);
      setDescription(editingTrip.description || '');
      setCreateReturnTrip(false);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setFromLoc('');
      setToLoc('');
      setStartOdo(defaultStartOdometer);
      setEndOdo('');
      setDistanceKm('');
      setPurpose('business');
      setDescription('');
      setCreateReturnTrip(false);
    }
  }, [isOpen, editingTrip, defaultStartOdometer]);

  if (!isOpen) return null;

  const handleStartOdoChange = (val: string) => {
    setStartOdo(val);
    const s = parseFloat(val);
    const d = parseFloat(distanceKm);
    if (!isNaN(s) && !isNaN(d) && d >= 0) {
      setEndOdo((s + d).toFixed(1));
    } else {
      const e = parseFloat(endOdo);
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        setDistanceKm((e - s).toFixed(1));
      }
    }
  };

  const handleEndOdoChange = (val: string) => {
    setEndOdo(val);
    const s = parseFloat(startOdo);
    const e = parseFloat(val);
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      setDistanceKm((e - s).toFixed(1));
    }
  };

  const handleDistanceChange = (val: string) => {
    setDistanceKm(val);
    const s = parseFloat(startOdo);
    const d = parseFloat(val);
    if (!isNaN(s) && !isNaN(d) && d >= 0) {
      setEndOdo((s + d).toFixed(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sOdo = parseFloat(startOdo);
    const eOdo = parseFloat(endOdo);
    const dist = parseFloat(distanceKm);

    if (isNaN(sOdo) || isNaN(eOdo) || isNaN(dist) || dist < 0) {
      setModalError('Voer geldige kilometerstanden en afstanden in.');
      return;
    }

    if (eOdo < sOdo) {
      setModalError('Eindstand moet groter of gelijk zijn aan de beginstand.');
      return;
    }

    if (!fromLoc.trim() || !toLoc.trim()) {
      setModalError('Vertrek- en aankomstadres zijn verplicht.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      await onSave({
        date,
        from_location: fromLoc.trim(),
        to_location: toLoc.trim(),
        start_odometer: sOdo,
        end_odometer: eOdo,
        distance_km: dist,
        purpose,
        description: description.trim() || null,
        create_return_trip: createReturnTrip,
      });
      onClose();
    } catch (err: any) {
      setModalError(err?.message || 'Fout bij het opslaan van de rit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <RouteIcon className="w-4 h-4 text-indigo-500" />
            <span>{editingTrip ? 'Rit Bewerken' : 'Nieuwe Rit Registreren'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {modalError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Datum</label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vertrekadres</label>
              <input
                type="text"
                required
                placeholder="Vertrekplaats of adres"
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Aankomstadres</label>
              <input
                type="text"
                required
                placeholder="Bestemming of adres"
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Beginstand (km)</label>
              <input
                type="number"
                step="0.1"
                required
                value={startOdo}
                onChange={(e) => handleStartOdoChange(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Eindstand (km)</label>
              <input
                type="number"
                step="0.1"
                required
                value={endOdo}
                onChange={(e) => handleEndOdoChange(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Afstand (km)</label>
              <input
                type="number"
                step="0.1"
                required
                value={distanceKm}
                onChange={(e) => handleDistanceChange(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Karakter van de rit</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPurpose('business')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  purpose === 'business'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Zakelijk</span>
              </button>
              <button
                type="button"
                onClick={() => setPurpose('commute')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  purpose === 'commute'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Woon-werk</span>
              </button>
              <button
                type="button"
                onClick={() => setPurpose('private')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  purpose === 'private'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Privé</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Toelichting / Project / Klant</label>
            <input
              type="text"
              placeholder="Optionele toelichting of zakelijke afspraak"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {!editingTrip && (
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="returnTripCheckbox"
                checked={createReturnTrip}
                onChange={(e) => setCreateReturnTrip(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="returnTripCheckbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Direct ook de terugrit aanmaken (omgekeerde route)
              </label>
            </div>
          )}

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
              {saving ? 'Opslaan...' : 'Rit Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


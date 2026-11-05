import React, { useEffect, useState } from 'react';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { TireSet } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';

interface TireSwapModalProps {
  isOpen: boolean;
  swapTargetSet: TireSet | null;
  defaultOdometer: string;
  onClose: () => void;
  onSave: (currentOdometer: number, date: string) => Promise<void>;
}

export const TireSwapModal: React.FC<TireSwapModalProps> = ({
  isOpen,
  swapTargetSet,
  defaultOdometer,
  onClose,
  onSave,
}) => {
  const [swapOdometer, setSwapOdometer] = useState('');
  const [swapDate, setSwapDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSwapOdometer(defaultOdometer);
      setSwapDate(new Date().toISOString().split('T')[0]);
      setModalError(null);
    }
  }, [isOpen, defaultOdometer]);

  if (!isOpen || !swapTargetSet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const odo = parseFloat(swapOdometer);
    if (isNaN(odo) || odo < 0) {
      setModalError('Voer een geldige kilometerstand in.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      await onSave(odo, swapDate);
      onClose();
    } catch (err: any) {
      setModalError(err?.message || 'Fout bij het wisselen van bandenset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative text-xs my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ArrowLeftRight className="w-4 h-4 text-sky-500" />
            <span>Bandenset Monteren</span>
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

        <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Je staat op het punt om <strong>{swapTargetSet.name}</strong> te monteren onder het voertuig.
          Als er nu al een set gemonteerd is, wordt deze automatisch in opslag geplaatst en worden de gereden kilometers berekend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kilometerstand bij wissel *
            </label>
            <input
              type="number"
              placeholder="bijv. 145000"
              value={swapOdometer}
              onChange={(e) => setSwapOdometer(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Wisseldatum *</label>
            <DatePicker
              value={swapDate}
              onChange={setSwapDate}
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
              className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Wisselen...' : 'Bevestig Montage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

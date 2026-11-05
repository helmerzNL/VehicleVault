import React, { useEffect, useState } from 'react';
import { X, Gauge, AlertCircle } from 'lucide-react';
import { TireSet } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';

interface TireTreadModalProps {
  isOpen: boolean;
  treadTargetSet: TireSet | null;
  onClose: () => void;
  onSave: (treads: {
    fl: number | null;
    fr: number | null;
    rl: number | null;
    rr: number | null;
    date: string;
  }) => Promise<void>;
}

export const TireTreadModal: React.FC<TireTreadModalProps> = ({
  isOpen,
  treadTargetSet,
  onClose,
  onSave,
}) => {
  const [quickFl, setQuickFl] = useState('');
  const [quickFr, setQuickFr] = useState('');
  const [quickRl, setQuickRl] = useState('');
  const [quickRr, setQuickRr] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && treadTargetSet) {
      setQuickFl(treadTargetSet.tread_depth_fl !== null ? treadTargetSet.tread_depth_fl.toString() : '');
      setQuickFr(treadTargetSet.tread_depth_fr !== null ? treadTargetSet.tread_depth_fr.toString() : '');
      setQuickRl(treadTargetSet.tread_depth_rl !== null ? treadTargetSet.tread_depth_rl.toString() : '');
      setQuickRr(treadTargetSet.tread_depth_rr !== null ? treadTargetSet.tread_depth_rr.toString() : '');
      setQuickDate(new Date().toISOString().split('T')[0]);
      setModalError(null);
    }
  }, [isOpen, treadTargetSet]);

  if (!isOpen || !treadTargetSet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setModalError(null);
      await onSave({
        fl: quickFl !== '' ? parseFloat(quickFl) : null,
        fr: quickFr !== '' ? parseFloat(quickFr) : null,
        rl: quickRl !== '' ? parseFloat(quickRl) : null,
        rr: quickRr !== '' ? parseFloat(quickRr) : null,
        date: quickDate,
      });
      onClose();
    } catch (err: any) {
      setModalError(err?.message || 'Fout bij opslaan van profieldieptes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-amber-500" />
            <span>Profieldiepte Meten: {treadTargetSet.name}</span>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Linksvoor (mm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="bijv. 6.5"
                value={quickFl}
                onChange={(e) => setQuickFl(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rechtsvoor (mm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="bijv. 6.5"
                value={quickFr}
                onChange={(e) => setQuickFr(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Linksachter (mm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="bijv. 5.8"
                value={quickRl}
                onChange={(e) => setQuickRl(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rechtsachter (mm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="bijv. 5.8"
                value={quickRr}
                onChange={(e) => setQuickRr(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Meetdatum</label>
            <DatePicker
              value={quickDate}
              onChange={setQuickDate}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
              {saving ? 'Opslaan...' : 'Meting Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

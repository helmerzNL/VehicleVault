import React, { useState, useEffect } from 'react';
import { ShieldCheck, Edit2, X } from 'lucide-react';
import { MaintenanceInterval, ServiceCategory } from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { apiFetch } from '../../api/client.js';

interface IntervalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  vehicleId: string;
  categories: ServiceCategory[];
  editingInterval?: MaintenanceInterval | null;
  defaultOdometer?: number;
}

export const IntervalModal: React.FC<IntervalModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  vehicleId,
  categories,
  editingInterval,
  defaultOdometer,
}) => {
  const { t, translateCategory, lang } = useLanguage();

  const [categoryId, setCategoryId] = useState('');
  const [customName, setCustomName] = useState('');
  const [intervalKm, setIntervalKm] = useState('15000');
  const [intervalMonths, setIntervalMonths] = useState('12');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [lastServiceOdo, setLastServiceOdo] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingInterval) {
      setCategoryId(editingInterval.categoryId || (categories[0]?.id || ''));
      setCustomName(editingInterval.customName || '');
      setIntervalKm(editingInterval.intervalKm ? String(editingInterval.intervalKm) : '');
      setIntervalMonths(editingInterval.intervalMonths ? String(editingInterval.intervalMonths) : '');
      setLastServiceDate(editingInterval.lastServiceDate ? editingInterval.lastServiceDate.split('T')[0] : '');
      setLastServiceOdo(editingInterval.lastServiceOdometer ? String(editingInterval.lastServiceOdometer) : '0');
    } else {
      setCategoryId(categories[0]?.id || '');
      setCustomName('');
      setIntervalKm('15000');
      setIntervalMonths('12');
      setLastServiceDate('');
      setLastServiceOdo(defaultOdometer ? String(defaultOdometer) : '0');
    }
  }, [editingInterval, categories, defaultOdometer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingInterval) {
        await apiFetch(`/api/maintenance/intervals/${editingInterval.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            custom_name: customName || null,
            interval_km: intervalKm ? parseInt(intervalKm, 10) : null,
            interval_months: intervalMonths ? parseInt(intervalMonths, 10) : null,
            last_service_date: lastServiceDate || null,
            last_service_odometer: lastServiceOdo ? parseInt(lastServiceOdo, 10) : null,
          }),
        });
      } else {
        await apiFetch('/api/maintenance/intervals', {
          method: 'POST',
          body: JSON.stringify({
            vehicle_id: vehicleId,
            category_id: categoryId,
            custom_name: customName || null,
            interval_km: intervalKm ? parseInt(intervalKm, 10) : null,
            interval_months: intervalMonths ? parseInt(intervalMonths, 10) : null,
            last_service_date: lastServiceDate || null,
            last_service_odometer: lastServiceOdo ? parseInt(lastServiceOdo, 10) : null,
          }),
        });
      }
      await onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Fout bij opslaan interval');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = Boolean(editingInterval);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center safe-overlay">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            {isEditing ? (
              <Edit2 className="w-4 h-4 text-sky-500" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
            <span>
              {isEditing
                ? `${t('editPart')}: ${translateCategory(editingInterval?.customName || editingInterval?.categoryName || '')}`
                : t('addPart')}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!isEditing && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('partName')}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-sky-500 shadow-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {translateCategory(c.name)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('customName')}
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={lang === 'nl' ? 'Eigen benaming (optioneel)' : 'Custom name (optional)'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('intervalDistance')}
              </label>
              <input
                type="number"
                value={intervalKm}
                onChange={(e) => setIntervalKm(e.target.value)}
                placeholder="15000"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('intervalTime')}
              </label>
              <input
                type="number"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(e.target.value)}
                placeholder="12"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DatePicker
                label={t('lastServiceDate')}
                value={lastServiceDate}
                onChange={setLastServiceDate}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('lastServiceKm')}
              </label>
              <input
                type="number"
                value={lastServiceOdo}
                onChange={(e) => setLastServiceOdo(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
            >
              {submitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


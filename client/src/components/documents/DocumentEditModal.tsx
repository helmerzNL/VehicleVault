import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { VehicleDocument } from '../../types/index.js';

interface DocumentEditModalProps {
  isOpen: boolean;
  editingDoc: VehicleDocument | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  editName: string;
  setEditName: (v: string) => void;
  editCategory: 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other';
  setEditCategory: (v: 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other') => void;
  editDate: string;
  setEditDate: (v: string) => void;
  editExpiresAt: string;
  setEditExpiresAt: (v: string) => void;
  editNotes: string;
  setEditNotes: (v: string) => void;
  isSavingEdit: boolean;
}

export const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  isOpen,
  editingDoc,
  onClose,
  onSave,
  editName,
  setEditName,
  editCategory,
  setEditCategory,
  editDate,
  setEditDate,
  editExpiresAt,
  setEditExpiresAt,
  editNotes,
  setEditNotes,
  isSavingEdit,
}) => {
  const { t, lang } = useLanguage();

  if (!isOpen || !editingDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold">
            {lang === 'nl' ? 'Document Gegevens Bewerken' : 'Edit Document Details'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('documentName')} *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('documentCategory')} *
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
              >
                <option value="registration">{t('docCatRegistration')}</option>
                <option value="insurance">{t('docCatInsurance')}</option>
                <option value="apk">{t('docCatApk')}</option>
                <option value="invoice">{t('docCatInvoices')}</option>
                <option value="manual">{t('docCatManual')}</option>
                <option value="other">{t('docCatOther')}</option>
              </select>
            </div>

            <div>
              <DatePicker label={lang === 'nl' ? 'Document- / Factuurdatum' : 'Document / Invoice Date'} value={editDate} onChange={setEditDate} />
            </div>
          </div>

          <div>
            <DatePicker
              label={lang === 'nl' ? 'Vervaldatum (optioneel, voor bijv. polis of keuring)' : 'Expiration Date (optional, e.g. for policy or inspection)'}
              value={editExpiresAt}
              onChange={setEditExpiresAt}
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('notes')}
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder={lang === 'nl' ? 'Notities...' : 'Notes...'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSavingEdit || !editName.trim()}
              className="px-5 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
            >
              {isSavingEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

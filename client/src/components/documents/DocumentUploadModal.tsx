import React from 'react';
import { UploadCloud, X, RefreshCw, Sparkles } from 'lucide-react';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (e: React.FormEvent) => void;
  docFile: File | null;
  docName: string;
  setDocName: (v: string) => void;
  docCategory: 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other';
  setDocCategory: (v: 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other') => void;
  docNotes: string;
  setDocNotes: (v: string) => void;
  docExpiresAt: string;
  setDocExpiresAt: (v: string) => void;
  docDate: string;
  setDocDate: (v: string) => void;
  isUploading: boolean;
  compressing: boolean;
  compressionRatio: string | null;
  isDragging: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void;
  onDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
  onRemoveFile: () => void;
  isScanning?: boolean;
  scanExtraction?: any;
  scanWarning?: string | null;
  onReScan?: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  docFile,
  docName,
  setDocName,
  docCategory,
  setDocCategory,
  docNotes,
  setDocNotes,
  docExpiresAt,
  setDocExpiresAt,
  docDate,
  setDocDate,
  isUploading,
  compressing,
  compressionRatio,
  isDragging,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFile,
  isScanning = false,
  scanExtraction = null,
  scanWarning = null,
  onReScan,
}) => {
  const { t, lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold">{t('uploadDocument')}</h3>
            <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>AI OCR</span>
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onUpload} className="space-y-4 text-xs">
          {/* Drag & drop file area */}
          <label
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              isDragging
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <input type="file" accept=".pdf,image/*" onChange={onFileChange} className="hidden" />
            {isScanning ? (
              <div className="py-2 flex flex-col items-center space-y-1.5">
                <Sparkles className="w-7 h-7 text-sky-500 animate-spin" />
                <span className="font-bold text-sky-600 dark:text-sky-400 text-xs animate-pulse">
                  {t('scanningDocument')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t('scanDocumentHint')}
                </span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                {docFile ? (
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">{docFile.name}</span>
                    <span className="text-[11px] text-slate-400 block">{(docFile.size / 1024).toFixed(0)} KB</span>
                    {compressing && (
                      <span className="text-[11px] text-amber-500 inline-flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>{lang === 'nl' ? 'Bezig met comprimeren...' : 'Compressing image...'}</span>
                      </span>
                    )}
                    {compressionRatio && (
                      <span className="text-[10px] text-emerald-500 block font-medium">
                        {lang === 'nl' ? 'Compressie' : 'Compression'}: {compressionRatio}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {lang === 'nl' ? 'Klik om te bladeren of sleep een bestand hierheen' : 'Click to browse or drop a file here'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">PDF, JPG, PNG, WEBP (max 30MB) • Met automatische AI-herkenning</span>
                  </div>
                )}
              </>
            )}
          </label>

          {/* AI Extraction Banner */}
          {scanExtraction && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center space-x-2 truncate">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium truncate">
                  {t('scanDocumentSuccess')}: {scanExtraction.issuer ? `${scanExtraction.issuer} • ` : ''}
                  {scanExtraction.title}
                  {scanExtraction.totalAmount ? ` • €${scanExtraction.totalAmount.toFixed(2)}` : ''}
                </span>
              </div>
              {onReScan && (
                <button
                  type="button"
                  onClick={onReScan}
                  disabled={isScanning}
                  className="text-[10px] underline hover:text-emerald-900 dark:hover:text-emerald-100 shrink-0 ml-2 font-semibold"
                >
                  {t('rescanDocument')}
                </button>
              )}
            </div>
          )}

          {/* AI Warning if any */}
          {scanWarning && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-center justify-between">
              <span className="truncate">{scanWarning}</span>
              {onReScan && docFile && (
                <button
                  type="button"
                  onClick={onReScan}
                  disabled={isScanning}
                  className="text-[10px] font-bold underline ml-2 shrink-0"
                >
                  {t('rescanDocument')}
                </button>
              )}
            </div>
          )}

          {docFile && (
            <div className="flex items-center justify-between">
              {!isScanning && (
                <button
                  type="button"
                  onClick={onReScan}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center space-x-1 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('scanDocument')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRemoveFile}
                className="text-[11px] text-rose-500 hover:text-rose-600 block text-right font-medium ml-auto"
              >
                {lang === 'nl' ? 'Bestand verwijderen' : 'Remove file'}
              </button>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('documentName')} *</label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder={lang === 'nl' ? 'bijv. Factuur Inschrijving - Kia Nederland' : 'e.g. Registration Invoice - Kia'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('documentCategory')} *</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as any)}
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
              <DatePicker label={lang === 'nl' ? 'Document- / Factuurdatum' : 'Document / Invoice Date'} value={docDate} onChange={setDocDate} />
            </div>
          </div>

          <div>
            <DatePicker
              label={lang === 'nl' ? 'Vervaldatum (optioneel, voor bijv. polis of keuring)' : 'Expiration Date (optional, e.g. for policy or inspection)'}
              value={docExpiresAt}
              onChange={setDocExpiresAt}
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('notes')}</label>
            <textarea
              rows={2}
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              placeholder={lang === 'nl' ? 'bijv. Inschrijving voertuig, factuurnummer, polisnummer...' : 'e.g. Vehicle registration, invoice number, policy number...'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isUploading || isScanning || !docFile}
              className="px-5 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl font-bold transition shadow-sm disabled:opacity-50 inline-flex items-center space-x-1.5"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('upload')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

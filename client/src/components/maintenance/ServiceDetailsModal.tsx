import React from 'react';
import { X, Languages, Building2, MapPin, FileText, Edit2 } from 'lucide-react';
import { ServiceRecord, InvoiceLineItem } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface ServiceDetailsModalProps {
  record: ServiceRecord | null;
  onClose: () => void;
  onEditRecord: (record: ServiceRecord) => void;
  onPreviewInvoice: (doc: { title: string; url: string; date?: string; notes?: string }) => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  record,
  onClose,
  onEditRecord,
  onPreviewInvoice,
}) => {
  const { t, lang } = useLanguage();
  if (!record) return null;

  let modalItems: InvoiceLineItem[] = [];
  if (record.line_items) {
    try {
      modalItems = JSON.parse(record.line_items);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center safe-overlay">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-safe-90vh flex flex-col animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {record.service_item}
            </h3>
            {record.performing_party === 'garage' && (
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>{record.garage_name || t('garage')}</span>
                </span>
                {record.garage_address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${record.garage_name ? record.garage_name + ', ' : ''}${record.garage_address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition underline decoration-dotted"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{record.garage_address}</span>
                  </a>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cost Summary Strip */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              {lang === 'nl' ? 'Totaalbedrag' : 'Total Cost'}
            </span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
              € {(record.cost || 0).toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              {t('partsCostShort')}
            </span>
            <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">
              € {(record.parts_cost ?? (record.performing_party === 'self' ? record.cost : 0)).toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              {t('laborCostShort')}
            </span>
            <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
              € {(record.labor_cost || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Scrollable Body: Extracted Line Items & Notes */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {modalItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-sky-50/70 dark:bg-sky-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-sky-500" />
                  <span>
                    {lang === 'nl'
                      ? `Uitgelezen & Vertaalde Factuurregels (${modalItems.length})`
                      : `Extracted & Translated Invoice Items (${modalItems.length})`}
                  </span>
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {modalItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-start justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                            item.category === 'labor'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300'
                          }`}
                        >
                          {item.category === 'labor'
                            ? (lang === 'nl' ? 'Arbeid' : 'Labor')
                            : (lang === 'nl' ? 'Onderdeel' : 'Part')}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.translatedDescription}
                        </span>
                        {item.quantity && (
                          <span className="text-xs text-slate-400 font-mono">
                            ({item.quantity})
                          </span>
                        )}
                      </div>
                      {item.originalDescription &&
                        item.originalDescription.toLowerCase() !==
                          item.translatedDescription.toLowerCase() && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">
                            Origineel: "{item.originalDescription}"
                          </div>
                        )}
                    </div>
                    {item.totalPrice !== null && (
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                        € {item.totalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('notes')}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {record.invoice_path && (
              <button
                type="button"
                onClick={() => {
                  onPreviewInvoice({
                    title: `${record.service_item} — ${record.garage_name || (lang === 'nl' ? 'Factuur' : 'Invoice')}`,
                    url: `/uploads/invoices/${record.invoice_path}`,
                    date: record.date,
                    notes: record.notes || undefined,
                  });
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 font-bold text-xs transition"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>{lang === 'nl' ? 'Originele Factuur Bekijken' : 'View Original Invoice'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditRecord(record);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{lang === 'nl' ? 'Beurt Bewerken' : 'Edit Record'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs transition shadow-sm"
            >
              {lang === 'nl' ? 'Sluiten' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


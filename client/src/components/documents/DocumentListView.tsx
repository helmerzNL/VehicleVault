import React from 'react';
import {
  FileText,
  FileCheck,
  File,
  Eye,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react';
import { VehicleDocument } from '../../types/index.js';
import { formatDisplayDate } from '../../utils/format.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface DocumentListViewProps {
  documents: VehicleDocument[];
  viewMode: 'list' | 'grid';
  onPreview: (doc: { title: string; url: string; fileSize?: number; notes?: string }) => void;
  onEdit: (doc: VehicleDocument) => void;
  onDelete: (id: string) => void;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  viewMode,
  onPreview,
  onEdit,
  onDelete,
}) => {
  const { t, lang } = useLanguage();

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDocumentTitle = (title: string): string => {
    if (!title) return '';
    return title.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3-$2-$1');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'registration':
        return {
          label: t('docCatRegistration'),
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
        };
      case 'insurance':
        return {
          label: t('docCatInsurance'),
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
        };
      case 'apk':
        return {
          label: t('docCatApk'),
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
        };
      case 'invoice':
        return {
          label: t('docCatInvoices'),
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
        };
      case 'manual':
        return {
          label: t('docCatManual'),
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40',
        };
      default:
        return {
          label: t('docCatOther'),
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
    }
  };

  const extractDocumentDate = (doc: VehicleDocument): string => {
    if (doc.document_date && /^\d{4}-\d{2}-\d{2}$/.test(doc.document_date)) {
      return doc.document_date;
    }
    const dmyMatch = doc.name ? doc.name.match(/\b([0-3]?[0-9])[-/.]([0-1]?[0-9])[-/.]([12][0-9]{3})\b/) : null;
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }
    const ymdMatch = doc.name ? doc.name.match(/\b([12][0-9]{3})[-/.]([0-1]?[0-9])[-/.]([0-3]?[0-9])\b/) : null;
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
    }
    return doc.created_at ? doc.created_at.split('T')[0] : '1970-01-01';
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-2.5">
        {documents.map((doc) => {
          const badge = getCategoryBadge(doc.category);
          const isPdf = doc.mime_type?.includes('pdf') || doc.file_path.endsWith('.pdf');
          const isImage = doc.mime_type?.includes('image') || /\.(jpg|jpeg|png|webp|heic)$/i.test(doc.file_path);
          const downloadUrl = `/uploads/documents/${doc.file_path}`;
          const dateStr = extractDocumentDate(doc);

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
            >
              <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    isPdf
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200/60 dark:border-rose-900/40'
                      : isImage
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-500 border-sky-200/60 dark:border-sky-900/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isPdf ? (
                    <FileText className="w-5 h-5 text-rose-500" />
                  ) : isImage ? (
                    <FileCheck className="w-5 h-5 text-sky-500" />
                  ) : (
                    <File className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition"
                    title={formatDocumentTitle(doc.name)}
                  >
                    {formatDocumentTitle(doc.name)}
                  </h4>

                  <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.badgeClass}`}>
                      {badge.label}
                    </span>

                    {dateStr && dateStr !== '1970-01-01' && (
                      <button
                        type="button"
                        onClick={() => onEdit(doc)}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 dark:bg-slate-800 dark:hover:bg-sky-950/40 dark:text-slate-300 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300 transition cursor-pointer"
                        title={lang === 'nl' ? 'Klik om datum of document te wijzigen' : 'Click to edit date or document'}
                      >
                        📅 {formatDisplayDate(dateStr)}
                      </button>
                    )}

                    {doc.expires_at && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        ⏳ {formatDisplayDate(doc.expires_at)}
                      </span>
                    )}

                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {formatFileSize(doc.file_size)}
                    </span>

                    {doc.notes && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate max-w-xs" title={doc.notes}>
                        • "{doc.notes}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 flex-shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onPreview({
                      title: formatDocumentTitle(doc.name),
                      url: downloadUrl,
                      fileSize: doc.file_size,
                      notes: doc.notes || undefined,
                    })
                  }
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-xl transition inline-flex items-center space-x-1.5 font-bold text-xs border border-sky-200/60 dark:border-sky-800/40 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-500" />
                  <span>{lang === 'nl' ? 'Bekijken' : 'Preview'}</span>
                </button>

                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition inline-flex items-center space-x-1.5 font-semibold text-xs border border-slate-200/60 dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('download')}</span>
                </a>

                <button
                  type="button"
                  onClick={() => onEdit(doc)}
                  className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDelete(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const badge = getCategoryBadge(doc.category);
        const isPdf = doc.mime_type?.includes('pdf') || doc.file_path.endsWith('.pdf');
        const isImage = doc.mime_type?.includes('image') || /\.(jpg|jpeg|png|webp|heic)$/i.test(doc.file_path);
        const downloadUrl = `/uploads/documents/${doc.file_path}`;
        const dateStr = extractDocumentDate(doc);

        return (
          <div
            key={doc.id}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.badgeClass}`}>
                  {badge.label}
                </span>
                <span className="text-[11px] text-slate-400">{formatFileSize(doc.file_size)}</span>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {isPdf ? <FileText className="w-5 h-5 text-rose-500" /> : isImage ? <FileCheck className="w-5 h-5 text-sky-500" /> : <File className="w-5 h-5 text-slate-500" />}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={formatDocumentTitle(doc.name)}>
                  {formatDocumentTitle(doc.name)}
                </h4>
              </div>

              {dateStr && dateStr !== '1970-01-01' && (
                <p className="text-xs text-slate-500 mb-2">📅 {formatDisplayDate(dateStr)}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  onPreview({
                    title: formatDocumentTitle(doc.name),
                    url: downloadUrl,
                    fileSize: doc.file_size,
                    notes: doc.notes || undefined,
                  })
                }
                className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{lang === 'nl' ? 'Bekijken' : 'Preview'}</span>
              </button>
              <div className="flex items-center space-x-1">
                <button onClick={() => onEdit(doc)} className="p-1 text-slate-400 hover:text-slate-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(doc.id)} className="p-1 text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


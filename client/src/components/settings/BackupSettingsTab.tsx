import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coffee,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';

export const BackupSettingsTab: React.FC = () => {
  const { lang } = useLanguage();

  const [storageStats, setStorageStats] = useState<{
    databaseSizeFormatted: string;
    totalUploadsFormatted: string;
    dataDir: string;
  } | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const loadStorageStats = async () => {
    try {
      const res = await apiFetch<any>('/api/backup/stats');
      setStorageStats(res);
    } catch {}
  };

  useEffect(() => {
    loadStorageStats();
  }, []);

  const handleDownloadBackup = async () => {
    try {
      const token = localStorage.getItem('vv_token');
      const res = await fetch('/api/backup/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Backup download mislukt');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehiclevault-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err?.message || 'Fout bij downloaden van backup');
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!confirm(`Weet je zeker dat je de backup "${file.name}" wilt terugzetten? De huidige database wordt bijgewerkt.`)) {
      e.target.value = '';
      return;
    }

    setRestoringBackup(true);
    setRestoreMessage(null);
    setRestoreError(null);

    const formData = new FormData();
    formData.append('backup', file);

    try {
      const token = localStorage.getItem('vv_token');
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Herstellen van backup mislukt');

      setRestoreMessage(data.message || 'Backup succesvol hersteld!');
      loadStorageStats();
    } catch (err: any) {
      setRestoreError(err?.message || 'Fout bij herstellen van backup');
    } finally {
      setRestoringBackup(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-rose-500" />
            <span>{lang === 'nl' ? '1-Klik Database & Bestanden Backup' : '1-Click Database & Files Backup'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'nl'
              ? 'Download een compleet ZIP-archief met de SQLite database en alle geüploade tankbonnen en facturen.'
              : 'Download a complete ZIP archive containing the SQLite database and all uploaded receipts and invoices.'}
          </p>
        </div>

        {/* Storage Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {lang === 'nl' ? 'Database Grootte' : 'Database Size'}
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {storageStats?.databaseSizeFormatted || '—'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {lang === 'nl' ? 'Geüploade Bestanden' : 'Uploaded Files'}
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {storageStats?.totalUploadsFormatted || '—'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {lang === 'nl' ? 'Opslagpad' : 'Storage Path'}
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate">
              {storageStats?.dataDir || '/data'}
            </span>
          </div>
        </div>

        {/* Restore Notification Feedback */}
        {restoreMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{restoreMessage}</span>
          </div>
        )}

        {restoreError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Download & Restore Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'nl' ? 'Backup Exporteren' : 'Export Backup'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {lang === 'nl'
                  ? 'Creëert een consistent ZIP-bestand van vehiclevault.db en de uploads.'
                  : 'Creates a consistent ZIP file containing vehiclevault.db and uploads.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'nl' ? 'Download Volledige Backup (.zip)' : 'Download Complete Backup (.zip)'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-2">
                <Upload className="w-4 h-4 text-sky-500" />
                <span>{lang === 'nl' ? 'Backup Terugzetten' : 'Restore Backup'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {lang === 'nl'
                  ? 'Herstel VehicleVault vanaf een eerder gedownload ZIP-archief.'
                  : 'Restore VehicleVault from a previous ZIP archive backup.'}
              </p>
            </div>

            <label
              className={`w-full py-2.5 px-4 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm ${
                restoringBackup ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {restoringBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>
                {restoringBackup
                  ? (lang === 'nl' ? 'Bezig met herstellen...' : 'Restoring...')
                  : (lang === 'nl' ? 'Selecteer ZIP Backup Bestand' : 'Select ZIP Backup File')}
              </span>
              <input
                type="file"
                accept=".zip"
                disabled={restoringBackup}
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Support on Ko-fi */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50/80 to-amber-50/60 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                {lang === 'nl' ? 'Ondersteun VehicleVault' : 'Support VehicleVault'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'nl'
                  ? 'Trakteer de ontwikkelaar op een kop koffie via Ko-fi!'
                  : 'Buy the developer a coffee on Ko-fi!'}
              </p>
            </div>
          </div>
          <a
            href="https://ko-fi.com/D1D51ZGUNL"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-1.5 transition shrink-0"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Support on Ko-fi</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
};


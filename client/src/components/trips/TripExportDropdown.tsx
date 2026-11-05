import React, { useEffect, useState, useRef } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { Vehicle } from '../../types/index.js';
import { apiFetch } from '../../api/client.js';

interface TripExportDropdownProps {
  selectedVehicle: Vehicle;
  selectedYear: string;
}

export const TripExportDropdown: React.FC<TripExportDropdownProps> = ({
  selectedVehicle,
  selectedYear,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerDownload = (blob: Blob, defaultFilename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = async () => {
    try {
      setExportingType('csv');
      let url = `/api/trips/export/csv?vehicleId=${selectedVehicle.id}`;
      if (selectedYear && selectedYear !== 'all') url += `&year=${selectedYear}`;
      const blob = await apiFetch<Blob>(url);
      const plate = selectedVehicle.license_plate ? selectedVehicle.license_plate.replace(/[^a-zA-Z0-9]/g, '_') : 'ritten';
      const yearStr = selectedYear && selectedYear !== 'all' ? selectedYear : 'compleet';
      triggerDownload(blob, `Rittenregistratie_${plate}_${yearStr}.csv`);
    } catch (err: any) {
      alert(err?.message || 'Kon CSV niet downloaden');
    } finally {
      setExportingType(null);
      setIsExportMenuOpen(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setExportingType('excel');
      let url = `/api/trips/export/excel?vehicleId=${selectedVehicle.id}`;
      if (selectedYear && selectedYear !== 'all') url += `&year=${selectedYear}`;
      const blob = await apiFetch<Blob>(url);
      const plate = selectedVehicle.license_plate ? selectedVehicle.license_plate.replace(/[^a-zA-Z0-9]/g, '_') : 'ritten';
      const yearStr = selectedYear && selectedYear !== 'all' ? selectedYear : 'compleet';
      triggerDownload(blob, `Rittenregistratie_${plate}_${yearStr}.xlsx`);
    } catch (err: any) {
      alert(err?.message || 'Kon Excel niet downloaden');
    } finally {
      setExportingType(null);
      setIsExportMenuOpen(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setExportingType('pdf');
      let url = `/api/trips/export/pdf?vehicleId=${selectedVehicle.id}`;
      if (selectedYear && selectedYear !== 'all') url += `&year=${selectedYear}`;
      const blob = await apiFetch<Blob>(url);
      const plate = selectedVehicle.license_plate ? selectedVehicle.license_plate.replace(/[^a-zA-Z0-9]/g, '_') : 'ritten';
      const yearStr = selectedYear && selectedYear !== 'all' ? selectedYear : 'compleet';
      triggerDownload(blob, `Rittenregistratie_${plate}_${yearStr}.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Kon PDF niet downloaden');
    } finally {
      setExportingType(null);
      setIsExportMenuOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={exportMenuRef}>
      <button
        type="button"
        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition border border-slate-200 dark:border-slate-700 shadow-xs"
      >
        {exportingType ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
        )}
        <span>Exporteren</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {isExportMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            Exportformaat kiezen
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={!!exportingType}
            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-3 transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Excel (.xlsx)
              </div>
              <div className="text-[10px] text-slate-400">
                Met opmaak, formules & KPI totalen
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!!exportingType}
            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-3 transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400">
                PDF Rapport
              </div>
              <div className="text-[10px] text-slate-400">
                A4 liggend voor belastingarchief
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!!exportingType}
            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-3 transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Belastingdienst CSV
              </div>
              <div className="text-[10px] text-slate-400">
                Standaard UTF-8 met puntkomma
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};


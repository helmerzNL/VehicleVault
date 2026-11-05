import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Table,
} from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { Vehicle } from '../../types/index.js';

export const ImportSettingsTab: React.FC = () => {
  const outlet = useOutletContext<{ vehicles?: Vehicle[]; selectedVehicle?: Vehicle | null }>();
  const [vehicles, setVehicles] = useState<Vehicle[]>(outlet?.vehicles || []);
  const selectedVehicle = outlet?.selectedVehicle || null;

  useEffect(() => {
    if (outlet?.vehicles && outlet.vehicles.length > 0) {
      setVehicles(outlet.vehicles);
    } else {
      apiFetch<{ vehicles: Vehicle[] }>('/api/vehicles')
        .then((res) => {
          if (res.vehicles) setVehicles(res.vehicles);
        })
        .catch(() => {});
    }
  }, [outlet?.vehicles]);

  const [importVehicleId, setImportVehicleId] = useState('');
  const [forcedFormat, setForcedFormat] = useState<'auto' | 'fuelio' | 'lubelogger' | 'generic'>('auto');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResultMessage, setImportResultMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importExecuting, setImportExecuting] = useState(false);

  // Column mapper state
  const [showMapping, setShowMapping] = useState(false);
  const [recordType, setRecordType] = useState<'fuel' | 'service'>('fuel');
  const [dateCol, setDateCol] = useState('');
  const [odoCol, setOdoCol] = useState('');
  const [costCol, setCostCol] = useState('');
  const [litersCol, setLitersCol] = useState('');
  const [notesCol, setNotesCol] = useState('');

  const targetVehicleId = importVehicleId || selectedVehicle?.id || vehicles[0]?.id || '';

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setImportPreview(null);
      setImportResultMessage(null);
      setImportError(null);
    }
  };

  const handleImportPreview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!csvFile || !targetVehicleId) return;

    setImportLoading(true);
    setImportError(null);
    setImportResultMessage(null);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('vehicleId', targetVehicleId);
    if (forcedFormat !== 'auto') {
      formData.append('forcedFormat', forcedFormat);
    }

    if (showMapping) {
      formData.append(
        'mapping',
        JSON.stringify({
          type: recordType,
          dateColumn: dateCol,
          odometerColumn: odoCol,
          costColumn: costCol,
          litersColumn: litersCol || undefined,
          notesColumn: notesCol || undefined,
        })
      );
    }

    try {
      const data = await apiFetch<any>('/api/import/preview', {
        method: 'POST',
        body: formData,
      });
      setImportPreview(data);

      if (data.detectedFormat === 'generic' && data.headers?.length > 0 && !showMapping) {
        setShowMapping(true);
        setDateCol(data.headers[0] || '');
        setOdoCol(data.headers[1] || '');
        setCostCol(data.headers[2] || '');
      }
    } catch (err: any) {
      setImportError(err?.message || 'Fout bij inspecteren van CSV-bestand');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview || !targetVehicleId) return;

    setImportExecuting(true);
    setImportError(null);
    try {
      const res = await apiFetch<any>('/api/import/execute', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: targetVehicleId,
          records: importPreview.records,
        }),
      });

      setImportResultMessage(res.message);
      setImportPreview(null);
      setCsvFile(null);
    } catch (err: any) {
      setImportError(err?.message || 'Import mislukt');
    } finally {
      setImportExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-500" />
            <span>Gegevens Importeren (CSV / Fuelio / LubeLogger)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Importeer moeiteloos tankbeurten en onderhoudshistorie vanuit andere applicaties of handmatige CSV-bestanden.
          </p>
        </div>

        {importResultMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs flex items-center space-x-2.5 font-medium shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{importResultMessage}</span>
          </div>
        )}

        {importError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 p-4 rounded-xl text-xs flex items-center space-x-2.5 font-medium shadow-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{importError}</span>
          </div>
        )}

        {/* Target Vehicle & Format Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Doelvoertuig *
            </label>
            <select
              value={targetVehicleId}
              onChange={(e) => setImportVehicleId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            >
              {vehicles.length === 0 ? (
                <option value="">Geen voertuigen beschikbaar</option>
              ) : (
                vehicles.map((v: Vehicle) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.license_plate ? `(${v.license_plate})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bestandsformaat
            </label>
            <select
              value={forcedFormat}
              onChange={(e) => setForcedFormat(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            >
              <option value="auto">Automatisch detecteren (Aanbevolen)</option>
              <option value="fuelio">Fuelio CSV Export</option>
              <option value="lubelogger">LubeLogger CSV Export</option>
              <option value="generic">Aangepast / Generiek CSV</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              CSV Bestand Selecteren *
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-slate-200 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Generic Column Mapper Wizard */}
        {showMapping && importPreview && (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white">Kolomtoewijzing Wizard</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Type Data</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                >
                  <option value="fuel">Brandstof / Tankbeurt</option>
                  <option value="service">Onderhoud / Service</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">Datum *</label>
                <select
                  value={dateCol}
                  onChange={(e) => setDateCol(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                >
                  {importPreview.headers?.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">Kilometerstand *</label>
                <select
                  value={odoCol}
                  onChange={(e) => setOdoCol(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                >
                  {importPreview.headers?.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">Kosten / Bedrag *</label>
                <select
                  value={costCol}
                  onChange={(e) => setCostCol(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                >
                  {importPreview.headers?.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">Liters</label>
                <select
                  value={litersCol}
                  onChange={(e) => setLitersCol(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                >
                  <option value="">(Geen)</option>
                  {importPreview.headers?.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">Notities</label>
                <select
                  value={notesCol}
                  onChange={(e) => setNotesCol(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                >
                  <option value="">(Geen)</option>
                  {importPreview.headers?.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleImportPreview()}
              className="mt-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 shadow-sm"
            >
              Opnieuw berekenen met deze toewijzing
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => handleImportPreview()}
            disabled={importLoading || !csvFile || !targetVehicleId}
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl font-bold text-xs inline-flex items-center space-x-2 transition disabled:opacity-50 shadow-sm"
          >
            {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
            <span>Gegevens Controleren &amp; Voorvertonen</span>
          </button>
        </div>
      </div>

      {/* Validation Preview Table */}
      {importPreview && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden space-y-3 shadow-sm transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Gedetecteerd formaat: {importPreview.detectedFormat?.toUpperCase()}
              </span>
              <span className="text-slate-500 ml-3">
                {importPreview.validRows} geldige rijen • {importPreview.errorRows} ongeldig
              </span>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={importExecuting || importPreview.validRows === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition disabled:opacity-50 shadow-sm"
            >
              {importExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Import Uitvoeren ({importPreview.validRows} rijen)</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Datum</th>
                  <th className="py-2.5 px-3">Kilometerstand</th>
                  <th className="py-2.5 px-3">Liters / Omschrijving</th>
                  <th className="py-2.5 px-3">Kosten</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {importPreview.records?.slice(0, 50).map((r: any, idx: number) => (
                  <tr key={idx} className={r.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/20' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                    <td className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-500">
                      {r.type === 'fuel' ? 'Brandstof' : 'Onderhoud'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">{r.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-300">
                      {r.odometer.toLocaleString()} km
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {r.type === 'fuel' ? (r.liters ? `${r.liters} L` : '—') : r.serviceItem}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">€ {r.totalCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      {r.isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Geldig</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

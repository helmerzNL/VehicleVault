import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface VehicleTelematicsFieldsProps {
  vehicleId?: string;
  telematicsEnabled: boolean;
  setTelematicsEnabled: (v: boolean) => void;
  telematicsHaEntityId: string;
  setTelematicsHaEntityId: (v: string) => void;
  telematicsLastSyncAt?: string | null;
  telematicsLastStatus?: string | null;
  telematicsLastOdometer?: number | null;
  onOdometerUpdated?: (newOdo: number) => void;
}

export const VehicleTelematicsFields: React.FC<VehicleTelematicsFieldsProps> = ({
  vehicleId,
  telematicsEnabled,
  setTelematicsEnabled,
  telematicsHaEntityId,
  setTelematicsHaEntityId,
  telematicsLastSyncAt,
  telematicsLastStatus,
  telematicsLastOdometer,
  onOdometerUpdated,
}) => {
  const { lang } = useLanguage();
  const [sensors, setSensors] = useState<Array<{ entity_id: string; name: string; state: string; is_likely_odometer?: boolean }>>([]);
  const [loadingSensors, setLoadingSensors] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSensors = async () => {
    setLoadingSensors(true);
    try {
      const res = await apiFetch<{ sensors: any[] }>('/api/telematics/sensors');
      if (res.sensors && Array.isArray(res.sensors)) {
        setSensors(res.sensors);
      }
    } catch {
      // Ignore sensor load error if HA is not yet configured
    } finally {
      setLoadingSensors(false);
    }
  };

  useEffect(() => {
    if (telematicsEnabled && sensors.length === 0) {
      fetchSensors();
    }
  }, [telematicsEnabled]);

  const handleSyncNow = async () => {
    if (!vehicleId) return;
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await apiFetch<{ success: boolean; odometer?: number; updated?: boolean; error?: string }>(
        `/api/telematics/sync/${vehicleId}`,
        { method: 'POST' }
      );

      if (res.success && res.odometer !== undefined) {
        setSyncResult({
          success: true,
          message:
            lang === 'nl'
              ? `Succesvol gesynchroniseerd! Actuele tellerstand: ${res.odometer.toLocaleString()} km`
              : `Successfully synced! Current odometer: ${res.odometer.toLocaleString()} km`,
        });
        if (onOdometerUpdated) onOdometerUpdated(res.odometer);
      } else {
        setSyncResult({
          success: false,
          message: res.error || (lang === 'nl' ? 'Synchronisatie mislukt' : 'Sync failed'),
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || (lang === 'nl' ? 'Synchronisatie mislukt' : 'Sync failed'),
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5 cursor-pointer select-none">
          <Radio className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'nl' ? 'Auto Telematica (Home Assistant Sync)' : 'Vehicle Telematics (Home Assistant)'}</span>
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={telematicsEnabled}
            onChange={(e) => setTelematicsEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {lang === 'nl'
          ? 'Haal dagelijks automatisch de actuele tellerstand op via Home Assistant (bijv. Kia Connect, Hyundai Bluelink, Mercedes me, Stellantis, VW).'
          : 'Automatically pull daily odometer readings from Home Assistant sensors (e.g. Kia Connect, Bluelink, Mercedes me, Stellantis, VW).'}
      </p>

      {telematicsEnabled && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                {lang === 'nl' ? 'Home Assistant Sensor Entiteit' : 'Home Assistant Sensor Entity'}
              </label>
              <button
                type="button"
                onClick={fetchSensors}
                disabled={loadingSensors}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                {loadingSensors ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>{lang === 'nl' ? 'Sensoren vernieuwen' : 'Refresh sensors'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                list="ha-odometer-sensors"
                value={telematicsHaEntityId}
                onChange={(e) => setTelematicsHaEntityId(e.target.value)}
                placeholder="sensor.kia_niro_odometer of sensor.mercedes_odometer"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <datalist id="ha-odometer-sensors">
                {sensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {s.name} ({s.state} {s.is_likely_odometer ? '★' : ''})
                  </option>
                ))}
              </datalist>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'nl'
                ? 'Typ de sensornaam of selecteer er een uit de suggestielijst.'
                : 'Type the sensor entity ID or select from the dropdown.'}
            </p>
          </div>

          {vehicleId && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {telematicsLastSyncAt ? (
                  <span>
                    {lang === 'nl' ? 'Laatste sync: ' : 'Last sync: '}
                    <strong>{new Date(telematicsLastSyncAt).toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-US')}</strong>
                    {telematicsLastOdometer ? ` (${telematicsLastOdometer.toLocaleString()} km)` : ''}
                    {telematicsLastStatus && telematicsLastStatus !== 'ok' ? ` [${telematicsLastStatus}]` : ''}
                  </span>
                ) : (
                  <span>{lang === 'nl' ? 'Nog niet gesynchroniseerd' : 'Not yet synced'}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing || !telematicsHaEntityId.trim()}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto disabled:opacity-50 shadow-2xs"
              >
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>{syncing ? (lang === 'nl' ? 'Ophalen...' : 'Syncing...') : (lang === 'nl' ? 'Nu Syncen' : 'Sync Now')}</span>
              </button>
            </div>
          )}

          {syncResult && (
            <div
              className={`p-2 rounded-lg text-[11px] flex items-center space-x-1.5 font-medium ${
                syncResult.success
                  ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {syncResult.success ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span>{syncResult.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


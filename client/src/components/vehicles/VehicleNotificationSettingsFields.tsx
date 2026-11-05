import React from 'react';
import { Bell, BellOff, Wrench, ShieldAlert, CircleGauge, RefreshCw } from 'lucide-react';
import { VehicleType } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface VehicleNotificationSettingsFieldsProps {
  type: VehicleType;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  maintenanceNotificationsEnabled: boolean;
  setMaintenanceNotificationsEnabled: (v: boolean) => void;
  apkNotificationsEnabled: boolean;
  setApkNotificationsEnabled: (v: boolean) => void;
  tireSwapNotificationsEnabled?: boolean;
  setTireSwapNotificationsEnabled?: (v: boolean) => void;
  tireTreadNotificationsEnabled?: boolean;
  setTireTreadNotificationsEnabled?: (v: boolean) => void;
}

export const VehicleNotificationSettingsFields: React.FC<VehicleNotificationSettingsFieldsProps> = ({
  type,
  notificationsEnabled,
  setNotificationsEnabled,
  maintenanceNotificationsEnabled,
  setMaintenanceNotificationsEnabled,
  apkNotificationsEnabled,
  setApkNotificationsEnabled,
  tireSwapNotificationsEnabled = true,
  setTireSwapNotificationsEnabled,
  tireTreadNotificationsEnabled = true,
  setTireTreadNotificationsEnabled,
}) => {
  const { lang } = useLanguage();

  const isMotorcycleOrTrailer = type === 'motorcycle' || type === 'trailer';

  return (
    <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {notificationsEnabled ? (
            <Bell className="w-4 h-4 text-sky-500" />
          ) : (
            <BellOff className="w-4 h-4 text-slate-400" />
          )}
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {lang === 'nl' ? 'Notificaties & Herinneringen' : 'Notifications & Alerts'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {lang === 'nl'
                ? 'Stel in welke automatische meldingen je wilt ontvangen voor dit specifieke voertuig.'
                : 'Configure automated push and email alerts for this specific vehicle.'}
            </span>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
        </label>
      </div>

      {notificationsEnabled && (
        <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          {/* Maintenance Alerts Toggle */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <div className="flex items-center space-x-2">
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {lang === 'nl' ? 'Onderhoudsmeldingen' : 'Maintenance Overdue Alerts'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {lang === 'nl'
                    ? 'Waarschuw bij overschreden onderhoudsintervallen (km of tijd)'
                    : 'Alert when maintenance intervals are overdue'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={maintenanceNotificationsEnabled}
              onChange={(e) => setMaintenanceNotificationsEnabled(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
          </label>

          {/* APK Alerts Toggle */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {lang === 'nl' ? 'APK / Keuringsherinneringen' : 'Inspection / APK Alerts'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isMotorcycleOrTrailer
                    ? (lang === 'nl' ? 'Niet van toepassing (motoren/aanhangers hebben geen APK-plicht)' : 'Not applicable for motorcycles or trailers')
                    : (lang === 'nl' ? 'Ontvang 30 en 7 dagen voor vervaldatum een melding' : 'Receive alerts 30 and 7 days before expiration')}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={isMotorcycleOrTrailer}
              checked={isMotorcycleOrTrailer ? false : apkNotificationsEnabled}
              onChange={(e) => setApkNotificationsEnabled(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-40"
            />
          </label>
          {/* Bandenwissel (Seizoenswissel) Toggle */}
          {setTireSwapNotificationsEnabled && (
            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {lang === 'nl' ? 'Bandenwissel Herinneringen' : 'Tire Seasonal Swap Alerts'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {lang === 'nl'
                      ? 'Melding in de herfst (winterbanden) en het voorjaar (zomerbanden)'
                      : 'Seasonal reminder to swap between summer and winter tire sets'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={tireSwapNotificationsEnabled}
                onChange={(e) => setTireSwapNotificationsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
            </label>
          )}

          {/* Bandenprofiel (Slijtage) Toggle */}
          {setTireTreadNotificationsEnabled && (
            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <div className="flex items-center space-x-2">
                <CircleGauge className="w-3.5 h-3.5 text-rose-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {lang === 'nl' ? 'Bandenprofiel Waarschuwingen' : 'Tire Tread Depth Alerts'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {lang === 'nl'
                      ? 'Waarschuw bij adviesgrens (≤ 3,0 mm) en wettelijke limiet (≤ 1,6 mm)'
                      : 'Alert when tire tread reaches warning (≤ 3.0 mm) or legal minimum (≤ 1.6 mm)'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={tireTreadNotificationsEnabled}
                onChange={(e) => setTireTreadNotificationsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
};


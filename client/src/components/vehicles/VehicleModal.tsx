import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Vehicle, VehicleType } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { VehicleBasicSpecsFields } from './VehicleBasicSpecsFields.js';
import { VehiclePurchaseAndApkFields } from './VehiclePurchaseAndApkFields.js';
import { VehicleNotificationSettingsFields } from './VehicleNotificationSettingsFields.js';
import { VehicleTelematicsFields } from './VehicleTelematicsFields.js';

interface VehicleModalProps {
  isOpen: boolean;
  editingVehicle: Vehicle | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  error: string | null;
  name: string;
  setName: (v: string) => void;
  type: VehicleType;
  setType: (v: VehicleType) => void;
  licensePlate: string;
  setLicensePlate: (v: string) => void;
  plateCountry: 'NL' | 'BE' | 'DE' | 'EU' | 'OTHER';
  setPlateCountry: (v: 'NL' | 'BE' | 'DE' | 'EU' | 'OTHER') => void;
  vin: string;
  setVin: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  make: string;
  setMake: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  fuelType: string;
  setFuelType: (v: string) => void;
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  purchasePrice: string;
  setPurchasePrice: (v: string) => void;
  initialOdometer: string;
  setInitialOdometer: (v: string) => void;
  apkDate: string;
  setApkDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
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
  telematicsEnabled?: boolean;
  setTelematicsEnabled?: (v: boolean) => void;
  telematicsHaEntityId?: string;
  setTelematicsHaEntityId?: (v: string) => void;
  telematicsLastSyncAt?: string | null;
  telematicsLastStatus?: string | null;
  telematicsLastOdometer?: number | null;
  imagePreview: string | null;
  setImagePreview: (v: string | null) => void;
  setImageFile: (f: File | null) => void;
  rdwLoading: boolean;
  rdwSuccess: boolean;
  onRdwLookup: () => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  editingVehicle,
  onClose,
  onSave,
  error,
  name,
  setName,
  type,
  setType,
  licensePlate,
  setLicensePlate,
  plateCountry,
  setPlateCountry,
  vin,
  setVin,
  year,
  setYear,
  make,
  setMake,
  model,
  setModel,
  fuelType,
  setFuelType,
  purchaseDate,
  setPurchaseDate,
  purchasePrice,
  setPurchasePrice,
  initialOdometer,
  setInitialOdometer,
  apkDate,
  setApkDate,
  notes,
  setNotes,
  notificationsEnabled,
  setNotificationsEnabled,
  maintenanceNotificationsEnabled,
  setMaintenanceNotificationsEnabled,
  apkNotificationsEnabled,
  setApkNotificationsEnabled,
  tireSwapNotificationsEnabled,
  setTireSwapNotificationsEnabled,
  tireTreadNotificationsEnabled,
  setTireTreadNotificationsEnabled,
  telematicsEnabled,
  setTelematicsEnabled,
  telematicsHaEntityId,
  setTelematicsHaEntityId,
  telematicsLastSyncAt,
  telematicsLastStatus,
  telematicsLastOdometer,
  imagePreview,
  setImagePreview,
  setImageFile,
  rdwLoading,
  rdwSuccess,
  onRdwLookup,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold">
            {editingVehicle ? t('editVehicle') : t('addVehicle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <VehicleBasicSpecsFields
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            setImageFile={setImageFile}
            plateCountry={plateCountry}
            setPlateCountry={setPlateCountry}
            licensePlate={licensePlate}
            setLicensePlate={setLicensePlate}
            onRdwLookup={onRdwLookup}
            rdwLoading={rdwLoading}
            rdwSuccess={rdwSuccess}
            name={name}
            setName={setName}
            type={type}
            setType={setType}
            make={make}
            setMake={setMake}
            model={model}
            setModel={setModel}
            year={year}
            setYear={setYear}
            fuelType={fuelType}
            setFuelType={setFuelType}
            vin={vin}
            setVin={setVin}
          />

          <VehiclePurchaseAndApkFields
            plateCountry={plateCountry}
            purchaseDate={purchaseDate}
            setPurchaseDate={setPurchaseDate}
            initialOdometer={initialOdometer}
            setInitialOdometer={setInitialOdometer}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            apkDate={apkDate}
            setApkDate={setApkDate}
            notes={notes}
            setNotes={setNotes}
          />

          <VehicleNotificationSettingsFields
            type={type}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            maintenanceNotificationsEnabled={maintenanceNotificationsEnabled}
            setMaintenanceNotificationsEnabled={setMaintenanceNotificationsEnabled}
            apkNotificationsEnabled={apkNotificationsEnabled}
            setApkNotificationsEnabled={setApkNotificationsEnabled}
            tireSwapNotificationsEnabled={tireSwapNotificationsEnabled}
            setTireSwapNotificationsEnabled={setTireSwapNotificationsEnabled}
            tireTreadNotificationsEnabled={tireTreadNotificationsEnabled}
            setTireTreadNotificationsEnabled={setTireTreadNotificationsEnabled}
          />

          {setTelematicsEnabled && setTelematicsHaEntityId && (
            <VehicleTelematicsFields
              vehicleId={editingVehicle?.id}
              telematicsEnabled={Boolean(telematicsEnabled)}
              setTelematicsEnabled={setTelematicsEnabled}
              telematicsHaEntityId={telematicsHaEntityId || ''}
              setTelematicsHaEntityId={setTelematicsHaEntityId}
              telematicsLastSyncAt={telematicsLastSyncAt}
              telematicsLastStatus={telematicsLastStatus}
              telematicsLastOdometer={telematicsLastOdometer}
            />
          )}

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
              className="px-5 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl font-bold transition shadow-sm"
            >
              {editingVehicle ? t('save') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

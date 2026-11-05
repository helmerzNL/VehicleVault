import { useState } from 'react';
import { Vehicle, VehicleType } from '../../types/index.js';
import { apiFetch } from '../../api/client.js';
import { compressImage } from '../../utils/imageCompressor.js';
import { useLanguage } from '../../context/LanguageContext.js';

export function useVehicleForm(refreshVehicles: () => void) {
  const { t, lang } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<VehicleType>('car');
  const [licensePlate, setLicensePlate] = useState('');
  const [plateCountry, setPlateCountry] = useState<'NL' | 'BE' | 'DE' | 'EU' | 'OTHER'>('NL');
  const [vin, setVin] = useState('');
  const [year, setYear] = useState<string>('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('Benzine');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [initialOdometer, setInitialOdometer] = useState<string>('0');
  const [apkDate, setApkDate] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [maintenanceNotificationsEnabled, setMaintenanceNotificationsEnabled] = useState(true);
  const [apkNotificationsEnabled, setApkNotificationsEnabled] = useState(true);
  const [tireSwapNotificationsEnabled, setTireSwapNotificationsEnabled] = useState(true);
  const [tireTreadNotificationsEnabled, setTireTreadNotificationsEnabled] = useState(true);
  const [telematicsEnabled, setTelematicsEnabled] = useState(false);
  const [telematicsProvider, setTelematicsProvider] = useState('home_assistant');
  const [telematicsHaEntityId, setTelematicsHaEntityId] = useState('');
  const [telematicsLastSyncAt, setTelematicsLastSyncAt] = useState<string | null>(null);
  const [telematicsLastStatus, setTelematicsLastStatus] = useState<string | null>(null);
  const [telematicsLastOdometer, setTelematicsLastOdometer] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwSuccess, setRdwSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setType('car');
    setLicensePlate('');
    setPlateCountry('NL');
    setVin('');
    setYear('');
    setMake('');
    setModel('');
    setFuelType(lang === 'nl' ? 'Benzine' : 'Petrol');
    setPurchaseDate('');
    setPurchasePrice('0');
    setInitialOdometer('0');
    setApkDate('');
    setNotes('');
    setNotificationsEnabled(true);
    setMaintenanceNotificationsEnabled(true);
    setApkNotificationsEnabled(true);
    setTireSwapNotificationsEnabled(true);
    setTireTreadNotificationsEnabled(true);
    setTelematicsEnabled(false);
    setTelematicsProvider('home_assistant');
    setTelematicsHaEntityId('');
    setTelematicsLastSyncAt(null);
    setTelematicsLastStatus(null);
    setTelematicsLastOdometer(null);
    setImageFile(null);
    setImagePreview(null);
    setEditingVehicle(null);
    setError(null);
    setRdwSuccess(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setType(v.type);
    setLicensePlate(v.license_plate || '');
    setPlateCountry(((v.plate_country as any) || 'NL'));
    setVin(v.vin || '');
    setYear(v.year ? String(v.year) : '');
    setMake(v.make || '');
    setModel(v.model || '');
    setFuelType(v.fuel_type || 'Benzine');
    setPurchaseDate(v.purchase_date ? v.purchase_date.slice(0, 10) : '');
    setPurchasePrice(String(v.purchase_price || 0));
    setInitialOdometer(String(v.initial_odometer || 0));
    setApkDate(v.apk_expiration_date || '');
    setNotes(v.notes || '');
    setNotificationsEnabled(v.notifications_enabled !== false);
    setMaintenanceNotificationsEnabled(v.maintenance_notifications_enabled !== false);
    setApkNotificationsEnabled(v.apk_notifications_enabled !== false);
    setTireSwapNotificationsEnabled(v.tire_swap_notifications_enabled !== false);
    setTireTreadNotificationsEnabled(v.tire_tread_notifications_enabled !== false);
    setTelematicsEnabled(Boolean(v.telematics_enabled));
    setTelematicsProvider(v.telematics_provider || 'home_assistant');
    setTelematicsHaEntityId(v.telematics_ha_entity_id || '');
    setTelematicsLastSyncAt(v.telematics_last_sync_at || null);
    setTelematicsLastStatus(v.telematics_last_status || null);
    setTelematicsLastOdometer(v.telematics_last_odometer ?? null);
    setImageFile(null);
    setImagePreview(v.image_path ? `/uploads/vehicles/${v.image_path}` : null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleRdwLookup = async () => {
    if (!licensePlate) return;
    setRdwLoading(true);
    setError(null);
    setRdwSuccess(false);

    try {
      const data = await apiFetch<{ rdw: any }>(`/api/vehicles/rdw/${licensePlate}`);
      if (data && data.rdw) {
        if (data.rdw.merk) setMake(data.rdw.merk);
        if (data.rdw.handelsbenaming) setModel(data.rdw.handelsbenaming);
        if (data.rdw.vervaldatum_apk) setApkDate(data.rdw.vervaldatum_apk);
        if (data.rdw.datum_eerste_toelating) {
          setYear(data.rdw.datum_eerste_toelating.substring(0, 4));
        }
        if (data.rdw.datum_tenaamstelling && !purchaseDate) {
          setPurchaseDate(data.rdw.datum_tenaamstelling);
        }
        if (data.rdw.brandstof_omschrijving) {
          setFuelType(data.rdw.brandstof_omschrijving);
        }
        if (!name) {
          setName(`${data.rdw.merk} ${data.rdw.handelsbenaming}`);
        }
        setRdwSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || t('rdwNotFound'));
    } finally {
      setRdwLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      type,
      license_plate: licensePlate || null,
      plate_country: plateCountry,
      vin: vin || null,
      year: year ? parseInt(year, 10) : null,
      make: make || null,
      model: model || null,
      fuel_type: fuelType || null,
      purchase_date: purchaseDate || null,
      purchase_price: parseFloat(purchasePrice) || 0,
      initial_odometer: parseFloat(initialOdometer) || 0,
      apk_expiration_date: apkDate || null,
      notes: notes || null,
      notifications_enabled: notificationsEnabled,
      maintenance_notifications_enabled: maintenanceNotificationsEnabled,
      apk_notifications_enabled: apkNotificationsEnabled,
      tire_swap_notifications_enabled: tireSwapNotificationsEnabled,
      tire_tread_notifications_enabled: tireTreadNotificationsEnabled,
      telematics_enabled: telematicsEnabled,
      telematics_provider: telematicsProvider,
      telematics_ha_entity_id: telematicsHaEntityId || null,
    };

    try {
      let vehicleId = editingVehicle?.id;
      if (editingVehicle) {
        await apiFetch(`/api/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const res = await apiFetch<{ id: string }>('/api/vehicles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        vehicleId = res.id;
      }

      if (imageFile && vehicleId) {
        const compressedImage = await compressImage(imageFile, 1200, 1200, 0.85);
        const formData = new FormData();
        formData.append('image', compressedImage);
        await apiFetch(`/api/vehicles/${vehicleId}/image`, {
          method: 'POST',
          body: formData,
        });
      }

      setIsModalOpen(false);
      resetForm();
      refreshVehicles();
    } catch (err: any) {
      setError(err?.message || 'Error saving vehicle');
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editingVehicle,
    openCreateModal,
    openEditModal,
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
    telematicsProvider,
    setTelematicsProvider,
    telematicsHaEntityId,
    setTelematicsHaEntityId,
    telematicsLastSyncAt,
    telematicsLastStatus,
    telematicsLastOdometer,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    rdwLoading,
    rdwSuccess,
    error,
    handleRdwLookup,
    handleSave,
  };
}


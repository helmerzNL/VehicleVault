import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Car, ShieldCheck } from 'lucide-react';
import { Vehicle } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import { ShowcaseManagerModal } from '../components/ShowcaseManagerModal.js';
import { VehicleCard } from '../components/vehicles/VehicleCard.js';
import { VehicleModal } from '../components/vehicles/VehicleModal.js';
import { VehicleShareModal } from '../components/vehicles/VehicleShareModal.js';
import { useVehicleForm } from '../components/vehicles/useVehicleForm.js';
import { useVehicleShare } from '../components/vehicles/useVehicleShare.js';

interface ContextType {
  vehicles: Vehicle[];
  refreshVehicles: () => void;
}

export const Vehicles: React.FC = () => {
  const { vehicles, refreshVehicles } = useOutletContext<ContextType>();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [fleetView, setFleetView] = useState(false);
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>([]);
  const [showcaseVehicle, setShowcaseVehicle] = useState<Vehicle | null>(null);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);

  const form = useVehicleForm(refreshVehicles);
  const share = useVehicleShare();

  const fetchFleet = async () => {
    try {
      const res = await apiFetch<{ vehicles: Vehicle[] }>('/api/vehicles?all=true');
      setFleetVehicles(res.vehicles || []);
    } catch {}
  };

  const handleToggleFleet = (enabled: boolean) => {
    setFleetView(enabled);
    if (enabled) {
      fetchFleet();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteVehicle'))) {
      try {
        await apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        refreshVehicles();
        if (fleetView) fetchFleet();
      } catch (err: any) {
        alert(err?.message || 'Delete failed');
      }
    }
  };

  const handleToggleArchive = async (v: Vehicle) => {
    const newStatus = v.status === 'active' ? 'archived' : 'active';
    try {
      await apiFetch(`/api/vehicles/${v.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      refreshVehicles();
      if (fleetView) fetchFleet();
    } catch {}
  };

  const currentList = fleetView ? fleetVehicles : vehicles;
  const filteredVehicles = currentList.filter((v) => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Car className="w-5 h-5 text-sky-500" />
            <span>{fleetView ? 'Wagenpark (Super-Admin: Alle Voertuigen)' : (lang === 'nl' ? 'Mijn Voertuigen' : 'My Vehicles')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {fleetView
              ? 'Volledig overzicht van alle geregistreerde voertuigen van alle gebruikers op deze instantie'
              : (lang === 'nl' ? 'Beheer al je geregistreerde auto\'s, motoren en aanhangers' : 'Manage your registered vehicles')}
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleToggleFleet(!fleetView)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 border transition ${
                fleetView
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{fleetView ? 'Alle Voertuigen Actief' : 'Toon Alle Voertuigen (Admin)'}</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'active'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('active')} ({currentList.filter((v) => v.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'archived'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('archived')} ({currentList.filter((v) => v.status === 'archived').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('all')} ({currentList.length})
            </button>
          </div>

          <button
            onClick={form.openCreateModal}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addVehicle')}</span>
          </button>
        </div>
      </div>

      {currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {lang === 'nl' ? 'Nog geen voertuigen toegevoegd' : 'No vehicles added yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {lang === 'nl'
              ? 'Voeg je eerste auto, motor of aanhanger toe om onderhoud, ritten en brandstof bij te houden.'
              : 'Add your first car, motorcycle or trailer to track maintenance, trips and fuel.'}
          </p>
          <button
            onClick={form.openCreateModal}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addVehicle')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={form.openEditModal}
              onDelete={handleDelete}
              onToggleArchive={handleToggleArchive}
              onOpenShare={share.openShareModal}
              onOpenShowcase={(veh: Vehicle) => {
                setShowcaseVehicle(veh);
                setIsShowcaseModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Vehicle Create / Edit Modal */}
      <VehicleModal
        isOpen={form.isModalOpen}
        editingVehicle={form.editingVehicle}
        onClose={() => form.setIsModalOpen(false)}
        onSave={form.handleSave}
        error={form.error}
        name={form.name}
        setName={form.setName}
        type={form.type}
        setType={form.setType}
        licensePlate={form.licensePlate}
        setLicensePlate={form.setLicensePlate}
        plateCountry={form.plateCountry}
        setPlateCountry={form.setPlateCountry}
        vin={form.vin}
        setVin={form.setVin}
        year={form.year}
        setYear={form.setYear}
        make={form.make}
        setMake={form.setMake}
        model={form.model}
        setModel={form.setModel}
        fuelType={form.fuelType}
        setFuelType={form.setFuelType}
        purchaseDate={form.purchaseDate}
        setPurchaseDate={form.setPurchaseDate}
        purchasePrice={form.purchasePrice}
        setPurchasePrice={form.setPurchasePrice}
        initialOdometer={form.initialOdometer}
        setInitialOdometer={form.setInitialOdometer}
        apkDate={form.apkDate}
        setApkDate={form.setApkDate}
        notes={form.notes}
        setNotes={form.setNotes}
        notificationsEnabled={form.notificationsEnabled}
        setNotificationsEnabled={form.setNotificationsEnabled}
        maintenanceNotificationsEnabled={form.maintenanceNotificationsEnabled}
        setMaintenanceNotificationsEnabled={form.setMaintenanceNotificationsEnabled}
        apkNotificationsEnabled={form.apkNotificationsEnabled}
        setApkNotificationsEnabled={form.setApkNotificationsEnabled}
        tireSwapNotificationsEnabled={form.tireSwapNotificationsEnabled}
        setTireSwapNotificationsEnabled={form.setTireSwapNotificationsEnabled}
        tireTreadNotificationsEnabled={form.tireTreadNotificationsEnabled}
        setTireTreadNotificationsEnabled={form.setTireTreadNotificationsEnabled}
        telematicsEnabled={form.telematicsEnabled}
        setTelematicsEnabled={form.setTelematicsEnabled}
        telematicsHaEntityId={form.telematicsHaEntityId}
        setTelematicsHaEntityId={form.setTelematicsHaEntityId}
        telematicsLastSyncAt={form.telematicsLastSyncAt}
        telematicsLastStatus={form.telematicsLastStatus}
        telematicsLastOdometer={form.telematicsLastOdometer}
        imagePreview={form.imagePreview}
        setImagePreview={form.setImagePreview}
        setImageFile={form.setImageFile}
        rdwLoading={form.rdwLoading}
        rdwSuccess={form.rdwSuccess}
        onRdwLookup={form.handleRdwLookup}
      />

      {/* Vehicle Sharing Modal */}
      {share.sharingVehicle && (
        <VehicleShareModal
          vehicle={share.sharingVehicle}
          isOpen={share.isShareModalOpen}
          onClose={() => share.setIsShareModalOpen(false)}
          shares={share.shares}
          shareableUsers={share.shareableUsers}
          selectedShareEmail={share.selectedShareEmail}
          setSelectedShareEmail={share.setSelectedShareEmail}
          selectedShareRole={share.selectedShareRole}
          setSelectedShareRole={share.setSelectedShareRole}
          shareLoading={share.shareLoading}
          shareError={share.shareError}
          shareSuccess={share.shareSuccess}
          lastInviteLink={share.lastInviteLink}
          onAddShare={share.handleAddShare}
          onRemoveShare={share.handleRemoveShare}
        />
      )}

      {/* Showcase Manager Modal */}
      {isShowcaseModalOpen && showcaseVehicle && (
        <ShowcaseManagerModal
          vehicleId={showcaseVehicle.id}
          vehicleName={showcaseVehicle.name}
          isOpen={isShowcaseModalOpen}
          onClose={() => {
            setIsShowcaseModalOpen(false);
            setShowcaseVehicle(null);
          }}
          onVehicleUpdated={refreshVehicles}
        />
      )}
    </div>
  );
};

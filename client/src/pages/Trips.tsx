import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Route as RouteIcon, Plus, Upload } from 'lucide-react';
import { Vehicle, Trip, TripSummary } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { TripImportModal } from '../components/TripImportModal.js';
import { formatLicensePlate } from '../utils/licensePlate.js';
import { TripSummaryCards } from '../components/trips/TripSummaryCards.js';
import { TripTable } from '../components/trips/TripTable.js';
import { TripModal } from '../components/trips/TripModal.js';
import { TripExportDropdown } from '../components/trips/TripExportDropdown.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

export const Trips: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { t } = useLanguage();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedPurpose, setSelectedPurpose] = useState<'all' | 'business' | 'commute' | 'private'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchTrips = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      setError(null);
      let url = `/api/trips?vehicleId=${selectedVehicle.id}`;
      if (selectedYear && selectedYear !== 'all') {
        url += `&year=${selectedYear}`;
      }
      if (selectedPurpose && selectedPurpose !== 'all') {
        url += `&purpose=${selectedPurpose}`;
      }
      const data = await apiFetch<{ trips: Trip[]; summary: TripSummary }>(url);
      setTrips(data.trips || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err?.message || 'Kon ritten niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [selectedVehicle?.id, selectedYear, selectedPurpose]);

  const defaultStartOdo = trips.length > 0
    ? trips[0].end_odometer.toString()
    : (selectedVehicle?.current_odometer || selectedVehicle?.initial_odometer || 0).toString();

  const openCreateModal = () => {
    setEditingTrip(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Trip) => {
    setEditingTrip(t);
    setIsModalOpen(true);
  };

  const handleSaveTrip = async (payload: any) => {
    if (!selectedVehicle) return;

    if (editingTrip) {
      await apiFetch(`/api/trips/${editingTrip.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          date: payload.date,
          startOdometer: payload.start_odometer,
          endOdometer: payload.end_odometer,
          distanceKm: payload.distance_km,
          fromLocation: payload.from_location,
          toLocation: payload.to_location,
          purpose: payload.purpose,
          description: payload.description,
        }),
      });
    } else {
      await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          date: payload.date,
          startOdometer: payload.start_odometer,
          endOdometer: payload.end_odometer,
          distanceKm: payload.distance_km,
          fromLocation: payload.from_location,
          toLocation: payload.to_location,
          purpose: payload.purpose,
          description: payload.description,
          isReturnTrip: false,
        }),
      });

      if (payload.create_return_trip) {
        const returnDist = payload.distance_km;
        const returnEnd = payload.end_odometer + returnDist;
        await apiFetch('/api/trips', {
          method: 'POST',
          body: JSON.stringify({
            vehicleId: selectedVehicle.id,
            date: payload.date,
            startOdometer: payload.end_odometer,
            endOdometer: returnEnd,
            distanceKm: returnDist,
            fromLocation: payload.to_location,
            toLocation: payload.from_location,
            purpose: payload.purpose,
            description: payload.description ? `${payload.description} (Retour)` : 'Retourrit',
            isReturnTrip: true,
          }),
        });
      }
    }
    fetchTrips();
  };

  const handleQuickReturn = async (t: Trip) => {
    if (!selectedVehicle) return;
    try {
      const returnDist = Number(t.distance_km);
      const returnStart = Number(t.end_odometer);
      const returnEnd = returnStart + returnDist;

      await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          date: t.date,
          startOdometer: returnStart,
          endOdometer: returnEnd,
          distanceKm: returnDist,
          fromLocation: t.to_location,
          toLocation: t.from_location,
          purpose: t.purpose,
          description: t.description ? `${t.description} (Retour)` : 'Retourrit',
          isReturnTrip: true,
        }),
      });
      fetchTrips();
    } catch (err: any) {
      alert(err?.message || 'Kon retourrit niet toevoegen');
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('Weet je zeker dat je deze rit wilt verwijderen?')) return;
    try {
      await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
      fetchTrips();
    } catch (err: any) {
      alert(err?.message || 'Kon rit niet verwijderen');
    }
  };

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto my-12">
        <RouteIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Geen voertuig geselecteerd</h2>
        <p className="text-xs text-slate-500 mt-1">Selecteer een voertuig in de balk bovenin om ritten te bekijken of te registreren.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <RouteIcon className="w-5 h-5 text-indigo-500" />
            <span>Ritregistratie</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fiscaal sluitende kilometeradministratie voor de Belastingdienst ({selectedVehicle.name} • {formatLicensePlate(selectedVehicle.license_plate)}).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('importTrips')}</span>
          </button>

          <TripExportDropdown
            selectedVehicle={selectedVehicle}
            selectedYear={selectedYear}
          />

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Rit Toevoegen</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <TripSummaryCards summary={summary} />

      {/* Trips Table & Filters */}
      <TripTable
        trips={trips}
        loading={loading}
        error={error}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedPurpose={selectedPurpose}
        setSelectedPurpose={setSelectedPurpose}
        currentYear={currentYear}
        onOpenCreate={openCreateModal}
        onOpenEdit={openEditModal}
        onQuickReturn={handleQuickReturn}
        onDeleteTrip={handleDeleteTrip}
      />

      {/* Modal */}
      <TripModal
        isOpen={isModalOpen}
        editingTrip={editingTrip}
        defaultStartOdometer={defaultStartOdo}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTrip}
      />

      {isImportOpen && (
        <TripImportModal vehicle={selectedVehicle} onClose={() => setIsImportOpen(false)} onImported={fetchTrips} />
      )}
    </div>
  );
};

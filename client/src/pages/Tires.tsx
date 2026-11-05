import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Disc, Plus, Warehouse, AlertCircle } from 'lucide-react';
import { Vehicle, TireSet } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { formatLicensePlate } from '../utils/licensePlate.js';
import { MountedTireCard } from '../components/tires/MountedTireCard.js';
import { TireSetCard } from '../components/tires/TireSetCard.js';
import { TireSetModal } from '../components/tires/TireSetModal.js';
import { TireSwapModal } from '../components/tires/TireSwapModal.js';
import { TireTreadModal } from '../components/tires/TireTreadModal.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

export const Tires: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();

  const [tireSets, setTireSets] = useState<TireSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TireSet | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapTargetSet, setSwapTargetSet] = useState<TireSet | null>(null);
  const [isTreadModalOpen, setIsTreadModalOpen] = useState(false);
  const [treadTargetSet, setTreadTargetSet] = useState<TireSet | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<{ id: string; name: string; file_path: string }[]>([]);

  const fetchTireSets = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ tireSets: TireSet[] }>(`/api/tires?vehicleId=${selectedVehicle.id}`);
      setTireSets(res.tireSets || []);
    } catch (err: any) {
      setError(err?.message || 'Kon bandensets niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDocuments = async () => {
    if (!selectedVehicle) return;
    try {
      const res = await apiFetch<{ documents: any[] }>(`/api/documents/${selectedVehicle.id}?category=invoice`);
      setAvailableDocuments(res.documents || []);
    } catch {
      setAvailableDocuments([]);
    }
  };

  useEffect(() => {
    fetchTireSets();
    fetchAvailableDocuments();
  }, [selectedVehicle?.id]);

  const activeMountedSet = tireSets.find((s) => s.status === 'mounted');
  const curOdo = (selectedVehicle?.current_odometer || selectedVehicle?.initial_odometer)?.toString() || '';

  const openCreateModal = () => {
    setEditingSet(null);
    fetchAvailableDocuments();
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (set: TireSet) => {
    setEditingSet(set);
    fetchAvailableDocuments();
    setIsAddEditModalOpen(true);
  };

  const openSwapModal = (target: TireSet) => {
    setSwapTargetSet(target);
    setIsSwapModalOpen(true);
  };

  const openTreadModal = (target: TireSet) => {
    setTreadTargetSet(target);
    setIsTreadModalOpen(true);
  };

  const handleSaveTireSet = async (payload: any) => {
    if (!selectedVehicle) return;

    if (editingSet) {
      await apiFetch(`/api/tires/${editingSet.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch('/api/tires', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          ...payload,
        }),
      });
    }
    fetchTireSets();
  };

  const handleConfirmSwap = async (odometer: number, date: string) => {
    if (!swapTargetSet) return;
    await apiFetch(`/api/tires/${swapTargetSet.id}/swap`, {
      method: 'POST',
      body: JSON.stringify({
        currentOdometer: odometer,
        date,
      }),
    });
    fetchTireSets();
  };

  const handleSaveTread = async (treads: {
    fl: number | null;
    fr: number | null;
    rl: number | null;
    rr: number | null;
    date: string;
  }) => {
    if (!treadTargetSet) return;
    await apiFetch(`/api/tires/${treadTargetSet.id}/tread`, {
      method: 'PATCH',
      body: JSON.stringify(treads),
    });
    fetchTireSets();
  };

  const handleDeleteTireSet = async (id: string) => {
    if (!window.confirm('Weet je zeker dat je deze bandenset wilt verwijderen?')) return;
    try {
      await apiFetch(`/api/tires/${id}`, { method: 'DELETE' });
      fetchTireSets();
    } catch (err: any) {
      alert(err?.message || 'Kon bandenset niet verwijderen');
    }
  };

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto my-12">
        <Disc className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Geen voertuig geselecteerd</h2>
        <p className="text-xs text-slate-500 mt-1">Selecteer een voertuig in de balk bovenin om bandensets te beheren.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Disc className="w-5 h-5 text-amber-500" />
            <span>Bandenbeheer</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Beheer zomer-, winter- en 4-seizoenssets, profieldieptes per wiel en seizoenswissels ({selectedVehicle.name} • {formatLicensePlate(selectedVehicle.license_plate)}).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-xs transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Bandenset Toevoegen</span>
        </button>
      </div>

      {/* Active Mounted Tire Set Hero Card */}
      {activeMountedSet ? (
        <MountedTireCard
          activeMountedSet={activeMountedSet}
          onTread={openTreadModal}
          onEdit={openEditModal}
        />
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center space-x-4">
          <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Geen actieve bandenset gemonteerd</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Markeer een van je opgeslagen bandensets hieronder als &apos;Gemonteerd&apos; of voeg een nieuwe set toe om kilometers en profiel te registreren.
            </p>
          </div>
        </div>
      )}

      {/* All Tire Sets Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Warehouse className="w-4 h-4 text-slate-500" />
          <span>Alle Bandensets ({tireSets.length})</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">Bandensets laden...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-500">{error}</div>
        ) : tireSets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <Disc className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Geen bandensets opgeslagen</h3>
            <p className="text-xs text-slate-500 mt-1">Voeg je eerste set zomer- of winterbanden toe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tireSets.map((set) => (
              <TireSetCard
                key={set.id}
                tireSet={set}
                isMounted={set.status === 'mounted'}
                onSwap={openSwapModal}
                onTread={openTreadModal}
                onEdit={openEditModal}
                onDelete={handleDeleteTireSet}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TireSetModal
        isOpen={isAddEditModalOpen}
        editingSet={editingSet}
        defaultOdometer={curOdo}
        defaultStatus={tireSets.length === 0 ? 'mounted' : 'stored'}
        availableDocuments={availableDocuments}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveTireSet}
      />

      <TireSwapModal
        isOpen={isSwapModalOpen}
        swapTargetSet={swapTargetSet}
        defaultOdometer={curOdo}
        onClose={() => setIsSwapModalOpen(false)}
        onSave={handleConfirmSwap}
      />

      <TireTreadModal
        isOpen={isTreadModalOpen}
        treadTargetSet={treadTargetSet}
        onClose={() => setIsTreadModalOpen(false)}
        onSave={handleSaveTread}
      />
    </div>
  );
};

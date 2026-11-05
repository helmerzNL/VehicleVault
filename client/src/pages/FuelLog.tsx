import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Fuel,
  Zap,
  Camera,
} from 'lucide-react';
import { Vehicle, FuelEntry } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { ReceiptScannerModal } from '../components/ReceiptScannerModal.js';
import { useLanguage } from '../context/LanguageContext.js';
import { FuelEntryForm } from '../components/fuel/FuelEntryForm.js';
import { FuelHistoryTable } from '../components/fuel/FuelHistoryTable.js';
import { FuelEditModal } from '../components/fuel/FuelEditModal.js';
import { FuelExportImportDropdown } from '../components/fuel/FuelExportImportDropdown.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  selectedVehicleId: string | null;
}

export const FuelLog: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [towingFilter, setTowingFilter] = useState<'all' | 'solo' | 'towing'>('all');
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isEditOcrOpen, setIsEditOcrOpen] = useState(false);

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
  const [formPrefill, setFormPrefill] = useState<{
    date?: string;
    odometer?: string;
    liters?: string;
    pricePerLiter?: string;
    totalCost?: string;
    stationName?: string;
    stationAddress?: string;
    receiptPath?: string;
    energyType?: 'fuel' | 'electric';
  } | null>(null);

  const loadEntries = async (vehicleId: string) => {
    try {
      const data = await apiFetch<{ entries: FuelEntry[] }>(`/api/fuel?vehicleId=${vehicleId}`);
      setEntries(data.entries);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (selectedVehicle) {
      loadEntries(selectedVehicle.id);
      window.dispatchEvent(new CustomEvent('vv_fuel_logged'));
    }

    const handleSynced = () => {
      if (selectedVehicle) loadEntries(selectedVehicle.id);
    };
    window.addEventListener('vv_offline_synced', handleSynced);
    return () => window.removeEventListener('vv_offline_synced', handleSynced);
  }, [selectedVehicle?.id]);

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteFuel'))) {
      try {
        await apiFetch(`/api/fuel/${id}`, { method: 'DELETE' });
        if (selectedVehicle) loadEntries(selectedVehicle.id);
      } catch (err: any) {
        alert(err?.message || 'Delete failed');
      }
    }
  };

  const handleOpenEditModal = (entry: FuelEntry, autoRescan: boolean = false) => {
    setEditingEntry(entry);
    if (autoRescan) {
      setIsEditOcrOpen(true);
    }
  };

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center text-slate-500">
        {lang === 'nl' ? 'Selecteer eerst een voertuig.' : 'Please select a vehicle first.'}
      </div>
    );
  }

  const isElectric = selectedVehicle.fuel_type?.toLowerCase() === 'electric';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            {isElectric ? (
              <Zap className="w-5 h-5 text-cyan-500" />
            ) : (
              <Fuel className="w-5 h-5 text-amber-500" />
            )}
            <span>
              {isElectric
                ? (lang === 'nl' ? 'Laadsessies & Energiebeheer' : 'EV Charging Management')
                : t('fuelTitle')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isElectric
              ? (lang === 'nl' ? 'Laadbeurt invoeren voor' : 'Log charging session for')
              : (lang === 'nl' ? 'Tankbeurt invoeren voor' : 'Log fill-up for')}{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{selectedVehicle.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <FuelExportImportDropdown selectedVehicle={selectedVehicle} />

          <button
            onClick={() => setIsOcrOpen(true)}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shadow-sm"
          >
            <Camera className="w-4 h-4 text-amber-500" />
            <span>{t('ocrReceiptScanner')}</span>
          </button>
        </div>
      </div>

      {/* Fuel Entry Form Card */}
      <FuelEntryForm
        selectedVehicle={selectedVehicle}
        entries={entries}
        formPrefill={formPrefill}
        onEntryAdded={async () => {
          setFormPrefill(null);
          await loadEntries(selectedVehicle.id);
        }}
      />

      {/* Fuel Entry Logs Table */}
      <FuelHistoryTable
        entries={entries}
        towingFilter={towingFilter}
        setTowingFilter={setTowingFilter}
        onEditEntry={handleOpenEditModal}
        onDeleteEntry={handleDelete}
        onAttachReceipt={(f) => {
          handleOpenEditModal(f);
          setIsEditOcrOpen(true);
        }}
      />

      {/* Edit Modal */}
      <FuelEditModal
        editingEntry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={async () => {
          await loadEntries(selectedVehicle.id);
        }}
        onRequestOcrScan={() => setIsEditOcrOpen(true)}
      />

      {/* OCR Scanner Modals */}
      <ReceiptScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onExtracted={async (extractedData) => {
          setIsOcrOpen(false);
          if (extractedData) {
            setFormPrefill({
              date: extractedData.date || undefined,
              liters: extractedData.liters != null ? String(extractedData.liters) : undefined,
              pricePerLiter: extractedData.pricePerLiter != null ? String(extractedData.pricePerLiter) : undefined,
              totalCost: extractedData.totalCost != null ? String(extractedData.totalCost) : undefined,
              stationName: extractedData.station || undefined,
              stationAddress: extractedData.stationAddress || undefined,
              receiptPath: extractedData.receiptPath || undefined,
              energyType: 'fuel',
            });
          }
        }}
      />

      <ReceiptScannerModal
        isOpen={isEditOcrOpen}
        onClose={() => setIsEditOcrOpen(false)}
        onExtracted={async (extractedData) => {
          setIsEditOcrOpen(false);
          if (extractedData && editingEntry) {
            setEditingEntry({
              ...editingEntry,
              date: extractedData.date || editingEntry.date,
              liters: extractedData.liters != null ? extractedData.liters : editingEntry.liters,
              price_per_liter: extractedData.pricePerLiter != null ? extractedData.pricePerLiter : editingEntry.price_per_liter,
              total_cost: extractedData.totalCost != null ? extractedData.totalCost : editingEntry.total_cost,
              station_name: extractedData.station || editingEntry.station_name,
              station_address: extractedData.stationAddress || editingEntry.station_address,
              receipt_path: extractedData.receiptPath || editingEntry.receipt_path,
            });
          }
        }}
      />
    </div>
  );
};
export default FuelLog;

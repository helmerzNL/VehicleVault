import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Sparkles,
  CircleDollarSign,
  Package,
} from 'lucide-react';
import {
  Vehicle,
  MaintenanceInterval,
  ServiceRecord,
  ServiceCategory,
} from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal.js';
import { compressImage } from '../utils/imageCompressor.js';
import { IntervalCardsGrid } from '../components/maintenance/IntervalCardsGrid.js';
import { ServiceRecordsTable } from '../components/maintenance/ServiceRecordsTable.js';
import { ServiceRecordModal } from '../components/maintenance/ServiceRecordModal.js';
import { IntervalModal } from '../components/maintenance/IntervalModal.js';
import { ServiceDetailsModal } from '../components/maintenance/ServiceDetailsModal.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

export const Maintenance: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { t, lang } = useLanguage();

  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Modals state
  const [isLogServiceOpen, setIsLogServiceOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<ServiceRecord | null>(null);

  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [editingInterval, setEditingInterval] = useState<MaintenanceInterval | null>(null);

  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    date?: string;
    notes?: string;
  } | null>(null);

  const loadData = async (vehicleId: string) => {
    try {
      const [intRes, recRes, catRes] = await Promise.all([
        apiFetch<{ intervals: MaintenanceInterval[] }>(`/api/maintenance/intervals/${vehicleId}`).catch(() => ({ intervals: [] })),
        apiFetch<{ records: ServiceRecord[] }>(`/api/maintenance/records/${vehicleId}`).catch(() => ({ records: [] })),
        apiFetch<{ categories: ServiceCategory[] }>('/api/maintenance/categories').catch(() => ({ categories: [] })),
      ]);
      setIntervals(intRes.intervals || []);
      setRecords(recRes.records || []);
      setCategories(catRes.categories || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (selectedVehicle) {
      loadData(selectedVehicle.id);
    }
  }, [selectedVehicle?.id]);

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center text-slate-500">
        {lang === 'nl' ? 'Selecteer eerst een voertuig.' : 'Please select a vehicle first.'}
      </div>
    );
  }

  // Pre-ownership calculation
  const isPreOwnership = (rec: ServiceRecord): boolean => {
    if (rec.exclude_from_tco === 1 || rec.exclude_from_tco === true) return true;
    if (selectedVehicle.purchase_date && rec.date) {
      return rec.date < selectedVehicle.purchase_date.slice(0, 10);
    }
    return false;
  };

  const ownRecords = records.filter((r) => !isPreOwnership(r));
  const preOwnershipCount = records.length - ownRecords.length;

  const totalSpend = ownRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalParts = ownRecords.reduce((sum, r) => {
    if (r.parts_cost !== undefined && r.parts_cost !== null) return sum + r.parts_cost;
    return r.performing_party === 'self' ? sum + (r.cost || 0) : sum;
  }, 0);
  const totalLabor = ownRecords.reduce((sum, r) => sum + (r.labor_cost || 0), 0);
  const diyRecords = ownRecords.filter((r) => r.performing_party === 'self');
  const totalDiySavings = diyRecords.reduce((sum, r) => sum + (r.cost || 0) * 1.5, 0);

  const handleDeleteInterval = async (id: string) => {
    if (confirm(t('confirmDeleteInterval'))) {
      try {
        await apiFetch(`/api/maintenance/intervals/${id}`, { method: 'DELETE' });
        await loadData(selectedVehicle.id);
      } catch (err: any) {
        alert(err?.message || 'Delete failed');
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const confirmMsg = lang === 'nl'
      ? 'Weet je zeker dat je deze onderhoudsbeurt wilt verwijderen?'
      : 'Are you sure you want to delete this service record?';
    if (confirm(confirmMsg)) {
      try {
        await apiFetch(`/api/maintenance/records/${id}`, { method: 'DELETE' });
        await loadData(selectedVehicle.id);
      } catch (err: any) {
        alert(err?.message || 'Delete failed');
      }
    }
  };

  const handleAttachInvoice = async (recordId: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('invoice', compressed);
      formData.append('vehicleId', selectedVehicle.id);

      await apiFetch(`/api/maintenance/records/${recordId}/invoice`, {
        method: 'POST',
        body: formData,
      });
      await loadData(selectedVehicle.id);
    } catch (err: any) {
      alert(err?.message || 'Uploaden van factuur mislukt');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-sky-500" />
            <span>{t('maintenanceTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('maintenanceSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingInterval(null);
              setIsIntervalModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addPart')}</span>
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setIsLogServiceOpen(true);
            }}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{lang === 'nl' ? 'Onderhoud / Factuur Scannen' : 'Log Service / Scan Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Maintenance KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('totalFleetSpend')}</span>
            <CircleDollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            € {totalSpend.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">
            {preOwnershipCount > 0
              ? lang === 'nl'
                ? `${ownRecords.length} eigen • ${preOwnershipCount} historie (buiten TCO)`
                : `${ownRecords.length} own • ${preOwnershipCount} pre-ownership (excl. TCO)`
              : `${ownRecords.length} records`}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('partsCostShort')}</span>
            <Package className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            € {totalParts.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">{lang === 'nl' ? 'Onderdelen & filters' : 'Parts & consumables'}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('laborCostShort')}</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            € {totalLabor.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">{lang === 'nl' ? 'Garage & werkplaatstarieven' : 'Garage & workshop labor'}</span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs mb-1 font-semibold">
            <span>{t('totalDiySaved')}</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            ~ € {totalDiySavings.toFixed(0)}
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">
            {diyRecords.length} {lang === 'nl' ? 'beurten zelf gesleuteld' : (diyRecords.length === 1 ? 'service self-performed' : 'services self-performed')}
          </span>
        </div>
      </div>

      {/* Intervals Grid */}
      <IntervalCardsGrid
        intervals={intervals}
        onEditInterval={(int) => {
          setEditingInterval(int);
          setIsIntervalModalOpen(true);
        }}
        onDeleteInterval={handleDeleteInterval}
      />

      {/* Service History Table */}
      <ServiceRecordsTable
        records={records}
        selectedVehicle={selectedVehicle}
        onViewDetails={(r) => setSelectedRecordForDetails(r)}
        onEditRecord={(r) => {
          setEditingRecord(r);
          setIsLogServiceOpen(true);
        }}
        onDeleteRecord={handleDeleteRecord}
        onPreviewInvoice={(doc) => setPreviewDoc({ ...doc, isOpen: true })}
        onAttachInvoice={handleAttachInvoice}
      />

      {/* Service Record Modal */}
      <ServiceRecordModal
        isOpen={isLogServiceOpen}
        onClose={() => {
          setIsLogServiceOpen(false);
          setEditingRecord(null);
        }}
        onSaved={async () => {
          await loadData(selectedVehicle.id);
        }}
        vehicle={selectedVehicle}
        editingRecord={editingRecord}
        intervals={intervals}
      />

      {/* Interval Modal */}
      <IntervalModal
        isOpen={isIntervalModalOpen}
        onClose={() => {
          setIsIntervalModalOpen(false);
          setEditingInterval(null);
        }}
        onSaved={async () => {
          await loadData(selectedVehicle.id);
        }}
        vehicleId={selectedVehicle.id}
        categories={categories}
        editingInterval={editingInterval}
        defaultOdometer={selectedVehicle.current_odometer || selectedVehicle.initial_odometer || 0}
      />

      {/* Details Modal */}
      <ServiceDetailsModal
        record={selectedRecordForDetails}
        onClose={() => setSelectedRecordForDetails(null)}
        onEditRecord={(r) => {
          setSelectedRecordForDetails(null);
          setEditingRecord(r);
          setIsLogServiceOpen(true);
        }}
        onPreviewInvoice={(doc) => setPreviewDoc({ ...doc, isOpen: true })}
      />

      {/* In-app Document / Invoice Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={previewDoc.isOpen}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          url={previewDoc.url}
          date={previewDoc.date}
          notes={previewDoc.notes}
        />
      )}
    </div>
  );
};
export default Maintenance;

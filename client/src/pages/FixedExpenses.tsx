import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Landmark,
  Plus,
  Coins,
  Search,
  LineChart,
  Car,
  X,
  AlertCircle,
} from 'lucide-react';
import { Vehicle, RecurringExpense } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { formatLicensePlate } from '../utils/licensePlate.js';
import { ExpenseSummaryCards } from '../components/expenses/ExpenseSummaryCards.js';
import { ExpenseTable } from '../components/expenses/ExpenseTable.js';
import { ExpenseModal, PresetOption } from '../components/expenses/ExpenseModal.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

const PRESETS: PresetOption[] = [
  {
    label: 'MRB / Wegenbelasting',
    name: 'Motorrijtuigenbelasting (MRB)',
    category: 'tax',
    frequency: 'quarterly',
    icon: '🏛️',
  },
  {
    label: 'Autoverzekering',
    name: 'Autoverzekering (All-Risk / WA+)',
    category: 'insurance',
    frequency: 'monthly',
    icon: '🛡️',
  },
  {
    label: 'ANWB Pechhulp',
    name: 'ANWB Wegenwacht Europa',
    category: 'roadside',
    frequency: 'yearly',
    icon: '🛟',
  },
  {
    label: 'Flitsmeister PRO',
    name: 'Flitsmeister PRO Abonnement',
    category: 'subscription',
    frequency: 'yearly',
    icon: '📱',
  },
  {
    label: 'Private Lease',
    name: 'Private Lease Maandtermijn',
    category: 'lease',
    frequency: 'monthly',
    icon: '📝',
  },
];

export const FixedExpenses: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { lang } = useLanguage();

  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [yearlyTotal, setYearlyTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecurringExpense['category']>('tax');
  const [frequency, setFrequency] = useState<RecurringExpense['frequency']>('monthly');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Delete Confirmation Modal
  const [expenseToDelete, setExpenseToDelete] = useState<RecurringExpense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{
        expenses: RecurringExpense[];
        monthlyTotal: number;
        yearlyTotal: number;
      }>(`/api/expenses?vehicleId=${selectedVehicle.id}`);
      setExpenses(res.expenses || []);
      setMonthlyTotal(res.monthlyTotal || 0);
      setYearlyTotal(res.yearlyTotal || 0);
    } catch (err: any) {
      setError(err?.message || 'Kon vaste lasten niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedVehicle?.id]);

  const activeExpenses = useMemo(() => expenses.filter((e) => Boolean(e.is_active)), [expenses]);
  const inactiveExpenses = useMemo(() => expenses.filter((e) => !Boolean(e.is_active)), [expenses]);

  const uniqueCategoriesCount = useMemo(() => {
    return new Set(activeExpenses.map((e) => e.category)).size;
  }, [activeExpenses]);

  const highestExpense = useMemo(() => {
    if (activeExpenses.length === 0) return null;
    let max = activeExpenses[0];
    let maxMonthly =
      max.frequency === 'monthly' ? max.amount : max.frequency === 'quarterly' ? max.amount / 3 : max.amount / 12;

    for (let i = 1; i < activeExpenses.length; i++) {
      const exp = activeExpenses[i];
      const m =
        exp.frequency === 'monthly' ? exp.amount : exp.frequency === 'quarterly' ? exp.amount / 3 : exp.amount / 12;
      if (m > maxMonthly) {
        max = exp;
        maxMonthly = m;
      }
    }
    return { name: max.name, monthly: maxMonthly, category: max.category };
  }, [activeExpenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;
      if (selectedStatus === 'active' && !exp.is_active) return false;
      if (selectedStatus === 'paused' && exp.is_active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = exp.name.toLowerCase().includes(q);
        const matchesNotes = exp.notes ? exp.notes.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesNotes) return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedStatus, searchQuery]);

  const openCreateModal = (preset?: PresetOption) => {
    setEditingExpense(null);
    setName(preset ? preset.name : '');
    setCategory(preset ? preset.category : 'tax');
    setFrequency(preset ? preset.frequency : 'monthly');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsActive(true);
    setNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: RecurringExpense) => {
    setEditingExpense(exp);
    setName(exp.name);
    setCategory(exp.category);
    setFrequency(exp.frequency);
    setAmount(exp.amount.toString());
    setStartDate(exp.start_date);
    setEndDate(exp.end_date || '');
    setIsActive(Boolean(exp.is_active));
    setNotes(exp.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0 || !startDate) {
      setModalError(
        lang === 'nl'
          ? 'Naam, een geldig positief bedrag (> € 0) en begindatum zijn verplicht.'
          : 'Name, positive amount and start date are required.'
      );
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const payload = {
        name: name.trim(),
        category,
        frequency,
        amount: amt,
        startDate,
        endDate: endDate ? endDate : null,
        isActive: isActive ? 1 : 0,
        notes: notes.trim(),
      };

      if (editingExpense) {
        await apiFetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/expenses', {
          method: 'POST',
          body: JSON.stringify({ vehicleId: selectedVehicle.id, ...payload }),
        });
      }

      setIsModalOpen(false);
      await fetchExpenses();
    } catch (err: any) {
      setModalError(err?.message || 'Fout bij opslaan vaste last');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (exp: RecurringExpense) => {
    try {
      const nextActive = exp.is_active ? 0 : 1;
      await apiFetch(`/api/expenses/${exp.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: nextActive }),
      });
      await fetchExpenses();
    } catch (err: any) {
      alert(err?.message || 'Kon status niet bijwerken');
    }
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setDeleting(true);
      await apiFetch(`/api/expenses/${expenseToDelete.id}`, { method: 'DELETE' });
      setExpenseToDelete(null);
      await fetchExpenses();
    } catch (err: any) {
      alert(err?.message || 'Kon vaste last niet verwijderen');
    } finally {
      setDeleting(false);
    }
  };

  const modalCalculatedMonthly = useMemo(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return null;
    if (frequency === 'monthly') return val;
    if (frequency === 'quarterly') return val / 3;
    if (frequency === 'yearly') return val / 12;
    return val;
  }, [amount, frequency]);

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto my-12">
        <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          {lang === 'nl' ? 'Geen voertuig geselecteerd' : 'No vehicle selected'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'nl'
            ? 'Selecteer een voertuig in de balk bovenin om vaste lasten te bekijken of te beheren.'
            : 'Select a vehicle from the top selector to manage its recurring expenses.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent-100/10 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 border border-accent-200/60 dark:border-accent-500/20">
              <Landmark className="w-4 h-4" />
            </div>
            <span>{lang === 'nl' ? 'Vaste Lasten' : 'Fixed Recurring Expenses'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'nl'
              ? `${selectedVehicle.name} (${formatLicensePlate(selectedVehicle.license_plate) || 'Geen kenteken'}) • Beheer wegenbelasting (MRB), verzekering, abonnementen en lease.`
              : `${selectedVehicle.name} • Manage recurring vehicle taxes, insurance policies, and subscriptions.`}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/analytics"
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <LineChart className="w-4 h-4 text-accent-500" />
            <span>{lang === 'nl' ? 'Bekijk in TCO' : 'View in TCO'}</span>
          </Link>

          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'nl' ? 'Vaste Last Toevoegen' : 'Add Fixed Expense'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ExpenseSummaryCards
        monthlyTotal={monthlyTotal}
        yearlyTotal={yearlyTotal}
        activeExpenses={activeExpenses}
        inactiveExpenses={inactiveExpenses}
        highestExpense={highestExpense}
        uniqueCategoriesCount={uniqueCategoriesCount}
        totalExpensesCount={expenses.length}
      />

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'nl' ? 'Zoek op omschrijving of notitie...' : 'Search by description or notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedStatus === 'all'
                  ? 'bg-accent-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'nl' ? 'Alle' : 'All'}
            </button>
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedStatus === 'active'
                  ? 'bg-accent-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'nl' ? 'Actief' : 'Active'} ({activeExpenses.length})
            </button>
            <button
              onClick={() => setSelectedStatus('paused')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedStatus === 'paused'
                  ? 'bg-accent-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'nl' ? 'Gepauzeerd' : 'Paused'} ({inactiveExpenses.length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin pt-1 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: lang === 'nl' ? 'Alle Categorieën' : 'All Categories', icon: '' },
            { id: 'tax', label: 'MRB / Belasting', icon: '🏛️' },
            { id: 'insurance', label: 'Verzekering', icon: '🛡️' },
            { id: 'roadside', label: 'Pechhulp', icon: '🛟' },
            { id: 'subscription', label: 'Abonnementen', icon: '📱' },
            { id: 'lease', label: 'Lease & Financiering', icon: '📝' },
            { id: 'other', label: 'Overig', icon: '🏷️' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition flex items-center space-x-1 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table or Empty State */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-mono">
            {lang === 'nl' ? 'Vaste lasten laden...' : 'Loading recurring expenses...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-sm w-full space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-100/10 text-accent-600 dark:text-accent-400 flex items-center justify-center mx-auto border border-accent-200 dark:border-accent-500/20 shadow-sm">
            <Coins className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {lang === 'nl' ? 'Nog geen vaste lasten geregistreerd' : 'No recurring expenses configured'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'nl'
                ? 'Voeg terugkerende kosten toe zoals motorrijtuigenbelasting (MRB), autoverzekering, pechhulp of abonnementen.'
                : 'Add recurring costs like road tax (MRB), auto insurance, roadside assistance, or subscriptions.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => openCreateModal(p)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-accent-50 hover:text-accent-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center space-x-2 transition shadow-xs"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ExpenseTable
          expenses={filteredExpenses}
          onToggleActive={handleToggleActive}
          onEdit={openEditModal}
          onDeleteRequest={(exp) => setExpenseToDelete(exp)}
        />
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <ExpenseModal
          isOpen={isModalOpen}
          editingExpense={editingExpense}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveExpense}
          presets={PRESETS}
          onApplyPreset={(p) => {
            setName(p.name);
            setCategory(p.category);
            setFrequency(p.frequency);
          }}
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          frequency={frequency}
          setFrequency={setFrequency}
          amount={amount}
          setAmount={setAmount}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isActive={isActive}
          setIsActive={setIsActive}
          notes={notes}
          setNotes={setNotes}
          modalError={modalError}
          saving={saving}
          calculatedMonthly={modalCalculatedMonthly}
        />
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center safe-overlay bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 relative">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'nl' ? 'Vaste Last Verwijderen?' : 'Delete Fixed Expense?'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'nl'
                ? `Weet je zeker dat je "${expenseToDelete.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`
                : `Are you sure you want to delete "${expenseToDelete.name}"?`}
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDeleteExpense}
                disabled={deleting}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deleting ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

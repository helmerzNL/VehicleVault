import React, { useState, useEffect } from 'react';
import {
  Wrench,
  X,
  Languages,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Building2,
  MapPin,
} from 'lucide-react';
import {
  Vehicle,
  MaintenanceInterval,
  ServiceRecord,
  InvoiceLineItem,
  AiInvoiceExtraction,
} from '../../types/index.js';
import { DatePicker } from '../DatePicker.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { apiFetch } from '../../api/client.js';
import { compressImage } from '../../utils/imageCompressor.js';

interface ServiceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  vehicle: Vehicle;
  editingRecord?: ServiceRecord | null;
  intervals: MaintenanceInterval[];
}

export const ServiceRecordModal: React.FC<ServiceRecordModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  vehicle,
  editingRecord,
  intervals,
}) => {
  const { t, translateCategory, lang } = useLanguage();

  const [serviceItem, setServiceItem] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceOdometer, setServiceOdometer] = useState<string>('');
  const [serviceCost, setServiceCost] = useState<string>('0');
  const [partsCost, setPartsCost] = useState<string>('0');
  const [laborCost, setLaborCost] = useState<string>('0');
  const [performingParty, setPerformingParty] = useState<'self' | 'garage'>('self');
  const [garageName, setGarageName] = useState('');
  const [garageAddress, setGarageAddress] = useState('');
  const [extractedLineItems, setExtractedLineItems] = useState<InvoiceLineItem[]>([]);
  const [serviceNotes, setServiceNotes] = useState('');
  const [matchedIntervalIds, setMatchedIntervalIds] = useState<string[]>([]);
  const [excludeFromTco, setExcludeFromTco] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadedInvoiceFileName, setUploadedInvoiceFileName] = useState<string | null>(null);
  const [submittingService, setSubmittingService] = useState(false);

  // AI Invoice Scanner State
  const [scanningInvoice, setScanningInvoice] = useState(false);
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false);
  const [scanExtraction, setScanExtraction] = useState<AiInvoiceExtraction | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  useEffect(() => {
    if (editingRecord) {
      setServiceItem(editingRecord.service_item);
      setServiceDate(editingRecord.date ? editingRecord.date.split('T')[0] : '');
      setServiceOdometer(String(editingRecord.odometer));
      setServiceCost(String(editingRecord.cost || '0'));
      setPartsCost(String(editingRecord.parts_cost ?? (editingRecord.performing_party === 'self' ? editingRecord.cost : 0)));
      setLaborCost(String(editingRecord.labor_cost || '0'));
      setPerformingParty(editingRecord.performing_party || 'garage');
      setGarageName(editingRecord.garage_name || '');
      setGarageAddress(editingRecord.garage_address || '');
      setServiceNotes(editingRecord.notes || '');
      setUploadedInvoiceFileName(editingRecord.invoice_path || null);
      setInvoiceFile(null);
      setExcludeFromTco(Boolean(editingRecord.exclude_from_tco));
      setScanExtraction(null);
      setScanWarning(null);

      let items: InvoiceLineItem[] = [];
      if (editingRecord.line_items) {
        try {
          items = JSON.parse(editingRecord.line_items);
        } catch {}
      }
      setExtractedLineItems(items);
      setMatchedIntervalIds([]);
    } else {
      const curr = vehicle.current_odometer || vehicle.initial_odometer || 0;
      setServiceItem('');
      setServiceDate(new Date().toISOString().split('T')[0]);
      setServiceOdometer(curr > 0 ? String(curr) : '');
      setServiceCost('0');
      setPartsCost('0');
      setLaborCost('0');
      setPerformingParty('garage');
      setGarageName('');
      setGarageAddress('');
      setExtractedLineItems([]);
      setServiceNotes('');
      setMatchedIntervalIds([]);
      setExcludeFromTco(false);
      setInvoiceFile(null);
      setUploadedInvoiceFileName(null);
      setScanExtraction(null);
      setScanWarning(null);
    }
  }, [editingRecord, vehicle, isOpen]);

  if (!isOpen) return null;

  const handlePartsCostChange = (val: string) => {
    setPartsCost(val);
    const p = parseFloat(val) || 0;
    const l = parseFloat(laborCost) || 0;
    setServiceCost((p + l).toFixed(2));
  };

  const handleLaborCostChange = (val: string) => {
    setLaborCost(val);
    const p = parseFloat(partsCost) || 0;
    const l = parseFloat(val) || 0;
    setServiceCost((p + l).toFixed(2));
  };

  const handlePartyChange = (party: 'self' | 'garage') => {
    setPerformingParty(party);
    if (party === 'self') {
      setLaborCost('0');
      const p = parseFloat(partsCost) || 0;
      setServiceCost(p.toFixed(2));
    }
  };

  const handleScanInvoiceFile = async (file: File) => {
    setScanningInvoice(true);
    setScanWarning(null);
    setScanExtraction(null);
    setInvoiceFile(file);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('invoice', compressed);
      formData.append('vehicleId', vehicle.id);

      const res = await apiFetch<{
        success: boolean;
        fileName: string;
        extracted: AiInvoiceExtraction;
      }>('/api/maintenance/scan-invoice', {
        method: 'POST',
        body: formData,
      });

      if (res.fileName) {
        setUploadedInvoiceFileName(res.fileName);
      }

      if (res.extracted) {
        const ext = res.extracted;
        setScanExtraction(ext);

        if (ext.date) setServiceDate(ext.date);
        if (ext.odometer) setServiceOdometer(String(ext.odometer));
        if (ext.garageName) setGarageName(ext.garageName);
        if (ext.garageAddress) setGarageAddress(ext.garageAddress);
        if (ext.lineItems && ext.lineItems.length > 0) {
          setExtractedLineItems(ext.lineItems);
        }
        if (ext.totalCost !== null && ext.totalCost !== undefined) setServiceCost(ext.totalCost.toFixed(2));
        if (ext.partsCost !== null && ext.partsCost !== undefined) setPartsCost(ext.partsCost.toFixed(2));
        if (ext.laborCost !== null && ext.laborCost !== undefined) setLaborCost(ext.laborCost.toFixed(2));

        if (!serviceItem && ext.lineItems && ext.lineItems.length > 0) {
          setServiceItem(ext.lineItems.slice(0, 2).map((i) => i.translatedDescription).join(' + '));
        }

        setPerformingParty('garage');
      }
    } catch (err: any) {
      setScanWarning(err?.message || 'Fout bij het analyseren van de factuur');
    } finally {
      setScanningInvoice(false);
    }
  };

  const autoMatchIntervals = (
    title: string,
    items: InvoiceLineItem[],
    notesText: string,
    availableIntervals: MaintenanceInterval[]
  ): string[] => {
    const corpus = [
      title || '',
      notesText || '',
      ...items.map((it) => `${it.translatedDescription || ''} ${it.originalDescription || ''}`),
    ]
      .join(' ')
      .toLowerCase();

    if (!corpus.trim()) return [];

    const matched: string[] = [];
    for (const interval of availableIntervals) {
      const catName = (interval.customName || interval.categoryName || '').toLowerCase();
      let isMatch = false;

      if (catName.includes('olie') || catName.includes('oil')) {
        isMatch = /\b(motorolie|oliefilter|oelfilter|ölfilter|motoröl|engine oil|oil filter|5w-?30|5w-?40|0w-?20|0w-?30|10w-?40)\b/i.test(corpus);
      } else if (catName.includes('rem') || catName.includes('brake')) {
        isMatch = /\b(rem|remmen|remblok|remschijf|remvloeistof|brems|bremse|brake|brakes|brake pads|brake fluid)\b/i.test(corpus);
      } else if (catName.includes('lucht') || catName.includes('air')) {
        isMatch = /\b(luchtfilter|interieurfilter|pollenfilter|air filter|cabin filter|luftfilter|innenraumfilter)\b/i.test(corpus);
      } else if (catName.includes('bougie') || catName.includes('spark')) {
        isMatch = /\b(bougie|bougies|spark plug|spark plugs|zündkerze|zündkerzen)\b/i.test(corpus);
      } else if (catName.includes('band') || catName.includes('tire')) {
        isMatch = /\b(band|banden|tire|tires|reifen|uitlijnen|balanceren)\b/i.test(corpus);
      } else if (catName && corpus.includes(catName)) {
        isMatch = true;
      }

      if (isMatch) matched.push(interval.id);
    }
    return matched;
  };

  const toggleMatchedInterval = (id: string) => {
    setMatchedIntervalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingService(true);

    const payload = {
      vehicle_id: vehicle.id,
      service_item: serviceItem,
      date: serviceDate,
      odometer: parseInt(serviceOdometer, 10),
      cost: parseFloat(serviceCost) || 0,
      parts_cost: parseFloat(partsCost) || 0,
      labor_cost: parseFloat(laborCost) || 0,
      performing_party: performingParty,
      garage_name: performingParty === 'garage' ? garageName || null : null,
      garage_address: performingParty === 'garage' ? garageAddress || null : null,
      notes: serviceNotes || null,
      invoice_path: uploadedInvoiceFileName || null,
      line_items: extractedLineItems.length > 0 ? JSON.stringify(extractedLineItems) : null,
      matched_interval_ids: matchedIntervalIds,
      exclude_from_tco: excludeFromTco ? 1 : 0,
    };

    try {
      if (editingRecord) {
        await apiFetch(`/api/maintenance/records/${editingRecord.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/maintenance/records', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Fout bij opslaan onderhoudsbeurt');
    } finally {
      setSubmittingService(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center safe-overlay">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-safe-92vh overflow-y-auto animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-sky-500" />
            <span>
              {editingRecord
                ? (lang === 'nl' ? 'Onderhoudsbeurt Bewerken' : 'Edit Service Record')
                : t('logService')}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Smart AI Invoice Scanner & Translator Dropzone */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-purple-500/10 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <span>
                      {lang === 'nl'
                        ? 'Slimme Factuur Scanner & AI Vertaler'
                        : 'Smart Invoice Scanner & AI Translator'}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-sky-500 text-white">
                      AI
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'nl'
                      ? 'Upload een (Duitse/buitenlandse) factuur. AI leest onderdelen, prijzen & garage-adres uit en vertaalt alles naar het Nederlands.'
                      : 'Upload any foreign or local garage invoice. AI extracts parts, prices & garage address and translates everything automatically.'}
                  </p>
                </div>
              </div>
            </div>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingInvoice(true);
              }}
              onDragLeave={() => setIsDraggingInvoice(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingInvoice(false);
                if (e.dataTransfer.files?.[0]) handleScanInvoiceFile(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDraggingInvoice
                  ? 'border-sky-500 bg-sky-50/90 dark:bg-sky-950/70 ring-4 ring-sky-500/20 scale-[1.01]'
                  : 'border-sky-300/70 dark:border-sky-700/60 hover:border-sky-500 bg-white/70 dark:bg-slate-950/50'
              }`}
            >
              {scanningInvoice ? (
                <div className="py-2 flex flex-col items-center space-y-2">
                  <Sparkles className="w-7 h-7 text-sky-500 animate-spin" />
                  <span className="font-bold text-sky-600 dark:text-sky-400 animate-pulse">
                    {lang === 'nl'
                      ? 'Factuur lezen, onderdelen herkennen & vertalen met AI...'
                      : 'Reading invoice, extracting parts & translating with AI...'}
                  </span>
                </div>
              ) : (
                <>
                  <UploadCloud
                    className={`w-7 h-7 mb-1 transition ${
                      isDraggingInvoice ? 'text-sky-500 scale-110 animate-bounce' : 'text-sky-500/80'
                    }`}
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isDraggingInvoice
                      ? (lang === 'nl' ? 'Laat factuur los om direct te scannen & vertalen' : 'Drop invoice to scan & translate')
                      : invoiceFile
                        ? invoiceFile.name
                        : uploadedInvoiceFileName
                          ? (lang === 'nl' ? `Gekoppeld bestand: ${uploadedInvoiceFileName} (klik of sleep om te vervangen)` : `Attached: ${uploadedInvoiceFileName}`)
                          : (lang === 'nl' ? 'Sleep je garagefactuur (PDF of foto) hierheen of klik om te kiezen' : 'Drag your garage invoice (PDF or photo) here or click to browse')}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'nl'
                      ? 'Ondersteunt PDF, JPG, PNG & WebP'
                      : 'Supports PDF, JPG, PNG & WebP'}
                  </span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleScanInvoiceFile(f);
                }}
              />
            </label>

            {scanExtraction && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold">
                      {lang === 'nl'
                        ? `Factuur succesvol uitgelezen${scanExtraction.detectedLanguage ? ` & vertaald uit ${scanExtraction.detectedLanguage}` : ''}!`
                        : `Invoice extracted${scanExtraction.detectedLanguage ? ` & translated from ${scanExtraction.detectedLanguage}` : ''}!`}
                    </span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                      {lang === 'nl'
                        ? 'Alle velden, prijzen en het garage-adres zijn hieronder voor je ingevuld.'
                        : 'All fields, prices, and garage address have been pre-filled below.'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-[10px] font-mono font-bold">
                  {scanExtraction.model}
                </span>
              </div>
            )}

            {scanWarning && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px]">
                {scanWarning}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('partName')} *
            </label>
            <input
              type="text"
              required
              value={serviceItem}
              onChange={(e) => setServiceItem(e.target.value)}
              placeholder={lang === 'nl' ? 'bijv. Grote Onderhoudsbeurt & Oliefilter' : 'e.g. Major Service & Oil Filter'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DatePicker
                label={t('date')}
                value={serviceDate}
                onChange={setServiceDate}
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('odometer')} (km) *
              </label>
              <input
                type="number"
                required
                value={serviceOdometer}
                onChange={(e) => setServiceOdometer(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
          </div>

          {/* Pre-ownership / Exclude from TCO Toggle */}
          <label
            className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
              excludeFromTco
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={excludeFromTco}
              onChange={(e) => setExcludeFromTco(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block">
                {lang === 'nl'
                  ? 'Historische beurt / Vorige eigenaar (buiten eigen TCO houden)'
                  : 'Pre-ownership service / Previous owner (exclude from my TCO)'}
              </span>
              <span className="text-[10px] opacity-80">
                {lang === 'nl'
                  ? 'Zichtbaar in het onderhoudspaspoort, maar niet meegenomen in jouw eigen TCO-kosten.'
                  : 'Kept in service passport, excluded from your TCO costs.'}
              </span>
            </div>
          </label>

          {/* Performing Party */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('performingParty')} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePartyChange('self')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                  performingParty === 'self'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('self')}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePartyChange('garage')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                  performingParty === 'garage'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{t('garage')}</span>
              </button>
            </div>
          </div>

          {/* Garage Name & Address */}
          {performingParty === 'garage' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>{lang === 'nl' ? 'Naam Garage / Dealer' : 'Garage / Dealer Name'}</span>
                </label>
                <input
                  type="text"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  placeholder={lang === 'nl' ? 'Naam van de garage of dealer' : 'Name of garage or dealer'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{lang === 'nl' ? 'Adres van de Garage' : 'Garage Address'}</span>
                </label>
                <input
                  type="text"
                  value={garageAddress}
                  onChange={(e) => setGarageAddress(e.target.value)}
                  placeholder={lang === 'nl' ? 'Straat, huisnummer en woonplaats' : 'Street, number and city'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('partsCost')}
              </label>
              <input
                type="number"
                step="0.01"
                value={partsCost}
                onChange={(e) => handlePartsCostChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('laborCost')}
              </label>
              <input
                type="number"
                step="0.01"
                disabled={performingParty === 'self'}
                value={laborCost}
                onChange={(e) => handleLaborCostChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">{t('totalCalculatedCost')}:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">€ {serviceCost}</span>
          </div>

          {/* Extracted Line Items */}
          {extractedLineItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/50 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-sky-500" />
                <span>
                  {lang === 'nl'
                    ? `Uitgelezen & Vertaalde Factuurregels (${extractedLineItems.length})`
                    : `Extracted & Translated Invoice Items (${extractedLineItems.length})`}
                </span>
              </span>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800 max-h-48 overflow-y-auto pr-1">
                {extractedLineItems.map((item, index) => (
                  <div key={index} className="py-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            item.category === 'labor'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                          }`}
                        >
                          {item.category === 'labor'
                            ? (lang === 'nl' ? 'Arbeid' : 'Labor')
                            : (lang === 'nl' ? 'Onderdeel' : 'Part')}
                        </span>
                        <span>{item.translatedDescription}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {item.totalPrice !== null && (
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          € {item.totalPrice.toFixed(2)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExtractedLineItems((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Maintenance Intervals */}
          {intervals.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">
                    {lang === 'nl'
                      ? `Onderhoudsintervallen bijwerken (${matchedIntervalIds.length} geselecteerd)`
                      : `Reset Maintenance Intervals (${matchedIntervalIds.length} selected)`}
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  {(extractedLineItems.length > 0 || serviceItem) && (
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = autoMatchIntervals(
                          serviceItem,
                          extractedLineItems,
                          serviceNotes,
                          intervals
                        );
                        setMatchedIntervalIds(suggested);
                      }}
                      className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold hover:bg-sky-200/70 transition"
                    >
                      <Sparkles className="w-3 h-3 text-sky-500" />
                      <span>{lang === 'nl' ? 'Auto-herken uit factuur' : 'Auto-detect'}</span>
                    </button>
                  )}
                  {matchedIntervalIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMatchedIntervalIds([])}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                    >
                      {lang === 'nl' ? 'Wis selectie' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {intervals.map((i) => {
                  const isChecked = matchedIntervalIds.includes(i.id);
                  return (
                    <label
                      key={i.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-100 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMatchedInterval(i.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="font-semibold text-[11px] truncate">
                        {translateCategory(i.customName || i.categoryName)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('notes')}
            </label>
            <textarea
              rows={3}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder={lang === 'nl' ? 'Optionele toelichting over de uitgevoerde werkzaamheden...' : 'Optional notes about the performed work...'}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

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
              disabled={submittingService || scanningInvoice}
              className="px-5 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
            >
              {submittingService ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

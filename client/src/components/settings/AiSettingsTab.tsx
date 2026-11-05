import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Activity,
} from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';

export const AiSettingsTab: React.FC = () => {
  const { lang } = useLanguage();

  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'none'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [discoveredGeminiModels, setDiscoveredGeminiModels] = useState<string[]>([]);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [geminiKeyMasked, setGeminiKeyMasked] = useState<string | null>(null);
  const [geminiKeySuffix, setGeminiKeySuffix] = useState<string | null>(null);
  const [geminiKeySource, setGeminiKeySource] = useState<string | null>(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.openai.com/v1');
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [openaiKeyMasked, setOpenaiKeyMasked] = useState<string | null>(null);
  const [openaiKeySuffix, setOpenaiKeySuffix] = useState<string | null>(null);
  const [openaiKeySource, setOpenaiKeySource] = useState<string | null>(null);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSavedSuccess, setAiSavedSuccess] = useState(false);

  const loadAiSettings = async () => {
    try {
      const res = await apiFetch<{
        provider: 'gemini' | 'openai' | 'none';
        geminiModel: string;
        hasGeminiKey: boolean;
        geminiKeyMasked: string | null;
        geminiKeySuffix?: string | null;
        geminiKeySource?: string | null;
        availableGeminiModels?: string[];
        openaiModel: string;
        openaiBaseUrl: string;
        hasOpenaiKey: boolean;
        openaiKeyMasked: string | null;
        openaiKeySuffix?: string | null;
        openaiKeySource?: string | null;
      }>('/api/settings/ai');

      setAiProvider(res.provider || 'gemini');
      setGeminiModel(res.geminiModel || 'gemini-3.8-flash');
      setHasGeminiKey(res.hasGeminiKey);
      setGeminiKeyMasked(res.geminiKeyMasked);
      setGeminiKeySuffix(res.geminiKeySuffix || (res.geminiKeyMasked ? res.geminiKeyMasked.slice(-4) : null));
      setGeminiKeySource(res.geminiKeySource || null);
      if (res.availableGeminiModels && res.availableGeminiModels.length > 0) {
        setDiscoveredGeminiModels(res.availableGeminiModels);
      }
      setOpenaiModel(res.openaiModel || 'gpt-4o-mini');
      setOpenaiBaseUrl(res.openaiBaseUrl || 'https://api.openai.com/v1');
      setHasOpenaiKey(res.hasOpenaiKey);
      setOpenaiKeyMasked(res.openaiKeyMasked);
      setOpenaiKeySuffix(res.openaiKeySuffix || (res.openaiKeyMasked ? res.openaiKeyMasked.slice(-4) : null));
      setOpenaiKeySource(res.openaiKeySource || null);
    } catch {}
  };

  useEffect(() => {
    loadAiSettings();
  }, []);

  const handleTestAiConnection = async () => {
    if (aiProvider === 'none') return;
    setAiTesting(true);
    setAiTestResult(null);

    try {
      const payload: any = {
        provider: aiProvider,
        apiKey: aiProvider === 'gemini' ? geminiApiKey : openaiApiKey,
        model: aiProvider === 'gemini' ? geminiModel : openaiModel,
      };
      if (aiProvider === 'openai') payload.baseUrl = openaiBaseUrl;

      const res = await apiFetch<{ success: boolean; message: string; models?: string[] }>('/api/settings/ai/test', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAiTestResult(res);
      if (res.models && res.models.length > 0) {
        setDiscoveredGeminiModels(res.models);
        if (!res.models.includes(geminiModel)) {
          const best = res.models.find((m) => m.includes('3.8-flash')) || res.models.find((m) => m.includes('flash')) || res.models[0];
          if (best) setGeminiModel(best);
        }
      }
    } catch (err: any) {
      setAiTestResult({ success: false, message: err?.message || 'Verbindingstest mislukt' });
    } finally {
      setAiTesting(false);
    }
  };

  const handleSaveAiSettings = async () => {
    setAiSaving(true);
    setAiSavedSuccess(false);
    try {
      await apiFetch('/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({
          provider: aiProvider,
          geminiApiKey,
          geminiModel,
          openaiApiKey,
          openaiModel,
          openaiBaseUrl,
        }),
      });
      setAiSavedSuccess(true);
      setGeminiApiKey('');
      setOpenaiApiKey('');
      await loadAiSettings();
      setTimeout(() => setAiSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Fout bij opslaan van instellingen');
    } finally {
      setAiSaving(false);
    }
  };

  const handleClearKey = async (type: 'gemini' | 'openai') => {
    const confirmMsg =
      lang === 'nl'
        ? `Weet je zeker dat je de opgeslagen ${type === 'gemini' ? 'Google Gemini' : 'OpenAI'} API-sleutel wilt wissen?`
        : `Are you sure you want to remove the stored ${type === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key?`;
    if (!confirm(confirmMsg)) return;

    try {
      await apiFetch('/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({
          clearGeminiKey: type === 'gemini',
          clearOpenaiKey: type === 'openai',
        }),
      });
      await loadAiSettings();
      setAiTestResult(null);
    } catch (err: any) {
      alert(err?.message || 'Fout bij wissen van API-sleutel');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{lang === 'nl' ? 'AI Bonherkenning Configuratie' : 'AI Receipt Scanning Configuration'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'nl'
              ? 'Stel Google Gemini of OpenAI in om tankbonnen automatisch uit te lezen.'
              : 'Configure Google Gemini or OpenAI to automatically extract data from receipt photos.'}
          </p>
        </div>
        {hasGeminiKey && aiProvider === 'gemini' && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-1.5 self-start sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Google Gemini Actief</span>
          </span>
        )}
        {hasOpenaiKey && aiProvider === 'openai' && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-1.5 self-start sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>OpenAI Actief</span>
          </span>
        )}
      </div>

      {/* Provider Selection Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setAiProvider('gemini')}
          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
            aiProvider === 'gemini'
              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-1 ring-sky-500'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs">Google Gemini</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              {lang === 'nl' ? 'Aanbevolen (Gratis)' : 'Recommended (Free)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'nl'
              ? 'Beste herkenning van Nederlandse tankbonnen (Fieten Olie, Shell, etc.). Gratis API sleutel beschikbaar.'
              : 'Superior OCR and extraction for receipts. Free API key available in Google AI Studio.'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAiProvider('openai')}
          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
            aiProvider === 'openai'
              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-1 ring-sky-500'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs">OpenAI / Compatible</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
              GPT-4o
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'nl'
              ? 'Ondersteunt officiële OpenAI API of lokale self-hosted proxies (bijv. LocalAI / Ollama met visie).'
              : 'Official OpenAI API or compatible self-hosted vision endpoints.'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAiProvider('none')}
          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
            aiProvider === 'none'
              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-1 ring-sky-500'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs">Alleen Tesseract (Offline)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
              Geen AI
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'nl'
              ? "Klassieke lokale regex parser zonder externe API calls. Sneller, maar minder tolerant voor wazige foto's."
              : 'Pure on-device Tesseract OCR regex parsing with zero cloud or API requirements.'}
          </p>
        </button>
      </div>

      {/* Gemini Form */}
      {aiProvider === 'gemini' && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Google Gemini API Sleutel
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center space-x-1 text-[11px]"
              >
                <span>{lang === 'nl' ? 'Gratis sleutel aanmaken in Google AI Studio' : 'Get free key at Google AI Studio'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={
                  hasGeminiKey
                    ? (lang === 'nl'
                        ? `Huidige sleutel actief (...${geminiKeySuffix || 'opgeslagen'}). Voer nieuwe in om te wijzigen...`
                        : `Current key active (...${geminiKeySuffix || 'saved'}). Enter new key to change...`)
                    : 'AIzaSy...'
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 pr-20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                  title={showGeminiKey ? 'Verbergen' : 'Tonen'}
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {hasGeminiKey && (
                  <button
                    type="button"
                    onClick={() => handleClearKey('gemini')}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded"
                    title="API Sleutel Wissen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {hasGeminiKey && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>{lang === 'nl' ? 'Actieve API-sleutel opgeslagen:' : 'Active API Key Saved:'}</span>
                      <span className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-100 font-bold">
                        ••••••••{geminiKeySuffix || (geminiKeyMasked ? geminiKeyMasked.slice(-4) : 'lsxw')}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5">
                      {lang === 'nl'
                        ? `Laatste 4 tekens ter herkenning: "${geminiKeySuffix || (geminiKeyMasked ? geminiKeyMasked.slice(-4) : 'lsxw')}"`
                        : `Last 4 characters: "${geminiKeySuffix || (geminiKeyMasked ? geminiKeyMasked.slice(-4) : 'lsxw')}"`}
                      {geminiKeySource === 'env' && (lang === 'nl' ? ' • Ingesteld via container variabelen' : ' • Configured via container env')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {geminiApiKey && (
              <span className="text-[11px] text-sky-600 dark:text-sky-400 block font-medium">
                {lang === 'nl'
                  ? `Nieuwe sleutel wordt opgeslagen bij klikken op "Wijzigingen Opslaan" (eindigt op: ...${geminiApiKey.slice(-4)})`
                  : `New key will be saved when clicking Save (ends in: ...${geminiApiKey.slice(-4)})`}
              </span>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Gemini Model
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Aanbevolen, ultra snel &amp; modern)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Uiterst stabiel)</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Lichtgewicht &amp; zuinig)</option>
              <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
              {discoveredGeminiModels
                .filter((m) => !['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite-preview'].includes(m))
                .map((m) => (
                  <option key={m} value={m}>
                    {m} (Gevonden via API)
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* OpenAI Form */}
      {aiProvider === 'openai' && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              OpenAI API Sleutel
            </label>
            <div className="relative">
              <input
                type={showOpenaiKey ? 'text' : 'password'}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder={
                  hasOpenaiKey
                    ? (lang === 'nl'
                        ? `Huidige sleutel actief (...${openaiKeySuffix || 'opgeslagen'}). Voer nieuwe in om te wijzigen...`
                        : `Current key active (...${openaiKeySuffix || 'saved'}). Enter new key to change...`)
                    : 'sk-...'
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 pr-20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                >
                  {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {hasOpenaiKey && (
                  <button
                    type="button"
                    onClick={() => handleClearKey('openai')}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {hasOpenaiKey && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>{lang === 'nl' ? 'Actieve API-sleutel opgeslagen:' : 'Active API Key Saved:'}</span>
                      <span className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-100 font-bold">
                        ••••••••{openaiKeySuffix || (openaiKeyMasked ? openaiKeyMasked.slice(-4) : '...')}
                      </span>
                      {openaiKeySource === 'env' && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          {lang === 'nl' ? '• Ingesteld via container' : '• Configured via container'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Base URL
              </label>
              <input
                type="text"
                value={openaiBaseUrl}
                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Model Naam
              </label>
              <input
                type="text"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Test Result Message */}
      {aiTestResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs font-medium ${
            aiTestResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {aiTestResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          )}
          <div className="space-y-1 flex-1">
            <span className="font-bold block">
              {aiTestResult.success ? 'Verbinding Geslaagd!' : 'Verbinding Mislukt'}
            </span>
            <span className="block leading-relaxed">{aiTestResult.message}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {aiProvider !== 'none' ? (
          <button
            type="button"
            onClick={handleTestAiConnection}
            disabled={aiTesting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 transition disabled:opacity-50"
          >
            {aiTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-sky-500" />}
            <span>{aiTesting ? 'Bezig met testen...' : 'Test Verbinding'}</span>
          </button>
        ) : <div />}

        <div className="flex items-center space-x-2">
          {aiSavedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Instellingen opgeslagen</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAiSettings}
            disabled={aiSaving}
            className="px-5 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm"
          >
            {aiSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};


import fs from 'node:fs';
import { getActiveAiSettings } from './aiSettings.js';
import { getMimeType } from './ocrNormalizer.js';
import { postGemini, getAvailableGeminiModels } from './geminiProvider.js';
import { prepareMediaForOpenAi, buildOpenAiMediaPart, openAiPdfHint } from './openAiProvider.js';

export type AiDocumentCategory = 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other';

export interface AiDocumentExtraction {
  detectedLanguage: string | null;
  category: AiDocumentCategory;
  title: string;
  documentDate: string | null;
  expiresAt: string | null;
  issuer: string | null;
  totalAmount: number | null;
  notes: string | null;
  confidence: number;
  engine: 'gemini' | 'openai';
  model: string;
}

function cleanJsonText(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  return text.trim();
}

function parseIsoDate(val: any): string | null {
  if (!val || typeof val !== 'string') return null;
  const match = val.match(/\b([12]\d{3})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const dmyMatch = val.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.]([12]\d{3})\b/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  return null;
}

function mapCategory(val: any): AiDocumentCategory {
  if (!val || typeof val !== 'string') return 'other';
  const norm = val.toLowerCase().trim();
  if (norm.includes('reg') || norm.includes('kenteken') || norm.includes('inschrijf') || norm.includes('tenaamstelling')) {
    return 'registration';
  }
  if (norm.includes('insur') || norm.includes('polis') || norm.includes('verzeker') || norm.includes('groene')) {
    return 'insurance';
  }
  if (norm.includes('apk') || norm.includes('tuv') || norm.includes('tüv') || norm.includes('mot') || norm.includes('keur')) {
    return 'apk';
  }
  if (norm.includes('inv') || norm.includes('factuur') || norm.includes('bill') || norm.includes('nota') || norm.includes('receipt') || norm.includes('bon')) {
    return 'invoice';
  }
  if (norm.includes('man') || norm.includes('handleiding') || norm.includes('instruct') || norm.includes('guide')) {
    return 'manual';
  }
  return 'other';
}

export function normalizeAiDocument(
  rawJson: string,
  engine: 'gemini' | 'openai',
  model: string,
  targetLanguage: 'nl' | 'en' = 'nl'
): AiDocumentExtraction {
  let parsed: any = {};
  try {
    parsed = JSON.parse(cleanJsonText(rawJson));
  } catch {
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {}
    }
  }

  const category = mapCategory(parsed.category);
  const documentDate = parseIsoDate(parsed.documentDate || parsed.date);
  const expiresAt = parseIsoDate(parsed.expiresAt || parsed.expiryDate);
  const issuer = typeof parsed.issuer === 'string' && parsed.issuer.trim().length > 0 ? parsed.issuer.trim() : null;

  let totalAmount: number | null = null;
  if (parsed.totalAmount !== undefined && parsed.totalAmount !== null) {
    const num = typeof parsed.totalAmount === 'number' ? parsed.totalAmount : parseFloat(String(parsed.totalAmount).replace(',', '.'));
    if (!Number.isNaN(num) && num >= 0) totalAmount = Math.round(num * 100) / 100;
  }

  let title = typeof parsed.title === 'string' && parsed.title.trim().length > 0 ? parsed.title.trim() : '';
  if (!title) {
    const defaultLabels: Record<AiDocumentCategory, { nl: string; en: string }> = {
      registration: { nl: 'Kenteken- / Inschrijvingsbewijs', en: 'Registration Document' },
      insurance: { nl: 'Polisblad Autoverzekering', en: 'Insurance Policy' },
      apk: { nl: 'APK Keuringsrapport', en: 'Inspection Report' },
      invoice: { nl: 'Factuur', en: 'Invoice' },
      manual: { nl: 'Handleiding', en: 'Owner Manual' },
      other: { nl: 'Voertuigdocument', en: 'Vehicle Document' },
    };
    const baseLabel = defaultLabels[category][targetLanguage];
    title = issuer ? `${baseLabel} - ${issuer}` : baseLabel;
  }

  const detectedLanguage = typeof parsed.detectedLanguage === 'string' && parsed.detectedLanguage.trim().length > 0
    ? parsed.detectedLanguage.trim()
    : null;

  const notes = typeof parsed.notes === 'string' && parsed.notes.trim().length > 0 ? parsed.notes.trim() : null;

  return {
    detectedLanguage,
    category,
    title,
    documentDate,
    expiresAt,
    issuer,
    totalAmount,
    notes,
    confidence: 0.95,
    engine,
    model,
  };
}

function buildDocumentPrompt(targetLanguage: 'nl' | 'en'): string {
  const langName = targetLanguage === 'nl' ? 'Dutch (Nederlands)' : 'English';
  return `You are an expert automotive document scanner and classifier.
Analyze this document/invoice/certificate image or PDF and extract structured metadata in ${langName}.

CRITICAL CLASSIFICATION RULES:
1. "category": You MUST classify into EXACTLY ONE of these categories:
   - "registration": Vehicle registration certificate, registration code/card, brand/manufacturer registration confirmation (e.g. Kia Nederland, Tesla, VW, RDW, kentekenbewijs, tenaamstelling).
   - "insurance": Auto insurance policy schedule, green card (groene kaart), insurance bill, coverage letter.
   - "apk": Periodic roadworthiness inspection report (APK, TÜV, MOT, keuringsrapport).
   - "invoice": Invoices, registration fees, purchase receipts, brand fees, repair bills, accessory invoices.
   - "manual": Vehicle handbook, user guide, instructions.
   - "other": General correspondence or other vehicle paperwork.

2. "title": A clear, concise title in ${langName} summarizing the document (e.g. "Factuur Inschrijving - Kia Nederland", "Kentekenbewijs", "Polisblad Autoverzekering - Centraal Beheer", "Aankoopfactuur", "APK Keuringsrapport").
3. "documentDate": The date on the document or invoice as "YYYY-MM-DD", or null.
4. "expiresAt": Expiration date or valid-until date if shown (e.g. APK expiry, policy period end), formatted as "YYYY-MM-DD", or null.
5. "issuer": Organization, brand, garage, or authority that issued the document (e.g. "Kia Nederland", "RDW", "Centraal Beheer", "ANWB").
6. "totalAmount": Total amount paid or due in EUR if this is an invoice, bill, or fee (as a number), or null.
7. "notes": A concise summary in ${langName} including invoice/policy number, VIN/license plate if present, and what the document covers.

Return ONLY a valid JSON object matching this structure:
{
  "detectedLanguage": string or null,
  "category": "registration" | "insurance" | "apk" | "invoice" | "manual" | "other",
  "title": string,
  "documentDate": "YYYY-MM-DD" or null,
  "expiresAt": "YYYY-MM-DD" or null,
  "issuer": string or null,
  "totalAmount": number or null,
  "notes": string or null
}
Output strictly raw JSON without markdown fences.`;
}

export class DocumentScanner {
  public static async analyzeDocument(
    filePath: string,
    targetLanguage: 'nl' | 'en' = 'nl'
  ): Promise<AiDocumentExtraction | null> {
    const settings = getActiveAiSettings();
    const hasGemini = settings.provider === 'gemini' && Boolean(settings.geminiApiKey?.trim());
    const hasOpenAi = settings.provider === 'openai' && Boolean(settings.openaiApiKey?.trim());
    if (!hasGemini && !hasOpenAi) return null;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found on disk: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    const promptText = buildDocumentPrompt(targetLanguage);

    if (settings.provider === 'gemini' && settings.geminiApiKey) {
      const base64Data = fileBuffer.toString('base64');
      const body = {
        contents: [
          {
            parts: [
              { text: promptText },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);
      try {
        let activeModel = settings.geminiModel || 'gemini-3.8-flash';
        let res = await postGemini(activeModel, 'v1beta', settings.geminiApiKey, body, controller.signal);
        if (res.status === 404) {
          if (activeModel !== 'gemini-3.8-flash') {
            activeModel = 'gemini-3.8-flash';
            res = await postGemini(activeModel, 'v1beta', settings.geminiApiKey, body, controller.signal);
          }
          if (res.status === 404) {
            const available = await getAvailableGeminiModels(settings.geminiApiKey);
            const discovered = available.find((m) => m.includes('3.8-flash')) || available.find((m) => m.includes('flash')) || available[0];
            if (discovered && discovered !== activeModel) {
              activeModel = discovered;
              res = await postGemini(activeModel, 'v1beta', settings.geminiApiKey, body, controller.signal);
            }
          }
        }
        if (!res.ok) {
          let errDetail = `Status ${res.status}`;
          try {
            const errJson = (await res.json()) as any;
            if (errJson?.error?.message) errDetail = errJson.error.message;
          } catch {}
          throw new Error(`Gemini API fout (${res.status}): ${errDetail}`);
        }
        const resJson = (await res.json()) as any;
        const rawJson = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) throw new Error('Gemini API gaf geen antwoordtekst terug');
        return normalizeAiDocument(rawJson, 'gemini', activeModel, targetLanguage);
      } finally {
        clearTimeout(timeout);
      }
    }

    if (settings.provider === 'openai' && settings.openaiApiKey) {
      const media = await prepareMediaForOpenAi(fileBuffer, mimeType);
      const endpoint = `${(settings.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;
      const model = settings.openaiModel || 'gpt-4o-mini';
      const body = {
        model,
        messages: [
          { role: 'system', content: promptText },
          { role: 'user', content: [{ type: 'text', text: 'Extract and classify automotive document.' }, buildOpenAiMediaPart(media.base64Data, media.mimeType)] },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.openaiApiKey}` },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenAI API status ${res.status}: ${errText}${openAiPdfHint(mimeType)}`);
        }
        const resJson = (await res.json()) as any;
        const rawJson = resJson.choices?.[0]?.message?.content;
        if (!rawJson) throw new Error('OpenAI API gaf geen resultaat terug voor het document');
        return normalizeAiDocument(rawJson, 'openai', model, targetLanguage);
      } finally {
        clearTimeout(timeout);
      }
    }

    return null;
  }
}


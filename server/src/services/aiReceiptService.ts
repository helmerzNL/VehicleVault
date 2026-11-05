import fs from 'node:fs';
import {
  AiSettings,
  getSystemSetting,
  setSystemSetting,
  maskApiKey,
  filterVisionModels,
  getActiveAiSettings,
} from './ai/aiSettings.js';
import {
  AiReceiptExtraction,
  AiInvoiceLineItem,
  AiInvoiceExtraction,
  getMimeType,
  formatStationName,
  formatAddress,
  extractDutchAddress,
  normalizeAiReceipt,
  normalizeAiInvoice,
} from './ai/ocrNormalizer.js';
import {
  getAvailableGeminiModels,
  analyzeReceiptWithGemini,
  analyzeInvoiceWithGemini,
} from './ai/geminiProvider.js';
import {
  buildOpenAiMediaPart,
  openAiPdfHint,
  prepareMediaForOpenAi,
  analyzeReceiptWithOpenAi,
  analyzeInvoiceWithOpenAi,
} from './ai/openAiProvider.js';

export {
  AiReceiptExtraction,
  AiInvoiceLineItem,
  AiInvoiceExtraction,
  AiSettings,
  getSystemSetting,
  setSystemSetting,
  maskApiKey,
  formatStationName,
  formatAddress,
  extractDutchAddress,
  filterVisionModels,
  buildOpenAiMediaPart,
  openAiPdfHint,
  prepareMediaForOpenAi,
};

export class AiReceiptService {
  public static getActiveSettings(): AiSettings {
    return getActiveAiSettings();
  }

  public static isConfigured(): boolean {
    const s = this.getActiveSettings();
    if (s.provider === 'gemini') {
      return Boolean(s.geminiApiKey && s.geminiApiKey.trim().length > 0);
    }
    if (s.provider === 'openai') {
      return Boolean(s.openaiApiKey && s.openaiApiKey.trim().length > 0);
    }
    return false;
  }

  public static async getAvailableGeminiModels(apiKey: string): Promise<string[]> {
    return getAvailableGeminiModels(apiKey);
  }

  public static normalizeAiResult(
    rawJson: string,
    engine: 'gemini' | 'openai',
    model: string
  ): AiReceiptExtraction {
    return normalizeAiReceipt(rawJson, engine, model);
  }

  public static normalizeInvoiceResult(
    rawJson: string,
    engine: 'gemini' | 'openai',
    model: string,
    targetLanguage: 'nl' | 'en' = 'nl'
  ): AiInvoiceExtraction {
    return normalizeAiInvoice(rawJson, engine, model, targetLanguage);
  }

  public static async analyzeWithOpenAi(
    base64Data: string,
    mimeType: string,
    apiKey: string,
    modelName: string,
    baseUrl?: string
  ): Promise<AiReceiptExtraction> {
    return analyzeReceiptWithOpenAi(base64Data, mimeType, apiKey, modelName, baseUrl);
  }

  public static async analyzeInvoiceWithOpenAi(
    base64Data: string,
    mimeType: string,
    apiKey: string,
    modelName: string,
    baseUrl: string | undefined,
    targetLanguage: 'nl' | 'en'
  ): Promise<AiInvoiceExtraction> {
    return analyzeInvoiceWithOpenAi(base64Data, mimeType, apiKey, modelName, baseUrl, targetLanguage);
  }

  public static async testConnection(
    provider: 'gemini' | 'openai',
    apiKey?: string,
    _model?: string,
    baseUrl?: string
  ): Promise<{ success: boolean; message: string; models?: string[] }> {
    const currentSettings = this.getActiveSettings();
    const effectiveKey = apiKey !== undefined
      ? apiKey.trim()
      : provider === 'gemini'
        ? currentSettings.geminiApiKey
        : currentSettings.openaiApiKey;

    if (!effectiveKey) {
      return {
        success: false,
        message: 'Geen API-sleutel ingevoerd om te testen.',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      if (provider === 'gemini') {
        const testUrl = effectiveKey.startsWith('AIza')
          ? `https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`
          : `https://generativelanguage.googleapis.com/v1beta/models`;

        let res = await fetch(testUrl, {
          method: 'GET',
          headers: { 'x-goog-api-key': effectiveKey },
          signal: controller.signal,
        });

        if (res.status === 401) {
          res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${effectiveKey}` },
            signal: controller.signal,
          });
        }

        clearTimeout(timeout);

        if (!res.ok) {
          let errDetail = 'Ongeldige Gemini API-sleutel';
          try {
            const errJson = await res.json() as any;
            if (errJson?.error?.message) errDetail = errJson.error.message;
          } catch {}
          return { success: false, message: `Gemini API fout (${res.status}): ${errDetail}` };
        }

        const models = await getAvailableGeminiModels(effectiveKey);
        return {
          success: true,
          message: 'Verbinding met Google Gemini AI succesvol tot stand gebracht!',
          models,
        };
      }

      if (provider === 'openai') {
        const effectiveBaseUrl = (baseUrl && baseUrl.trim().length > 0)
          ? baseUrl.trim().replace(/\/+$/, '')
          : (currentSettings.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

        const testUrl = `${effectiveBaseUrl}/models`;
        const res = await fetch(testUrl, {
          method: 'GET',
          headers: { Authorization: `Bearer ${effectiveKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          let errDetail = 'Ongeldige OpenAI API-sleutel of endpoint';
          try {
            const errJson = await res.json() as any;
            if (errJson?.error?.message) errDetail = errJson.error.message;
          } catch {}
          return { success: false, message: `OpenAI API fout (${res.status}): ${errDetail}` };
        }

        return {
          success: true,
          message: 'Verbinding met OpenAI API succesvol tot stand gebracht!',
        };
      }

      clearTimeout(timeout);
      return { success: false, message: 'Onbekende provider opgegeven.' };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        return { success: false, message: 'Time-out (10s) bij het verbinden met de AI-service.' };
      }
      return { success: false, message: `Verbindingsfout: ${err?.message || 'Onbekende fout'}` };
    }
  }

  public static async analyzeReceipt(imagePath: string): Promise<AiReceiptExtraction | null> {
    const settings = this.getActiveSettings();
    if (!this.isConfigured()) return null;

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Receipt image file not found on disk: ${imagePath}`);
    }

    const fileBuffer = fs.readFileSync(imagePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);

    if (settings.provider === 'gemini' && settings.geminiApiKey) {
      return analyzeReceiptWithGemini(base64Data, mimeType, settings.geminiApiKey, settings.geminiModel);
    }

    if (settings.provider === 'openai' && settings.openaiApiKey) {
      const media = await prepareMediaForOpenAi(fileBuffer, mimeType);
      return analyzeReceiptWithOpenAi(
        media.base64Data,
        media.mimeType,
        settings.openaiApiKey,
        settings.openaiModel,
        settings.openaiBaseUrl
      );
    }

    return null;
  }

  public static async analyzeInvoice(
    filePath: string,
    targetLanguage: 'nl' | 'en' = 'nl'
  ): Promise<AiInvoiceExtraction | null> {
    const settings = this.getActiveSettings();
    if (!this.isConfigured()) return null;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Invoice file not found on disk: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = getMimeType(filePath);

    if (settings.provider === 'gemini' && settings.geminiApiKey) {
      return analyzeInvoiceWithGemini(
        base64Data,
        mimeType,
        settings.geminiApiKey,
        settings.geminiModel,
        targetLanguage
      );
    }

    if (settings.provider === 'openai' && settings.openaiApiKey) {
      const media = await prepareMediaForOpenAi(fileBuffer, mimeType);
      return analyzeInvoiceWithOpenAi(
        media.base64Data,
        media.mimeType,
        settings.openaiApiKey,
        settings.openaiModel,
        settings.openaiBaseUrl,
        targetLanguage
      );
    }

    return null;
  }
}

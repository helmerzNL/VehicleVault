import { useState } from 'react';
import { apiFetch } from '../../api/client.js';
import { compressImage } from '../../utils/imageCompressor.js';
import { useLanguage } from '../../context/LanguageContext.js';

export interface AiDocumentExtraction {
  detectedLanguage: string | null;
  category: 'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other';
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

export function useDocumentScan() {
  const { lang } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [scanExtraction, setScanExtraction] = useState<AiDocumentExtraction | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  const resetScan = () => {
    setScanning(false);
    setScanExtraction(null);
    setScanWarning(null);
  };

  const scanFile = async (
    file: File,
    onApply: (data: Partial<AiDocumentExtraction>) => void
  ) => {
    setScanning(true);
    setScanWarning(null);

    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
        try {
          fileToUpload = await compressImage(file, 1600, 2200, 0.82);
        } catch {
          fileToUpload = file;
        }
      }

      const formData = new FormData();
      formData.append('document', fileToUpload);
      formData.append('lang', lang);

      const res = await apiFetch<{
        aiConfigured: boolean;
        extraction: AiDocumentExtraction | null;
        warning?: string;
      }>(`/api/documents/scan?lang=${lang}`, {
        method: 'POST',
        body: formData,
      });

      if (res.warning) {
        setScanWarning(res.warning);
      }

      if (res.extraction) {
        setScanExtraction(res.extraction);
        onApply(res.extraction);
      }
    } catch (err: any) {
      setScanWarning(
        err?.message || (lang === 'nl' ? 'Fout bij analyseren van document' : 'Failed to analyze document')
      );
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    scanExtraction,
    scanWarning,
    scanFile,
    resetScan,
  };
}


import path from 'node:path';

export interface AiReceiptExtraction {
  date: string | null;
  liters: number | null;
  pricePerLiter: number | null;
  totalCost: number | null;
  station: string | null;
  stationAddress: string | null;
  fuelType: string | null;
  confidence: number;
  engine: 'gemini' | 'openai';
  model: string;
}

export interface AiInvoiceLineItem {
  originalDescription: string;
  translatedDescription: string;
  category: 'parts' | 'labor' | 'other';
  quantity?: string | null;
  totalPrice: number | null;
}

export interface AiInvoiceExtraction {
  date: string | null;
  odometer: number | null;
  serviceTitle: string | null;
  garageName: string | null;
  garageAddress: string | null;
  detectedLanguage: string | null;
  totalCost: number | null;
  partsCost: number | null;
  laborCost: number | null;
  lineItems: AiInvoiceLineItem[];
  translatedNotes: string | null;
  engine: 'gemini' | 'openai';
  model: string;
}

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.heic':
    case '.heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

export function formatStationName(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const acronyms = new Set(['BP', 'OK', 'Q8', 'AVIA', 'AVIF', 'TAMOIL', 'ESSO', 'ARGOS', 'NRA']);

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (trimmed === trimmed.toUpperCase() || word === word.toUpperCase()) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');
}

export function formatAddress(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .split(/\s+/)
      .map((word) => {
        if (!word) return '';
        if (/^[a-zA-Z]{2}[,.]?$/.test(word)) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  return trimmed;
}

export function extractDutchAddress(text?: string | null): string | null {
  if (!text || typeof text !== 'string') return null;
  const cleanText = text.replace(/["'{}]/g, ' ');

  const multiLineRegex = /(?:^|[\r\n])\s*([^\r\n,;:|]+?\s+\d+[a-zA-Z]?(?:\s*-\s*\d+)?)[,\s]*[\r\n]+\s*(\d{4}\s?[A-Za-z]{2})\s+([^\r\n,;:|]+?)(?:[\r\n;,|]|$)/;
  const m1 = cleanText.match(multiLineRegex);
  if (m1) {
    const street = m1[1].trim();
    const postal = m1[2].replace(/\s+/g, ' ').toUpperCase().trim();
    const city = m1[3].trim();
    if (!/^(pomp|datum|bon|tank|volume|teller|factuur|transactie)/i.test(street)) {
      return formatAddress(`${street}, ${postal} ${city}`);
    }
  }

  const singleLineRegex = /(?:^|[\r\n;,|:])\s*([^\r\n,;:|]+?\s+\d+[a-zA-Z]?(?:\s*-\s*\d+)?)[,\s]+(\d{4}\s?[A-Za-z]{2})\s+([^\r\n,;:|]+?)(?:[\r\n;,|]|$)/;
  const m2 = cleanText.match(singleLineRegex);
  if (m2) {
    const street = m2[1].trim();
    const postal = m2[2].replace(/\s+/g, ' ').toUpperCase().trim();
    const city = m2[3].trim();
    if (!/^(pomp|datum|bon|tank|volume|teller|factuur|transactie)/i.test(street)) {
      return formatAddress(`${street}, ${postal} ${city}`);
    }
  }

  const postalCityRegex = /\b(\d{4}\s?[A-Za-z]{2})\s+([A-Za-z\u00C0-\u017F'-]+)\b/;
  const m3 = cleanText.match(postalCityRegex);
  if (m3) {
    const postal = m3[1].replace(/\s+/g, ' ').toUpperCase().trim();
    const city = m3[2].trim();
    return formatAddress(`${postal} ${city}`);
  }

  return null;
}

export function normalizeAiReceipt(
  rawJson: string,
  engine: 'gemini' | 'openai',
  model: string
): AiReceiptExtraction {
  let clean = rawJson.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(clean);

  let date: string | null = null;
  if (parsed.date && typeof parsed.date === 'string') {
    const match = parsed.date.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
      date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    } else {
      const dmyMatch = parsed.date.match(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/);
      if (dmyMatch) {
        date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }
    }
  }

  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const s = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  let liters = parseNum(parsed.liters);
  let pricePerLiter = parseNum(parsed.pricePerLiter);
  let totalCost = parseNum(parsed.totalCost);

  if (liters && pricePerLiter && !totalCost) {
    totalCost = Math.round(liters * pricePerLiter * 100) / 100;
  } else if (totalCost && liters && !pricePerLiter && liters > 0) {
    pricePerLiter = Math.round((totalCost / liters) * 1000) / 1000;
  } else if (totalCost && pricePerLiter && !liters && pricePerLiter > 0) {
    liters = Math.round((totalCost / pricePerLiter) * 100) / 100;
  }

  let rawStation = typeof parsed.station === 'string' && parsed.station.trim().length > 0
    ? parsed.station.trim()
    : null;

  const rawAddress = (typeof parsed.stationAddress === 'string' && parsed.stationAddress.trim().length > 0)
    ? parsed.stationAddress.trim()
    : (typeof parsed.address === 'string' && parsed.address.trim().length > 0)
      ? parsed.address.trim()
      : (typeof parsed.station_address === 'string' && parsed.station_address.trim().length > 0)
        ? parsed.station_address.trim()
        : (typeof parsed.location === 'string' && parsed.location.trim().length > 0)
          ? parsed.location.trim()
          : null;

  let stationAddress = formatAddress(rawAddress);

  if (rawStation && /\d{4}\s?[A-Za-z]{2}/.test(rawStation)) {
    const extractedAddr = extractDutchAddress(rawStation);
    if (extractedAddr) {
      if (!stationAddress) stationAddress = extractedAddr;
      rawStation = rawStation.replace(/,\s*[A-Za-z\u00C0-\u017F.\s'-]+?\s+\d+[a-zA-Z]?.*$/, '').trim();
    }
  }

  const station = formatStationName(rawStation);

  if (!stationAddress && rawJson) {
    stationAddress = extractDutchAddress(rawJson);
  }

  const fuelType = typeof parsed.fuelType === 'string' && parsed.fuelType.trim().length > 0
    ? parsed.fuelType.trim()
    : null;

  return {
    date,
    liters,
    pricePerLiter,
    totalCost,
    station,
    stationAddress,
    fuelType,
    confidence: 99,
    engine,
    model,
  };
}

export function normalizeAiInvoice(
  rawJson: string,
  engine: 'gemini' | 'openai',
  model: string,
  targetLanguage: 'nl' | 'en' = 'nl'
): AiInvoiceExtraction {
  let clean = rawJson.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(clean);

  let date: string | null = null;
  if (parsed.date && typeof parsed.date === 'string') {
    const match = parsed.date.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
      date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    } else {
      const dmyMatch = parsed.date.match(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/);
      if (dmyMatch) {
        date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }
    }
  }

  const parseMoney = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : Math.round(val * 100) / 100;
    let s = String(val).trim();
    if (s.includes('.') && s.includes(',')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    s = s.replace(/[^0-9.-]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  };

  const parseOdometer = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') {
      if (isNaN(val) || val <= 0) return null;
      return Math.round(val);
    }
    const cleaned = String(val).replace(/(\d)[.,](?=\d{3}\b)/g, '$1').replace(/[^0-9]/g, '');
    const n = parseInt(cleaned, 10);
    return isNaN(n) || n <= 0 ? null : n;
  };

  const odometer = parseOdometer(parsed.odometer);

  const lineItems: AiInvoiceLineItem[] = Array.isArray(parsed.lineItems)
    ? parsed.lineItems
        .filter((item: any) => item && (item.translatedDescription || item.originalDescription))
        .map((item: any) => {
          const orig = String(item.originalDescription || item.translatedDescription || '').trim();
          const trans = String(item.translatedDescription || item.originalDescription || '').trim();
          const rawCat = String(item.category || '').toLowerCase();
          const category: 'parts' | 'labor' | 'other' =
            rawCat === 'labor' || rawCat === 'arbeit' || rawCat === 'arbeid'
              ? 'labor'
              : rawCat === 'parts' || rawCat === 'part' || rawCat === 'onderdelen'
                ? 'parts'
                : 'parts';
          return {
            originalDescription: orig,
            translatedDescription: trans,
            category,
            quantity: item.quantity ? String(item.quantity).trim() : null,
            totalPrice: parseMoney(item.totalPrice),
          };
        })
    : [];

  let totalCost = parseMoney(parsed.totalCost);
  let partsCost = parseMoney(parsed.partsCost);
  let laborCost = parseMoney(parsed.laborCost);

  const sumPartsItems = lineItems
    .filter((i) => i.category === 'parts' && i.totalPrice !== null)
    .reduce((acc, i) => acc + (i.totalPrice || 0), 0);
  const sumLaborItems = lineItems
    .filter((i) => i.category === 'labor' && i.totalPrice !== null)
    .reduce((acc, i) => acc + (i.totalPrice || 0), 0);

  if (partsCost === null && sumPartsItems > 0) {
    partsCost = Math.round(sumPartsItems * 100) / 100;
  }
  if (laborCost === null && sumLaborItems > 0) {
    laborCost = Math.round(sumLaborItems * 100) / 100;
  }

  if (totalCost !== null && totalCost > 0) {
    const combined = (partsCost || 0) + (laborCost || 0);
    if (combined > 0 && Math.abs(totalCost - combined) > 1) {
      const ratio = totalCost / combined;
      if (ratio > 1.05 && ratio < 1.35) {
        partsCost = Math.round((partsCost || 0) * ratio * 100) / 100;
        laborCost = Math.round((totalCost - partsCost) * 100) / 100;
      } else if (partsCost !== null && laborCost === null) {
        laborCost = Math.max(0, Math.round((totalCost - partsCost) * 100) / 100);
      } else if (laborCost !== null && partsCost === null) {
        partsCost = Math.max(0, Math.round((totalCost - laborCost) * 100) / 100);
      }
    } else if (combined === 0) {
      partsCost = totalCost;
      laborCost = 0;
    }
  } else if ((partsCost || 0) + (laborCost || 0) > 0) {
    totalCost = Math.round(((partsCost || 0) + (laborCost || 0)) * 100) / 100;
  }

  const serviceTitle =
    typeof parsed.serviceTitle === 'string' && parsed.serviceTitle.trim().length > 0
      ? parsed.serviceTitle.trim()
      : lineItems.length > 0
        ? lineItems.slice(0, 2).map((i) => i.translatedDescription).join(' & ')
        : targetLanguage === 'nl'
          ? 'Onderhoudsbeurt & Inspectie'
          : 'Maintenance & Inspection';

  const garageName =
    typeof parsed.garageName === 'string' && parsed.garageName.trim().length > 0
      ? parsed.garageName.trim()
      : null;

  const garageAddress =
    typeof parsed.garageAddress === 'string' && parsed.garageAddress.trim().length > 0
      ? parsed.garageAddress.trim()
      : null;

  const detectedLanguage =
    typeof parsed.detectedLanguage === 'string' && parsed.detectedLanguage.trim().length > 0
      ? parsed.detectedLanguage.trim()
      : null;

  let translatedNotes =
    typeof parsed.translatedNotes === 'string' && parsed.translatedNotes.trim().length > 0
      ? parsed.translatedNotes.trim()
      : null;

  if (!translatedNotes && lineItems.length > 0) {
    translatedNotes = lineItems
      .map((i) => {
        const priceStr = i.totalPrice !== null ? ` (€${i.totalPrice.toFixed(2)})` : '';
        return `• ${i.translatedDescription}${priceStr}`;
      })
      .join('\n');
  }

  return {
    date,
    odometer,
    serviceTitle,
    garageName,
    garageAddress,
    detectedLanguage,
    totalCost,
    partsCost,
    laborCost,
    lineItems,
    translatedNotes,
    engine,
    model,
  };
}


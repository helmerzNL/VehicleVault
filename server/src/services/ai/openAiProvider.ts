import {
  AiReceiptExtraction,
  AiInvoiceExtraction,
  normalizeAiReceipt,
  normalizeAiInvoice,
} from './ocrNormalizer.js';

export function buildOpenAiMediaPart(base64Data: string, mimeType: string): Record<string, unknown> {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  if (mimeType === 'application/pdf') {
    return { type: 'file', file: { filename: 'document.pdf', file_data: dataUrl } };
  }
  return { type: 'image_url', image_url: { url: dataUrl } };
}

export function openAiPdfHint(mimeType: string): string {
  return mimeType === 'application/pdf'
    ? ' (Tip: PDF-invoer werkt alleen met OpenAI-modellen die bestanden ondersteunen, zoals gpt-4o of gpt-4o-mini op api.openai.com. Upload anders een foto of schermafbeelding van de factuur.)'
    : '';
}

export async function prepareMediaForOpenAi(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ base64Data: string; mimeType: string }> {
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    try {
      const { default: sharp } = await import('sharp');
      const jpeg = await sharp(fileBuffer).rotate().jpeg({ quality: 90 }).toBuffer();
      return { base64Data: jpeg.toString('base64'), mimeType: 'image/jpeg' };
    } catch {
      throw new Error(
        'OpenAI ondersteunt geen HEIC-afbeeldingen en de conversie naar JPEG is mislukt. Maak een JPEG/PNG-foto of upload een PDF.'
      );
    }
  }
  return { base64Data: fileBuffer.toString('base64'), mimeType };
}

export async function analyzeReceiptWithOpenAi(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string,
  baseUrl?: string
): Promise<AiReceiptExtraction> {
  const model = modelName || 'gpt-4o-mini';
  const effectiveBaseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const endpoint = `${effectiveBaseUrl}/chat/completions`;

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: `You are an expert fuel receipt parser for Dutch and European filling stations.
Extract transaction details from the receipt image.

IMPORTANT FOR PETROL STATION & ADDRESS:
1. "station": Petrol station brand/company in Title Case (e.g. "Fieten Olie", "Shell", "Esso", "BP", "TotalEnergies", "Tamoil", "Argos", "Avia", never ALL CAPS).
2. "stationAddress": The physical street address of the petrol station. Combine into "Street Nr, PostalCode City" (e.g. "Eeser Gaard 2, 8332 VN Steenwijk"). You MUST extract this whenever visible on the receipt.

Return ONLY a valid JSON object with the following fields:
{
  "date": "YYYY-MM-DD" or null,
  "liters": number (volume in liters, e.g. 37.41) or null,
  "pricePerLiter": number (unit price in EUR, e.g. 2.159) or null,
  "totalCost": number (total amount paid in EUR, e.g. 80.77) or null,
  "station": string (e.g. "Fieten Olie") or null,
  "stationAddress": string (e.g. "Eeser Gaard 2, 8332 VN Steenwijk") or null,
  "fuelType": string (e.g. "Euro 95 Ongelood", "Diesel", "SuperPlus 98") or null
}`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract fuel receipt details.' },
          buildOpenAiMediaPart(base64Data, mimeType),
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API returned status ${res.status}: ${errText}${openAiPdfHint(mimeType)}`);
    }

    const resJson = await res.json() as any;
    const rawJson = resJson.choices?.[0]?.message?.content;
    if (!rawJson) {
      throw new Error('OpenAI API did not return message content');
    }

    return normalizeAiReceipt(rawJson, 'openai', model);
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeInvoiceWithOpenAi(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string,
  baseUrl: string | undefined,
  targetLanguage: 'nl' | 'en'
): Promise<AiInvoiceExtraction> {
  const model = modelName || 'gpt-4o-mini';
  const effectiveBaseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const endpoint = `${effectiveBaseUrl}/chat/completions`;
  const langName = targetLanguage === 'nl' ? 'Dutch (Nederlands)' : 'English';

  const promptText = `You are an expert automotive workshop invoice parser and technical automotive translator.
Extract all maintenance details from this invoice document/image and translate all service descriptions, parts, and labor items into ${langName}.

Return ONLY a valid JSON object matching this structure:
{
  "detectedLanguage": string or null,
  "date": "YYYY-MM-DD" or null,
  "odometer": number or null,
  "serviceTitle": string or null,
  "garageName": string or null,
  "garageAddress": string or null,
  "totalCost": number or null,
  "partsCost": number or null,
  "laborCost": number or null,
  "lineItems": [
    {
      "originalDescription": string,
      "translatedDescription": string,
      "category": "parts" | "labor",
      "quantity": string or null,
      "totalPrice": number or null
    }
  ],
  "translatedNotes": string or null
}
Output strictly raw JSON without markdown fences.`;

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: promptText,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract and translate maintenance invoice details.' },
          buildOpenAiMediaPart(base64Data, mimeType),
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API status ${res.status}: ${errText}${openAiPdfHint(mimeType)}`);
    }

    const resJson = await res.json() as any;
    const rawJson = resJson.choices?.[0]?.message?.content;
    if (!rawJson) {
      throw new Error('OpenAI API gaf geen resultaat terug voor de factuur');
    }

    return normalizeAiInvoice(rawJson, 'openai', model, targetLanguage);
  } finally {
    clearTimeout(timeout);
  }
}


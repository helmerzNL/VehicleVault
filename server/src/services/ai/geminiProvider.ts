import {
  filterVisionModels,
  setSystemSetting,
} from './aiSettings.js';
import {
  AiReceiptExtraction,
  AiInvoiceExtraction,
  normalizeAiReceipt,
  normalizeAiInvoice,
} from './ocrNormalizer.js';

export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const url = apiKey.startsWith('AIza')
      ? `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models`;

    let res = await fetch(url, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (res.status === 401) {
      res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
    }

    if (!res.ok) return [];

    const data = await res.json() as any;
    if (!Array.isArray(data.models)) return [];

    const rawModels = data.models
      .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => m.name.replace(/^models\//, ''));
    return filterVisionModels(rawModels);
  } catch {
    return [];
  }
}

export async function postGemini(
  model: string,
  apiVersion: 'v1beta' | 'v1',
  apiKey: string,
  body: any,
  signal: AbortSignal
): Promise<Response> {
  const endpoint = apiKey.startsWith('AIza')
    ? `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`
    : `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

  let res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 401) {
    res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  }

  return res;
}

export async function analyzeReceiptWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string
): Promise<AiReceiptExtraction> {
  const promptText = `You are a precision fuel receipt scanner for Dutch and European filling stations.
Extract transaction details from this receipt image.

IMPORTANT FOR PETROL STATION & ADDRESS:
1. "station": Petrol station brand/company in Title Case (e.g. "Fieten Olie", "Shell", "Esso", "BP", "TotalEnergies", "Tamoil", "Argos", "Avia", never ALL CAPS).
2. "stationAddress": The physical street address of the petrol station. In the Netherlands, filling stations print this directly under the station brand name at the top (header) or at the bottom (footer). Look for the street, house number, 4-digit + 2-letter postal code (e.g. "8332 VN"), and city/town (e.g. "Steenwijk"). Combine them into "Street Nr, PostalCode City" (e.g. "Eeser Gaard 2, 8332 VN Steenwijk"). You MUST extract this whenever visible on the receipt.

Return ONLY a valid JSON object with the following fields:
{
  "date": "YYYY-MM-DD" or null,
  "liters": number (volume in liters, e.g. 37.41) or null,
  "pricePerLiter": number (unit price in EUR, e.g. 2.159) or null,
  "totalCost": number (total amount paid in EUR, e.g. 80.77) or null,
  "station": string (e.g. "Fieten Olie") or null,
  "stationAddress": string (e.g. "Eeser Gaard 2, 8332 VN Steenwijk") or null,
  "fuelType": string (e.g. "Euro 95 Ongelood", "Diesel", "SuperPlus 98") or null
}
Ensure decimal numbers use standard dots. Do not add markdown or extra text. Output strictly raw JSON.`;

  const body = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const requestedModel = modelName || 'gemini-3.8-flash';
    let activeModel = requestedModel;

    let res = await postGemini(activeModel, 'v1beta', apiKey, body, controller.signal);

    if (res.status === 404) {
      if (activeModel !== 'gemini-3.8-flash') {
        activeModel = 'gemini-3.8-flash';
        res = await postGemini(activeModel, 'v1beta', apiKey, body, controller.signal);
      }
      if (res.status === 404) {
        const available = await getAvailableGeminiModels(apiKey);
        const discovered = available.find((m) => m.includes('3.8-flash')) || available.find((m) => m.includes('flash')) || available[0];
        if (discovered && discovered !== activeModel) {
          activeModel = discovered;
          res = await postGemini(activeModel, 'v1beta', apiKey, body, controller.signal);
        }
      }
      if (res.ok && activeModel !== requestedModel) {
        try {
          setSystemSetting('gemini_model', activeModel);
        } catch {}
      }
    }

    clearTimeout(timeout);

    if (!res.ok) {
      let errDetail = `Status ${res.status}`;
      try {
        const errJson = await res.json() as any;
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch {}
      throw new Error(`Gemini API fout (${res.status}): ${errDetail}`);
    }

    const resJson = await res.json() as any;
    const rawJson = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error('Gemini API gaf geen herkenningsresultaat terug');
    }

    return normalizeAiReceipt(rawJson, 'gemini', activeModel);
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeInvoiceWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string,
  targetLanguage: 'nl' | 'en'
): Promise<AiInvoiceExtraction> {
  const langName = targetLanguage === 'nl' ? 'Dutch (Nederlands)' : 'English';
  const promptText = `You are an expert automotive workshop invoice parser and technical automotive translator.
Extract all maintenance details from this invoice document/image and translate all service descriptions, parts, and labor items into ${langName}.

CRITICAL INSTRUCTIONS:
1. "detectedLanguage": Name of the original language on the invoice written in ${langName}.
2. "date": Invoice or service date formatted as "YYYY-MM-DD".
3. "odometer": Vehicle mileage / odometer reading on the invoice as a plain integer number, or null if not found.
4. "serviceTitle": A clear, concise summary title of the main maintenance service in ${langName}.
5. "garageName": Name of the garage / dealership / workshop.
6. "garageAddress": Complete physical address of the garage including street, house number, postal code, city, and country.
7. "totalCost": Total final amount paid including VAT as a number in EUR.
8. "partsCost": Total cost of parts, materials, oil, and fluids (including VAT).
9. "laborCost": Total cost of labor / workshop hours / AW (including VAT).
10. "lineItems": Array of all individual line items (parts, fluids, filters, inspections, labor):
   - "originalDescription": Exact original description from the invoice.
   - "translatedDescription": Accurate technical automotive translation in ${langName}.
   - "category": "parts" or "labor".
   - "quantity": Quantity string if shown, or null.
   - "totalPrice": Line price as a number, or null.
11. "translatedNotes": A concise summary in ${langName} of all work performed and parts replaced.

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
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    const requestedModel = modelName || 'gemini-3.8-flash';
    let activeModel = requestedModel;

    let res = await postGemini(activeModel, 'v1beta', apiKey, body, controller.signal);

    if (res.status === 404) {
      if (activeModel !== 'gemini-3.8-flash') {
        activeModel = 'gemini-3.8-flash';
        res = await postGemini(activeModel, 'v1beta', apiKey, body, controller.signal);
      }
      if (res.status === 404) {
        const available = await getAvailableGeminiModels(apiKey);
        const discovered = available.find((m) => m.includes('3.8-flash')) || available.find((m) => m.includes('flash')) || available[0];
        if (discovered && discovered !== activeModel) {
          activeModel = discovered;
          res = await postGemini(activeModel, 'v1beta', apiKey, body, controller.signal);
        }
      }
    }

    clearTimeout(timeout);

    if (!res.ok) {
      let errDetail = `Status ${res.status}`;
      try {
        const errJson = await res.json() as any;
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch {}
      throw new Error(`Gemini API fout (${res.status}): ${errDetail}`);
    }

    const resJson = await res.json() as any;
    const rawJson = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error('Gemini API gaf geen resultaat terug voor de factuur');
    }

    return normalizeAiInvoice(rawJson, 'gemini', activeModel, targetLanguage);
  } finally {
    clearTimeout(timeout);
  }
}


import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeAiDocument } from '../services/ai/documentScanner.js';
import { DocumentController } from '../controllers/documentController.js';
import { DATA_PATHS } from '../config/env.js';

describe('DocumentScanner & Document AI Recognition', () => {
  it('should correctly normalize and classify a brand registration invoice (e.g. Kia Nederland)', () => {
    const rawAiJson = JSON.stringify({
      detectedLanguage: 'Nederlands',
      category: 'invoice',
      title: 'Factuur Inschrijving - Kia Nederland',
      documentDate: '2026-11-02',
      expiresAt: null,
      issuer: 'Kia Nederland',
      totalAmount: 125.50,
      notes: 'Inschrijving auto bij Kia Nederland, kenteken AA-123-B, factuurnummer KIA-99123',
    });

    const result = normalizeAiDocument(rawAiJson, 'gemini', 'gemini-3.8-flash', 'nl');

    assert.equal(result.category, 'invoice');
    assert.equal(result.title, 'Factuur Inschrijving - Kia Nederland');
    assert.equal(result.documentDate, '2026-11-02');
    assert.equal(result.expiresAt, null);
    assert.equal(result.issuer, 'Kia Nederland');
    assert.equal(result.totalAmount, 125.50);
    assert.ok(result.notes?.includes('Kia Nederland'));
  });

  it('should normalize insurance policies with expiration date and Dutch category mapping', () => {
    const rawAiJson = `\`\`\`json
    {
      "category": "polisblad verzekering",
      "title": "",
      "documentDate": "01-03-2026",
      "expiresAt": "01-03-2027",
      "issuer": "Centraal Beheer",
      "notes": "WA Casco Dekking"
    }
    \`\`\``;

    const result = normalizeAiDocument(rawAiJson, 'openai', 'gpt-4o-mini', 'nl');

    assert.equal(result.category, 'insurance');
    assert.equal(result.title, 'Polisblad Autoverzekering - Centraal Beheer');
    assert.equal(result.documentDate, '2026-03-01');
    assert.equal(result.expiresAt, '2027-03-01');
    assert.equal(result.issuer, 'Centraal Beheer');
  });

  it('should normalize periodic APK inspection reports with fallback title', () => {
    const rawAiJson = JSON.stringify({
      category: 'keuringsbewijs apk',
      documentDate: '2026-10-15',
      expiresAt: '2027-10-15',
      issuer: 'RDW',
    });

    const result = normalizeAiDocument(rawAiJson, 'gemini', 'gemini-3.8-flash', 'nl');

    assert.equal(result.category, 'apk');
    assert.equal(result.title, 'APK Keuringsrapport - RDW');
    assert.equal(result.documentDate, '2026-10-15');
    assert.equal(result.expiresAt, '2027-10-15');
  });

  it('should handle scanDocument when no file is uploaded', async () => {
    let statusCode = 200;
    let jsonResult: any = null;

    const req: any = { body: {}, query: {} };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResult = data;
      },
    };

    await DocumentController.scanDocument(req, res);
    assert.equal(statusCode, 400);
    assert.equal(jsonResult.error, 'No document file uploaded');
  });

  it('should gracefully clean up temporary file and notify user when AI is unconfigured', async () => {
    const tempFile = path.join(DATA_PATHS.documents, `temp-scan-test-${Date.now()}.pdf`);
    fs.writeFileSync(tempFile, '%PDF-1.4 sample document');

    let jsonResult: any = null;
    const req: any = {
      file: {
        filename: path.basename(tempFile),
        path: tempFile,
      },
      body: { lang: 'nl' },
      query: {},
    };
    const res: any = {
      json: (data: any) => {
        jsonResult = data;
      },
    };

    await DocumentController.scanDocument(req, res);

    assert.ok(jsonResult, 'Expected response JSON');
    // Ensure temporary file was safely unlinked
    assert.equal(fs.existsSync(tempFile), false, 'Temporary scan file must be deleted from disk');
  });
});


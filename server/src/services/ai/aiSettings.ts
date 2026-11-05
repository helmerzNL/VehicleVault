import { db } from '../../db/database.js';

export interface AiSettings {
  provider: 'gemini' | 'openai' | 'none';
  geminiApiKey?: string;
  geminiModel: string;
  openaiApiKey?: string;
  openaiModel: string;
  openaiBaseUrl?: string;
}

export function getSystemSetting(key: string): string | null {
  try {
    const row = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', [key]);
    return row ? row.value : null;
  } catch {
    return null;
  }
}

export function setSystemSetting(key: string, value: string): void {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, now]
  );
}

export function maskApiKey(key?: string | null): string | null {
  if (!key || key.trim().length === 0) return null;
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

export function filterVisionModels(models: string[]): string[] {
  const isExcluded = (name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.includes('-tts') ||
      lower.includes('-image') ||
      lower.includes('audio') ||
      lower.includes('embed') ||
      lower.includes('text-') ||
      lower.includes('bison') ||
      lower.includes('aqa') ||
      lower.includes('imagen') ||
      lower.includes('1.5-flash') ||
      lower.includes('2.0-flash') ||
      lower.includes('1.0-') ||
      lower === 'gemini-1.5-pro'
    );
  };

  return models
    .filter((m) => !isExcluded(m))
    .sort((a, b) => {
      if (a === 'gemini-3.8-flash') return -1;
      if (b === 'gemini-3.8-flash') return 1;
      if (a === 'gemini-2.5-flash') return -1;
      if (b === 'gemini-2.5-flash') return 1;
      if (a.includes('flash') && !b.includes('flash')) return -1;
      if (!a.includes('flash') && b.includes('flash')) return 1;
      return a.localeCompare(b);
    });
}

export function getActiveAiSettings(): AiSettings {
  const storedProvider = getSystemSetting('ai_provider');
  const envProvider = process.env.AI_PROVIDER;
  const provider = (storedProvider || envProvider || 'gemini') as 'gemini' | 'openai' | 'none';

  const geminiApiKey = getSystemSetting('gemini_api_key') || process.env.GEMINI_API_KEY || '';
  let geminiModel = getSystemSetting('gemini_model') || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (geminiModel === 'gemini-1.5-flash' || geminiModel === 'gemini-2.0-flash' || geminiModel === 'gemini-1.5-pro') {
    geminiModel = 'gemini-3.8-flash';
    try {
      setSystemSetting('gemini_model', 'gemini-3.8-flash');
    } catch {}
  }

  const openaiApiKey = getSystemSetting('openai_api_key') || process.env.OPENAI_API_KEY || '';
  const openaiModel = getSystemSetting('openai_model') || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const openaiBaseUrl = getSystemSetting('openai_base_url') || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  return {
    provider,
    geminiApiKey,
    geminiModel,
    openaiApiKey,
    openaiModel,
    openaiBaseUrl,
  };
}

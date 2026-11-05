import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { generateApiKey } from '../../utils/token.js';
import { logger } from '../../utils/logger.js';

const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
});

export class AuthApiKeyController {
  public static async listApiKeys(req: Request, res: Response): Promise<void> {
    try {
      const keys = db.query(
        'SELECT id, name, prefix, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
        [req.user?.userId]
      );
      res.json({ apiKeys: keys });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'List API keys error');
      res.status(500).json({ error: 'API keys ophalen mislukt' });
    }
  }

  public static async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const parse = createApiKeySchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { rawKey, keyHash, prefix } = generateApiKey(parse.data.name);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.run(
        'INSERT INTO api_keys (id, user_id, name, key_hash, prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, req.user?.userId, parse.data.name, keyHash, prefix, now]
      );

      res.status(201).json({
        id,
        name: parse.data.name,
        apiKey: rawKey, // Displayed ONLY once
        prefix,
        created_at: now,
        warning: 'Save this API key now. You will not be able to view the full key again.',
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Create API key error');
      res.status(500).json({ error: 'API key aanmaken mislukt' });
    }
  }

  public static async deleteApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      db.run('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [id, req.user?.userId]);
      res.json({ success: true });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Delete API key error');
      res.status(500).json({ error: 'API key verwijderen mislukt' });
    }
  }
}


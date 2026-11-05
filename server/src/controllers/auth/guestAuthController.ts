import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { isAuthDisabled, getDefaultUser } from '../../middleware/auth.js';
import { hashPassword } from '../../utils/token.js';
import { startSession } from '../../utils/session.js';
import { logger } from '../../utils/logger.js';
import { getSystemSetting } from '../../services/ai/aiSettings.js';

const convertSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens lang zijn'),
});

export class GuestAuthController {
  public static isGuestAccessAllowed(): boolean {
    const setting = getSystemSetting('allow_guest_access');
    return setting !== 'false';
  }

  public static async guestLogin(req: Request, res: Response): Promise<void> {
    try {
      if (!GuestAuthController.isGuestAccessAllowed()) {
        res.status(403).json({ error: 'Gasttoegang is uitgeschakeld door de beheerder.' });
        return;
      }

      if (isAuthDisabled()) {
        const defaultUser = getDefaultUser();
        const session = startSession(req, res, {
          id: defaultUser.userId,
          email: defaultUser.email,
          role: defaultUser.role,
        });
        res.json({ ...session, isGuest: false });
        return;
      }

      const userId = crypto.randomUUID();
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const email = `gast_${randomSuffix}@proef.local`;
      const placeholderPass = crypto.randomBytes(24).toString('hex');
      const passwordHash = await hashPassword(placeholderPass);
      const now = new Date().toISOString();

      db.run(
        'INSERT INTO users (id, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, email, passwordHash, 'user', 1, now, now]
      );

      const session = startSession(
        req,
        res,
        { id: userId, email, role: 'user' },
        { trackLogin: true }
      );

      logger.info({ userId, email }, 'Guest user session created');
      res.status(201).json({
        ...session,
        isGuest: true,
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Guest login error');
      res.status(500).json({ error: err?.message || 'Aanmaken van gasttoegang is mislukt' });
    }
  }

  public static async convertGuest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Niet ingelogd' });
        return;
      }

      const parse = convertSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { email, password } = parse.data;
      const cleanEmail = email.toLowerCase().trim();

      const user = db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        res.status(404).json({ error: 'Gebruiker niet gevonden' });
        return;
      }

      if (user.is_guest !== 1 && !user.email.endsWith('@proef.local')) {
        res.status(400).json({ error: 'Dit account is al een permanent account.' });
        return;
      }

      const existing = db.get<any>('SELECT id FROM users WHERE email = ? AND id != ?', [cleanEmail, userId]);
      if (existing) {
        res.status(409).json({ error: 'Er bestaat al een account met dit e-mailadres.' });
        return;
      }

      const newHash = await hashPassword(password);
      const now = new Date().toISOString();

      db.run(
        'UPDATE users SET email = ?, password_hash = ?, is_guest = 0, updated_at = ? WHERE id = ?',
        [cleanEmail, newHash, now, userId]
      );

      logger.info({ userId, cleanEmail }, 'Guest account successfully converted to permanent user');

      res.json({
        success: true,
        message: 'Account succesvol opgeslagen! Je bent nu een permanente gebruiker.',
        user: {
          id: userId,
          email: cleanEmail,
          role: user.role,
          isGuest: false,
        },
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Convert guest error');
      res.status(500).json({ error: err?.message || 'Opslaan van gastaccount mislukt' });
    }
  }
}


import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { EmailService } from '../../services/emailService.js';
import { hashPassword } from '../../utils/token.js';
import { logger } from '../../utils/logger.js';

export class AuthPasswordResetController {
  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Voer een geldig e-mailadres in' });
        return;
      }

      const user = db.get<any>('SELECT id, email FROM users WHERE LOWER(email) = ?', [email]);
      if (!user) {
        res.json({
          success: true,
          message: 'Als dit e-mailadres bij ons bekend is, is er een herstellink verzonden.',
        });
        return;
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const id = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      db.run(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, user.id, tokenHash, expiresAt, now.toISOString()]
      );

      const hostHeader = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3084';
      const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
      const origin = req.headers.origin || `${proto}://${hostHeader}`;
      const resetLink = `${origin}/reset-password?token=${rawToken}`;

      const smtpConfigured = EmailService.isConfigured();
      let emailSent = false;
      let emailError: string | null = null;

      if (smtpConfigured) {
        try {
          const mailRes = await EmailService.sendPasswordResetEmail(user.email, resetLink);
          emailSent = mailRes.success;
          if (!mailRes.success) {
            emailError = mailRes.message;
          }
        } catch (mailErr: any) {
          logger.error({ err: mailErr?.message }, 'Failed to send password reset email');
          emailError = mailErr?.message || 'Mail send failure';
        }
      }

      res.json({
        success: true,
        message: smtpConfigured && emailSent
          ? 'Er is een e-mail met een herstellink verzonden naar uw e-mailadres.'
          : 'Wachtwoordherstel geïnitieerd.',
        smtpConfigured,
        emailSent,
        resetLink: (!smtpConfigured || !emailSent || process.env.NODE_ENV === 'test') ? resetLink : undefined,
        errorDetails: emailError,
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Forgot password error');
      res.status(500).json({ error: 'Fout bij verwerken van wachtwoordherstel' });
    }
  }

  public static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const rawToken = typeof req.query?.token === 'string' ? req.query.token.trim() : '';
      if (!rawToken) {
        res.status(400).json({ valid: false, error: 'Geen token opgegeven' });
        return;
      }

      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const now = new Date().toISOString();

      const reset = db.get<any>(
        `SELECT r.id, r.user_id, r.expires_at, r.used_at, u.email
         FROM password_resets r
         JOIN users u ON u.id = r.user_id
         WHERE r.token_hash = ?`,
        [tokenHash]
      );

      if (!reset || reset.used_at !== null || reset.expires_at <= now) {
        res.status(400).json({ valid: false, error: 'Deze herstellink is ongeldig of verlopen' });
        return;
      }

      res.json({ valid: true, email: reset.email });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Verify reset token error');
      res.status(500).json({ valid: false, error: 'Verificatie mislukt' });
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        token: z.string().min(1, 'Token is verplicht'),
        newPassword: z.string().min(8, 'Nieuw wachtwoord moet minimaal 8 tekens lang zijn'),
      });

      const parse = schema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { token, newPassword } = parse.data;
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const now = new Date().toISOString();

      const reset = db.get<any>(
        `SELECT r.id, r.user_id, r.expires_at, r.used_at
         FROM password_resets r
         WHERE r.token_hash = ?`,
        [tokenHash]
      );

      if (!reset || reset.used_at !== null || reset.expires_at <= now) {
        res.status(400).json({ error: 'Deze herstellink is ongeldig of verlopen' });
        return;
      }

      const newHash = await hashPassword(newPassword);
      db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, reset.user_id]);
      db.run('UPDATE password_resets SET used_at = ? WHERE id = ?', [now, reset.id]);
      db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [reset.user_id]);

      res.json({ success: true, message: 'Wachtwoord succesvol opnieuw ingesteld. Log nu in.' });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Reset password error');
      res.status(500).json({ error: 'Wachtwoord opnieuw instellen mislukt' });
    }
  }

  public static async generateUserResetLink(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const targetUser = db.get<any>('SELECT id, email FROM users WHERE id = ?', [id]);
      if (!targetUser) {
        res.status(404).json({ error: 'Gebruiker niet gevonden' });
        return;
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const resetId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      db.run(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [resetId, targetUser.id, tokenHash, expiresAt, now.toISOString()]
      );

      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const resetLink = `${proto}://${host}/reset-password?token=${rawToken}`;

      res.json({
        success: true,
        resetLink,
        expiresAt,
        message: 'Kopieer deze eenmalige herstellink en deel deze veilig met de gebruiker.',
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Generate user reset link error');
      res.status(500).json({ error: 'Aanmaken herstellink mislukt' });
    }
  }
}

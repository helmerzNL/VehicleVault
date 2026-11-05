import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { isAuthDisabled, getDefaultUser, getProxyUser, isProxyAuthEnabled, isTrustedProxy } from '../../middleware/auth.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  hashToken,
  generate2FaTempToken,
} from '../../utils/token.js';
import { startSession, clearSessionCookies } from '../../utils/session.js';
import { requestOrigin, classifyPasskeyOrigin } from '../../utils/passkeyHost.js';
import { logger } from '../../utils/logger.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export class AuthSessionController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const parse = registerSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { email, password } = parse.data;

      const existing = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
      if (existing) {
        res.status(409).json({ error: 'Er bestaat al een gebruiker met dit e-mailadres' });
        return;
      }

      const userCount = db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
      const role = (userCount?.count || 0) === 0 ? 'admin' : 'user';

      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      db.run(
        'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, email.toLowerCase(), passwordHash, role, now, now]
      );

      const session = startSession(req, res, { id: userId, email: email.toLowerCase(), role });
      res.status(201).json(session);
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Registration error');
      res.status(500).json({ error: err?.message || 'Registratie mislukt door een serverfout' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const parse = loginSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { email, password } = parse.data;
      const user = db.get<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

      if (!user || !(await comparePassword(password, user.password_hash))) {
        res.status(401).json({ error: 'Ongeldig e-mailadres of wachtwoord' });
        return;
      }

      if (user.two_factor_enabled === 1) {
        const tempToken = generate2FaTempToken({ userId: user.id, email: user.email });
        res.json({
          requires2FA: true,
          tempToken,
          message: 'Voer de 6-cijferige verificatiecode uit je authenticator-app in.',
        });
        return;
      }

      res.json(startSession(req, res, user, { trackLogin: true }));
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Login error');
      res.status(500).json({ error: err?.message || 'Inloggen mislukt door een serverfout' });
    }
  }

  public static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ error: 'Missing refresh token cookie' });
        return;
      }

      const tokenHash = hashToken(refreshToken);
      const tokenRecord = db.get<any>(
        `SELECT r.*, u.email, u.role 
         FROM refresh_tokens r
         JOIN users u ON u.id = r.user_id
         WHERE r.token_hash = ? AND r.expires_at > ?`,
        [tokenHash, new Date().toISOString()]
      );

      if (!tokenRecord) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
        return;
      }

      const accessToken = generateAccessToken({
        userId: tokenRecord.user_id,
        email: tokenRecord.email,
        role: tokenRecord.role,
      });

      const now = new Date().toISOString();
      db.run('UPDATE users SET last_login_at = ?, last_active_at = ? WHERE id = ?', [now, now, tokenRecord.user_id]);

      res.json({
        accessToken,
        user: { id: tokenRecord.user_id, email: tokenRecord.email, role: tokenRecord.role },
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Refresh token error');
      res.status(500).json({ error: err?.message || 'Sessie vernieuwen mislukt' });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        db.run('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
      }
      clearSessionCookies(res);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Logout error');
      res.status(500).json({ error: err?.message || 'Uitloggen mislukt' });
    }
  }

  public static async status(req: Request, res: Response): Promise<void> {
    try {
      const proxyUser = getProxyUser(req);
      if (proxyUser) {
        const session = startSession(
          req,
          res,
          { id: proxyUser.userId, email: proxyUser.email, role: proxyUser.role },
          { trackLogin: true }
        );
        res.json({
          authDisabled: false,
          isProxyAuth: true,
          user: session.user,
          accessToken: session.accessToken,
        });
        return;
      }

      const userCount = db.get<{ count: number }>('SELECT count(*) as count FROM users')?.count || 0;
      const hasUsers = userCount > 0;

      const disabled = isAuthDisabled();
      const user = disabled ? getDefaultUser() : null;
      const passkey = classifyPasskeyOrigin(requestOrigin(req));
      const allowGuestAccess = !disabled && (db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['allow_guest_access'])?.value !== 'false');
      res.json({
        authDisabled: disabled,
        isProxyAuth: false,
        hasUsers,
        allowGuestAccess,
        user,
        passkeyAvailable: passkey.available,
        passkeyUnavailableReason: passkey.reason,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to check auth status' });
    }
  }

  public static proxyDebug(req: Request, res: Response): void {
    const proxyUser = getProxyUser(req);
    const enabled = isProxyAuthEnabled();
    const trusted = isTrustedProxy(req);
    let session = null;
    if (proxyUser) {
      session = startSession(req, res, { id: proxyUser.userId, email: proxyUser.email, role: proxyUser.role }, { trackLogin: true });
    }
    res.json({
      timestamp: new Date().toISOString(),
      isProxyAuthEnabled: enabled,
      isTrustedProxy: trusted,
      proxyUser,
      sessionCreated: !!session,
      cookiesSet: !!session,
      clientIp: req.ip,
      remoteAddress: req.socket?.remoteAddress,
      headers: {
        'remote-email': req.headers['remote-email'],
        'remote-user': req.headers['remote-user'],
        'remote-name': req.headers['remote-name'],
        'remote-groups': req.headers['remote-groups'],
        'x-pangolin-email': req.headers['x-pangolin-email'],
        'x-pangolin-user': req.headers['x-pangolin-user'],
        'x-forwarded-user': req.headers['x-forwarded-user'],
        'x-forwarded-email': req.headers['x-forwarded-email'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'p-access-token': req.headers['p-access-token'],
      },
      allHeaderKeys: Object.keys(req.headers),
      cookies: Object.keys(req.cookies || {}),
    });
  }

  public static async me(req: Request, res: Response): Promise<void> {
    try {
      const disabled = isAuthDisabled();
      let user = db.get<any>('SELECT id, email, role, is_guest, created_at FROM users WHERE id = ?', [req.user?.userId]);
      if (!user && disabled) {
        user = getDefaultUser();
      }
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isGuest: Boolean(user.is_guest),
          created_at: user.created_at,
        },
        isApiKey: req.user?.isApiKey,
        authDisabled: disabled,
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'User fetch error');
      res.status(500).json({ error: 'Gebruikersgegevens ophalen mislukt' });
    }
  }

  public static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1, 'Huidig wachtwoord is verplicht'),
        newPassword: z.string().min(8, 'Nieuw wachtwoord moet minimaal 8 tekens lang zijn'),
      });

      const parse = changePasswordSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { currentPassword, newPassword } = parse.data;
      const userId = req.user?.userId;

      const user = db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        res.status(404).json({ error: 'Gebruiker niet gevonden' });
        return;
      }

      const isValid = await comparePassword(currentPassword, user.password_hash);
      if (!isValid) {
        res.status(401).json({ error: 'Huidig wachtwoord is onjuist' });
        return;
      }

      const newHash = await hashPassword(newPassword);
      const now = new Date().toISOString();
      db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, userId]);

      db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

      res.json({ success: true, message: 'Wachtwoord succesvol gewijzigd. Log opnieuw in.' });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Change password error');
      res.status(500).json({ error: err?.message || 'Wachtwoord wijzigen mislukt door een serverfout' });
    }
  }
}


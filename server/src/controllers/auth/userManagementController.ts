import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { hashPassword } from '../../utils/token.js';
import { logger } from '../../utils/logger.js';

export class UserManagementController {
  public static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        email: z.string().email(),
        role: z.enum(['admin', 'driver', 'user']).default('driver'),
        password: z.string().min(6).optional(),
      });

      const parse = schema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const { email, role, password } = parse.data;
      const cleanEmail = email.trim().toLowerCase();

      const existing = db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing) {
        res.status(409).json({ error: 'Er bestaat al een gebruiker met dit e-mailadres' });
        return;
      }

      const userId = crypto.randomUUID();
      const passwordHash = password ? await hashPassword(password) : 'proxy_auth_placeholder';
      const now = new Date().toISOString();

      db.run(
        'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, cleanEmail, passwordHash, role, now, now]
      );

      res.status(201).json({
        success: true,
        user: { id: userId, email: cleanEmail, role, created_at: now },
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Create user error');
      res.status(500).json({ error: err?.message || 'Gebruiker aanmaken mislukt' });
    }
  }

  public static async listShareableUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.userId;
      const users = db.query<any>(
        'SELECT id, email, role FROM users WHERE id != ? ORDER BY email ASC',
        currentUserId ? [currentUserId] : []
      );
      res.json({ users });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'List shareable users error');
      res.status(500).json({ error: 'Gebruikers ophalen mislukt' });
    }
  }

  public static async listUsers(_req: Request, res: Response): Promise<void> {
    try {
      const rows = db.query<any>(`
        SELECT
          u.id,
          u.email,
          u.role,
          u.is_guest,
          u.created_at,
          u.updated_at,
          u.last_login_at,
          u.last_active_at,
          (SELECT MAX(created_at) FROM refresh_tokens WHERE user_id = u.id) AS last_token_at,
          (SELECT MAX(last_used_at) FROM api_keys WHERE user_id = u.id) AS last_api_key_at,
          (SELECT MAX(updated_at) FROM vehicles WHERE user_id = u.id) AS last_vehicle_mod_at,
          (SELECT MAX(fe.created_at) FROM fuel_entries fe JOIN vehicles v ON fe.vehicle_id = v.id WHERE v.user_id = u.id) AS last_fuel_at,
          (SELECT MAX(sr.created_at) FROM service_records sr JOIN vehicles v ON sr.vehicle_id = v.id WHERE v.user_id = u.id) AS last_service_at,
          (SELECT MAX(t.created_at) FROM trips t JOIN vehicles v ON t.vehicle_id = v.id WHERE v.user_id = u.id) AS last_trip_at,
          (SELECT COUNT(*) FROM vehicles WHERE user_id = u.id) AS vehicle_count,
          (SELECT COUNT(*) FROM vehicle_shares WHERE user_id = u.id) AS shared_vehicle_count
        FROM users u
        ORDER BY u.created_at ASC
      `);

      const now = Date.now();
      const users = rows.map((r) => {
        const loginCandidates = [r.last_login_at, r.last_token_at].filter(Boolean);
        const changeCandidates = [r.last_vehicle_mod_at, r.last_fuel_at, r.last_service_at, r.last_trip_at].filter(Boolean);
        const allActivityCandidates = [
          r.last_active_at,
          ...loginCandidates,
          ...changeCandidates,
          r.last_api_key_at,
        ].filter(Boolean);

        const getLatest = (arr: string[]) => {
          if (arr.length === 0) return null;
          return arr.reduce((max, cur) => (new Date(cur).getTime() > new Date(max).getTime() ? cur : max));
        };

        const lastLogin = getLatest(loginCandidates);
        const lastChange = getLatest(changeCandidates);
        const lastActive = getLatest(allActivityCandidates);

        let isDormant = false;
        if (lastActive) {
          const diffDays = Math.floor((now - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 60) isDormant = true;
        } else if (r.created_at) {
          const createdDays = Math.floor((now - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (createdDays >= 14) isDormant = true;
        }

        return {
          id: r.id,
          email: r.email,
          role: r.role,
          is_guest: Boolean(r.is_guest),
          created_at: r.created_at,
          updated_at: r.updated_at,
          last_login_at: lastLogin,
          last_change_at: lastChange,
          last_active_at: lastActive,
          vehicle_count: r.vehicle_count || 0,
          shared_vehicle_count: r.shared_vehicle_count || 0,
          is_dormant: isDormant,
        };
      });

      res.json({ users });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'List users error');
      res.status(500).json({ error: 'Gebruikerslijst ophalen mislukt' });
    }
  }

  public static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const validRoles = ['admin', 'driver', 'user'];
      if (!role || !validRoles.includes(role)) {
        res.status(400).json({ error: `Ongeldige rol. Kies uit: ${validRoles.join(', ')}` });
        return;
      }

      const targetUser = db.get<any>('SELECT id, email, role FROM users WHERE id = ?', [id]);
      if (!targetUser) {
        res.status(404).json({ error: 'Gebruiker niet gevonden' });
        return;
      }

      if (targetUser.role === 'admin' && role !== 'admin') {
        const adminCount = db.get<{ count: number }>('SELECT count(*) as count FROM users WHERE role = ?', ['admin'])?.count || 0;
        if (adminCount <= 1) {
          res.status(400).json({ error: 'Kan rol niet wijzigen: Er moet minimaal één actieve beheerder blijven.' });
          return;
        }
      }

      const now = new Date().toISOString();
      db.run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, id]);

      res.json({
        success: true,
        user: { id: targetUser.id, email: targetUser.email, role, updated_at: now },
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Update user role error');
      res.status(500).json({ error: err?.message || 'Rol bijwerken mislukt' });
    }
  }

  public static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const targetUser = db.get<any>('SELECT id, email, role FROM users WHERE id = ?', [id]);
      if (!targetUser) {
        res.status(404).json({ error: 'Gebruiker niet gevonden' });
        return;
      }

      if (targetUser.role === 'admin') {
        const adminCount = db.get<{ count: number }>('SELECT count(*) as count FROM users WHERE role = ?', ['admin'])?.count || 0;
        if (adminCount <= 1) {
          res.status(400).json({ error: 'De laatste beheerder kan niet worden verwijderd.' });
          return;
        }
      }

      if (req.user?.userId === id) {
        res.status(400).json({ error: 'U kunt uw eigen ingelogde account niet verwijderen.' });
        return;
      }

      db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [id]);
      db.run('DELETE FROM api_keys WHERE user_id = ?', [id]);
      db.run('DELETE FROM users WHERE id = ?', [id]);

      res.json({ success: true, message: 'Gebruiker succesvol verwijderd' });
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Delete user error');
      res.status(500).json({ error: err?.message || 'Gebruiker verwijderen mislukt' });
    }
  }
}


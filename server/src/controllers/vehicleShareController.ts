import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { getVehicleAccess } from '../utils/vehicleAccess.js';

export class VehicleShareController {
  public static async getShares(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const access = getVehicleAccess(id, currentUserId, req.user?.role);

      if (!access.isOwner && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Alleen de eigenaar kan gedeelde gebruikers inzien' });
        return;
      }

      const shares = db.query<any>(
        `SELECT vs.id, vs.vehicle_id, vs.user_id, vs.role, vs.created_at, u.email
         FROM vehicle_shares vs
         JOIN users u ON u.id = vs.user_id
         WHERE vs.vehicle_id = ?
         ORDER BY vs.created_at ASC`,
        [id]
      );

      res.json({ shares });
    } catch (err: any) {
      console.error('Get vehicle shares error:', err);
      res.status(500).json({ error: 'Gedeelde gebruikers ophalen mislukt' });
    }
  }

  public static async addShare(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const access = getVehicleAccess(id, currentUserId, req.user?.role);

      if (!access.isOwner && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Alleen de eigenaar kan dit voertuig delen' });
        return;
      }

      const rawEmail = req.body.email || req.body.targetUserEmail;
      if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
        res.status(400).json({ error: 'Een geldig e-mailadres is verplicht' });
        return;
      }

      const cleanEmail = rawEmail.trim().toLowerCase();
      let targetUser = db.get<any>('SELECT id, email FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      let isNewUser = false;

      // If user does not exist yet, auto-provision user so sharing never fails!
      if (!targetUser) {
        const newUserId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.run(
          'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [newUserId, cleanEmail, 'invited_user_placeholder', 'user', now, now]
        );
        targetUser = { id: newUserId, email: cleanEmail };
        isNewUser = true;
      }

      if (targetUser.id === access.vehicle?.user_id) {
        res.status(400).json({ error: 'Dit voertuig is al eigendom van deze gebruiker' });
        return;
      }

      const validRoles = ['editor', 'viewer'];
      const targetRole = validRoles.includes(req.body.role) ? req.body.role : 'editor';

      const shareId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.run(
        `INSERT INTO vehicle_shares (id, vehicle_id, user_id, role, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(vehicle_id, user_id) DO UPDATE SET role = excluded.role`,
        [shareId, id, targetUser.id, targetRole, now]
      );

      const host = req.get('host') || 'localhost';
      const protocol = req.protocol || 'http';
      const inviteLink = `${protocol}://${host}/login?invite=${targetUser.id}`;

      res.status(201).json({
        message: isNewUser
          ? `Account aangemaakt en voertuig succesvol gedeeld met ${targetUser.email}`
          : `Voertuig succesvol gedeeld met ${targetUser.email}`,
        isNewUser,
        inviteLink,
        share: {
          id: shareId,
          vehicle_id: id,
          user_id: targetUser.id,
          email: targetUser.email,
          role: targetRole,
          created_at: now,
        },
      });
    } catch (err: any) {
      console.error('Add vehicle share error:', err);
      res.status(500).json({ error: err?.message || 'Voertuig delen mislukt' });
    }
  }

  public static async removeShare(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.user?.userId;
      const access = getVehicleAccess(id, currentUserId, req.user?.role);

      if (!access.isOwner && req.user?.role !== 'admin' && currentUserId !== targetUserId) {
        res.status(403).json({ error: 'Alleen de eigenaar kan toegang intrekken' });
        return;
      }

      db.run('DELETE FROM vehicle_shares WHERE vehicle_id = ? AND user_id = ?', [id, targetUserId]);
      res.json({ message: 'Toegang succesvol ingetrokken' });
    } catch (err: any) {
      console.error('Remove vehicle share error:', err);
      res.status(500).json({ error: 'Toegang intrekken mislukt' });
    }
  }

  public static async listShareableUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.userId;
      const users = db.query<{ id: string; email: string }>(
        'SELECT id, email FROM users WHERE id != ? ORDER BY email ASC',
        [currentUserId || '']
      );
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: 'Lijst van gebruikers ophalen mislukt' });
    }
  }
}


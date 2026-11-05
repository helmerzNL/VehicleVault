import { Request, Response } from 'express';
import { TelematicsService } from '../services/telematicsService.js';
import { db } from '../db/database.js';

export class TelematicsController {
  public static getConfig(req: Request, res: Response): void {
    try {
      const config = TelematicsService.getHaConfig(req.user?.userId);
      res.json({
        configured: Boolean(config.baseUrl && config.token),
        ha_base_url: config.baseUrl,
        has_token: Boolean(config.token),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Kon telematica-instellingen niet ophalen' });
    }
  }

  public static saveConfig(req: Request, res: Response): void {
    try {
      const { ha_base_url, ha_access_token } = req.body;
      if (typeof ha_base_url !== 'string') {
        res.status(400).json({ error: 'ha_base_url is verplicht' });
        return;
      }

      // Save per-user configuration (or global if unauthenticated/cli)
      TelematicsService.saveHaConfig(ha_base_url, ha_access_token, req.user?.userId);
      res.json({ success: true, message: 'Home Assistant instellingen opgeslagen' });
    } catch (err: any) {
      res.status(500).json({ error: 'Kon instellingen niet opslaan' });
    }
  }

  public static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const result = await TelematicsService.testHaConnection(req.user?.userId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Verbindingstest mislukt' });
    }
  }

  public static async listSensors(req: Request, res: Response): Promise<void> {
    try {
      const sensors = await TelematicsService.getHaSensors(req.user?.userId);
      res.json({ sensors });
    } catch (err: any) {
      res.status(500).json({ error: 'Kon sensoren niet ophalen uit Home Assistant' });
    }
  }

  public static async syncVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;

      // Verify user has access to this vehicle
      const vehicle = userId
        ? db.get<any>(
            `SELECT * FROM vehicles WHERE id = ? AND (user_id = ? OR id IN (SELECT vehicle_id FROM vehicle_shares WHERE user_id = ? AND role = 'editor'))`,
            [vehicleId, userId, userId]
          )
        : db.get<any>('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);

      if (!vehicle) {
        res.status(404).json({ error: 'Voertuig niet gevonden of geen bewerkrechten' });
        return;
      }

      const result = await TelematicsService.syncVehicleOdometer(vehicleId);
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Synchronisatie mislukt' });
    }
  }

  public static async syncAll(req: Request, res: Response): Promise<void> {
    try {
      const forUserId = req.user?.role === 'admin' && req.query.all === 'true' ? undefined : req.user?.userId;
      const result = await TelematicsService.syncAllVehicles(forUserId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Batch synchronisatie mislukt' });
    }
  }
}


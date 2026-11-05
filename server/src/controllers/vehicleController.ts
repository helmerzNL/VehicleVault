import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { RdwService } from '../services/rdwService.js';
import { CalendarService } from '../services/calendarService.js';
import { getVehicleAccess } from '../utils/vehicleAccess.js';
import { vehicleSchema, enrichVehicle } from './vehicles/vehicleHelpers.js';
import { executeVehicleCreate, executeVehicleUpdate } from './vehicles/vehicleMutations.js';
import { VehicleShareController } from './vehicleShareController.js';

export class VehicleController {
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string;
      const userId = req.user?.userId;
      const showAll = req.query.all === 'true' && req.user?.role === 'admin';

      let sql = `
        SELECT v.*, 
          u.email as owner_email,
          CASE WHEN v.user_id = ? THEN 1 ELSE 0 END as is_owner,
          CASE WHEN v.user_id = ? THEN 'owner' ELSE COALESCE(vs.role, 'editor') END as access_role,
          MAX(COALESCE(f.max_f, 0), COALESCE(s.max_s, 0), COALESCE(o.max_o, 0), v.initial_odometer) as current_odometer,
          sc.is_active as is_showcase_active,
          sc.public_slug as showcase_slug
        FROM vehicles v
        LEFT JOIN users u ON u.id = v.user_id
        LEFT JOIN vehicle_shares vs ON vs.vehicle_id = v.id AND vs.user_id = ?
        LEFT JOIN vehicle_showcases sc ON sc.vehicle_id = v.id
        LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_f FROM fuel_entries GROUP BY vehicle_id) f ON f.vehicle_id = v.id
        LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_s FROM service_records GROUP BY vehicle_id) s ON s.vehicle_id = v.id
        LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_o FROM odometer_logs GROUP BY vehicle_id) o ON o.vehicle_id = v.id
        WHERE (${showAll ? '1=1' : '(v.user_id = ? OR vs.user_id = ?)'})
      `;
      const params: any[] = [userId, userId, userId];
      if (!showAll) {
        params.push(userId, userId);
      }

      if (status && status !== 'all') {
        sql += ' AND v.status = ?';
        params.push(status);
      }

      sql += ' GROUP BY v.id ORDER BY v.created_at DESC';
      const vehicles = db.query(sql, params);

      res.json({ vehicles: vehicles.map(enrichVehicle) });
    } catch (err: any) {
      console.error('List vehicles error:', err);
      res.status(500).json({ error: 'Failed to list vehicles' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const access = getVehicleAccess(id, userId, req.user?.role);

      if (!access.hasAccess && req.user?.role !== 'admin') {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      const vehicle = db.get<any>(
        `SELECT v.*, 
          u.email as owner_email,
          CASE WHEN v.user_id = ? THEN 1 ELSE 0 END as is_owner,
          CASE WHEN v.user_id = ? THEN 'owner' ELSE COALESCE(vs.role, 'editor') END as access_role,
          MAX(COALESCE(f.max_f, 0), COALESCE(s.max_s, 0), COALESCE(o.max_o, 0), v.initial_odometer) as current_odometer,
          sc.is_active as is_showcase_active,
          sc.public_slug as showcase_slug
         FROM vehicles v
         LEFT JOIN users u ON u.id = v.user_id
         LEFT JOIN vehicle_shares vs ON vs.vehicle_id = v.id AND vs.user_id = ?
         LEFT JOIN vehicle_showcases sc ON sc.vehicle_id = v.id
         LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_f FROM fuel_entries GROUP BY vehicle_id) f ON f.vehicle_id = v.id
         LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_s FROM service_records GROUP BY vehicle_id) s ON s.vehicle_id = v.id
         LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_o FROM odometer_logs GROUP BY vehicle_id) o ON o.vehicle_id = v.id
         WHERE v.id = ?
         GROUP BY v.id`,
        [userId, userId, userId, id]
      );

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      res.json({ vehicle: enrichVehicle(vehicle) });
    } catch (err: any) {
      console.error('Get vehicle error:', err);
      res.status(500).json({ error: 'Failed to get vehicle' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const parse = vehicleSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const id = await executeVehicleCreate(req.user?.userId, parse.data);
      res.status(201).json({ id, message: 'Vehicle created successfully' });
    } catch (err: any) {
      console.error('Create vehicle error:', err);
      res.status(500).json({ error: err?.message || 'Failed to create vehicle' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parse = vehicleSchema.partial().safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: parse.error.issues[0].message });
        return;
      }

      const access = getVehicleAccess(id, req.user?.userId, req.user?.role);
      if (!access.hasAccess || (!access.isOwner && access.role !== 'editor')) {
        res.status(403).json({ error: 'Geen bewerkrechten voor dit voertuig' });
        return;
      }

      executeVehicleUpdate(id, access.vehicle, parse.data);
      res.json({ success: true, message: 'Vehicle updated' });
    } catch (err: any) {
      console.error('Update vehicle error:', err);
      res.status(500).json({ error: err?.message || 'Failed to update vehicle' });
    }
  }

  public static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded' });
        return;
      }

      const access = getVehicleAccess(id, req.user?.userId, req.user?.role);
      if (!access.hasAccess || (!access.isOwner && access.role !== 'editor')) {
        res.status(403).json({ error: 'Geen bewerkrechten voor dit voertuig' });
        return;
      }

      const imageFilename = req.file.filename;
      db.run('UPDATE vehicles SET image_path = ?, updated_at = ? WHERE id = ?', [
        imageFilename,
        new Date().toISOString(),
        id,
      ]);

      res.json({ success: true, imagePath: imageFilename, message: 'Vehicle image uploaded successfully' });
    } catch (err: any) {
      console.error('Upload vehicle image error:', err);
      res.status(500).json({ error: err?.message || 'Failed to upload image' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const access = getVehicleAccess(id, req.user?.userId, req.user?.role);
      if (!access.isOwner && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Alleen de eigenaar kan dit voertuig verwijderen' });
        return;
      }

      db.run('DELETE FROM vehicles WHERE id = ?', [id]);
      res.json({ success: true, message: 'Vehicle deleted' });
    } catch (err: any) {
      console.error('Delete vehicle error:', err);
      res.status(500).json({ error: err?.message || 'Failed to delete vehicle' });
    }
  }

  public static async rdwLookup(req: Request, res: Response): Promise<void> {
    try {
      const { plate } = req.params;
      const rdw = await RdwService.fetchVehicleByPlate(plate);
      if (!rdw) {
        res.status(404).json({ error: 'No vehicle found in RDW registry for this license plate' });
        return;
      }
      res.json({ rdw });
    } catch (err: any) {
      console.error('RDW lookup error:', err);
      res.status(500).json({ error: err?.message || 'RDW lookup failed' });
    }
  }

  public static async syncApk(_req: Request, res: Response): Promise<void> {
    try {
      const result = await RdwService.syncAllVehiclesApk();
      res.json(result);
    } catch (err: any) {
      console.error('Sync APK error:', err);
      res.status(500).json({ error: err?.message || 'Sync APK failed' });
    }
  }

  public static exportIcs(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const icsData = CalendarService.generateIcs(id || undefined, req.user?.userId);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="vehiclevault-${id || 'fleet'}.ics"`);
      res.send(icsData);
    } catch (err: any) {
      console.error('Export ICS error:', err);
      res.status(500).json({ error: 'Failed to generate calendar export' });
    }
  }

  // Delegated vehicle share operations
  public static getShares = VehicleShareController.getShares;
  public static addShare = VehicleShareController.addShare;
  public static removeShare = VehicleShareController.removeShare;
}

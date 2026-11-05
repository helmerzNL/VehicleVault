import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { RdwService } from '../../services/rdwService.js';

export const vehicleSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['car', 'motorcycle', 'trailer', 'van']).default('car'),
  license_plate: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  fuel_type: z.string().optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  purchase_price: z.number().nonnegative().default(0),
  initial_odometer: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'archived']).default('active'),
  apk_expiration_date: z.string().optional().nullable(),
  plate_country: z.enum(['NL', 'BE', 'DE', 'EU', 'OTHER']).default('NL'),
  image_path: z.string().optional().nullable(),
  notifications_enabled: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)).optional(),
  maintenance_notifications_enabled: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)).optional(),
  apk_notifications_enabled: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)).optional(),
  tire_swap_notifications_enabled: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)).optional(),
  tire_tread_notifications_enabled: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)).optional(),
  telematics_enabled: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)).optional(),
  telematics_provider: z.string().default('home_assistant'),
  telematics_ha_entity_id: z.string().optional().nullable(),
});

export function enrichVehicle(v: any) {
  const apk = RdwService.evaluateApkStatus(v.apk_expiration_date);
  return {
    ...v,
    is_owner: Boolean(v.is_owner),
    is_showcase_active: v.is_showcase_active === 1,
    showcase_slug: v.showcase_slug || undefined,
    notifications_enabled: v.notifications_enabled !== 0,
    maintenance_notifications_enabled: v.maintenance_notifications_enabled !== 0,
    apk_notifications_enabled: v.apk_notifications_enabled !== 0,
    tire_swap_notifications_enabled: v.tire_swap_notifications_enabled !== 0,
    tire_tread_notifications_enabled: v.tire_tread_notifications_enabled !== 0,
    telematics_enabled: v.telematics_enabled === 1,
    apk_status: apk,
  };
}

export function createDefaultIntervals(vehicleId: string, purchaseDate: string | null, initialOdometer: number) {
  const categories = db.query<any>('SELECT * FROM service_categories WHERE is_preset = 1');
  const now = new Date().toISOString();
  for (const cat of categories) {
    db.run(
      `INSERT INTO maintenance_intervals (
        id, vehicle_id, category_id, custom_name, interval_km, interval_months,
        last_service_date, last_service_odometer, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        vehicleId,
        cat.id,
        cat.name,
        cat.default_distance_interval,
        cat.default_time_months,
        purchaseDate || now.split('T')[0],
        initialOdometer,
        now,
      ]
    );
  }
}


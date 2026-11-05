import crypto from 'node:crypto';
import { db } from '../../db/database.js';
import { RdwService } from '../../services/rdwService.js';
import { createDefaultIntervals } from './vehicleHelpers.js';

export async function executeVehicleCreate(userId: string | undefined, data: any): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let rdwData: any = null;
  let apkDate = data.apk_expiration_date;
  const plateCountry = data.plate_country || 'NL';

  if (data.license_plate && plateCountry === 'NL') {
    const rdw = await RdwService.fetchVehicleByPlate(data.license_plate);
    if (rdw) {
      rdwData = rdw.raw;
      apkDate = apkDate || rdw.vervaldatum_apk;
      if (!data.make && rdw.merk) data.make = rdw.merk;
      if (!data.model && rdw.handelsbenaming) data.model = rdw.handelsbenaming;
      if (!data.fuel_type && rdw.brandstof_omschrijving) data.fuel_type = rdw.brandstof_omschrijving;
      if (!data.purchase_date && rdw.datum_tenaamstelling) data.purchase_date = rdw.datum_tenaamstelling;
    }
  }

  const notificationsEnabled = data.notifications_enabled !== undefined ? (data.notifications_enabled ? 1 : 0) : 1;
  const maintenanceNotificationsEnabled = data.maintenance_notifications_enabled !== undefined ? (data.maintenance_notifications_enabled ? 1 : 0) : 1;
  const apkNotificationsEnabled = data.apk_notifications_enabled !== undefined ? (data.apk_notifications_enabled ? 1 : 0) : 1;
  const tireSwapNotificationsEnabled = data.tire_swap_notifications_enabled !== undefined ? (data.tire_swap_notifications_enabled ? 1 : 0) : 1;
  const tireTreadNotificationsEnabled = data.tire_tread_notifications_enabled !== undefined ? (data.tire_tread_notifications_enabled ? 1 : 0) : 1;
  const telematicsEnabled = data.telematics_enabled ? 1 : 0;
  const telematicsProvider = data.telematics_provider || 'home_assistant';
  const telematicsHaEntityId = data.telematics_ha_entity_id ? data.telematics_ha_entity_id.trim() : null;

  db.run(
    `INSERT INTO vehicles (
      id, user_id, name, type, license_plate, vin, year, make, model,
      fuel_type, purchase_date, purchase_price, initial_odometer,
      notes, status, rdw_data, apk_expiration_date, plate_country, image_path,
      notifications_enabled, maintenance_notifications_enabled, apk_notifications_enabled,
      tire_swap_notifications_enabled, tire_tread_notifications_enabled,
      telematics_enabled, telematics_provider, telematics_ha_entity_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, userId, data.name, data.type,
      data.license_plate ? (plateCountry === 'NL' ? RdwService.normalizePlate(data.license_plate) : data.license_plate.trim().toUpperCase()) : null,
      data.vin || null, data.year || null, data.make || null, data.model || null,
      data.fuel_type || null, data.purchase_date || null, data.purchase_price, data.initial_odometer,
      data.notes || null, data.status, rdwData ? JSON.stringify(rdwData) : null, apkDate || null,
      plateCountry, data.image_path || null, notificationsEnabled, maintenanceNotificationsEnabled,
      apkNotificationsEnabled, tireSwapNotificationsEnabled, tireTreadNotificationsEnabled,
      telematicsEnabled, telematicsProvider, telematicsHaEntityId, now, now,
    ]
  );

  createDefaultIntervals(id, data.purchase_date || null, data.initial_odometer);
  return id;
}

export function executeVehicleUpdate(id: string, existing: any, data: any): void {
  const now = new Date().toISOString();
  const name = data.name !== undefined ? data.name : existing.name;
  const type = data.type !== undefined ? data.type : existing.type;
  const plate_country = data.plate_country !== undefined ? data.plate_country : (existing.plate_country || 'NL');
  const license_plate = data.license_plate !== undefined
    ? (data.license_plate ? (plate_country === 'NL' ? RdwService.normalizePlate(data.license_plate) : data.license_plate.trim().toUpperCase()) : null)
    : existing.license_plate;
  const vin = data.vin !== undefined ? data.vin : existing.vin;
  const year = data.year !== undefined ? data.year : existing.year;
  const make = data.make !== undefined ? data.make : existing.make;
  const model = data.model !== undefined ? data.model : existing.model;
  const fuel_type = data.fuel_type !== undefined ? data.fuel_type : existing.fuel_type;
  const purchase_date = data.purchase_date !== undefined ? data.purchase_date : existing.purchase_date;
  const purchase_price = data.purchase_price !== undefined ? data.purchase_price : existing.purchase_price;
  const initial_odometer = data.initial_odometer !== undefined ? data.initial_odometer : existing.initial_odometer;
  const notes = data.notes !== undefined ? data.notes : existing.notes;
  const status = data.status !== undefined ? data.status : existing.status;
  const apk_expiration_date = data.apk_expiration_date !== undefined ? data.apk_expiration_date : existing.apk_expiration_date;
  const image_path = data.image_path !== undefined ? data.image_path : existing.image_path;
  const notifications_enabled = data.notifications_enabled !== undefined ? (data.notifications_enabled ? 1 : 0) : (existing.notifications_enabled ?? 1);
  const maintenance_notifications_enabled = data.maintenance_notifications_enabled !== undefined ? (data.maintenance_notifications_enabled ? 1 : 0) : (existing.maintenance_notifications_enabled ?? 1);
  const apk_notifications_enabled = data.apk_notifications_enabled !== undefined ? (data.apk_notifications_enabled ? 1 : 0) : (existing.apk_notifications_enabled ?? 1);
  const tire_swap_notifications_enabled = data.tire_swap_notifications_enabled !== undefined ? (data.tire_swap_notifications_enabled ? 1 : 0) : (existing.tire_swap_notifications_enabled ?? 1);
  const tire_tread_notifications_enabled = data.tire_tread_notifications_enabled !== undefined ? (data.tire_tread_notifications_enabled ? 1 : 0) : (existing.tire_tread_notifications_enabled ?? 1);
  const telematics_enabled = data.telematics_enabled !== undefined ? (data.telematics_enabled ? 1 : 0) : (existing.telematics_enabled ?? 0);
  const telematics_provider = data.telematics_provider || existing.telematics_provider || 'home_assistant';
  const telematics_ha_entity_id = data.telematics_ha_entity_id !== undefined ? (data.telematics_ha_entity_id ? data.telematics_ha_entity_id.trim() : null) : (existing.telematics_ha_entity_id ?? null);

  db.run(
    `UPDATE vehicles SET
      name = ?, type = ?, license_plate = ?, vin = ?, year = ?, make = ?, model = ?,
      fuel_type = ?, purchase_date = ?, purchase_price = ?, initial_odometer = ?,
      notes = ?, status = ?, apk_expiration_date = ?, plate_country = ?, image_path = ?,
      notifications_enabled = ?, maintenance_notifications_enabled = ?, apk_notifications_enabled = ?,
      tire_swap_notifications_enabled = ?, tire_tread_notifications_enabled = ?,
      telematics_enabled = ?, telematics_provider = ?, telematics_ha_entity_id = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      name, type, license_plate, vin, year, make, model, fuel_type, purchase_date,
      purchase_price, initial_odometer, notes, status, apk_expiration_date,
      plate_country, image_path, notifications_enabled, maintenance_notifications_enabled,
      apk_notifications_enabled, tire_swap_notifications_enabled, tire_tread_notifications_enabled,
      telematics_enabled, telematics_provider, telematics_ha_entity_id, now, id,
    ]
  );
}


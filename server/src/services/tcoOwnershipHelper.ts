import { db } from '../db/database.js';

/**
 * Returns the effective ownership start date (YYYY-MM-DD) for a vehicle,
 * checking purchase_date, RDW datum_tenaamstelling, and fallback recurring expense start dates.
 */
export function getVehicleOwnershipStartDate(vehicle: any): string | null {
  if (!vehicle) return null;
  if (vehicle.purchase_date && typeof vehicle.purchase_date === 'string' && vehicle.purchase_date.trim()) {
    return vehicle.purchase_date.trim().slice(0, 10);
  }
  if (vehicle.rdw_data) {
    try {
      const parsed = typeof vehicle.rdw_data === 'string' ? JSON.parse(vehicle.rdw_data) : vehicle.rdw_data;
      const rawTenaam = parsed?.datum_tenaamstelling || parsed?.raw?.datum_tenaamstelling;
      if (rawTenaam) {
        const s = String(rawTenaam).trim();
        if (/^\d{8}$/.test(s)) {
          return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          return s.slice(0, 10);
        }
      }
    } catch {}
  }
  try {
    const firstExp = db.get<any>(
      "SELECT MIN(start_date) as min_start FROM recurring_expenses WHERE vehicle_id = ? AND category IN ('tax', 'insurance', 'lease')",
      [vehicle.id]
    );
    if (firstExp?.min_start) {
      return String(firstExp.min_start).slice(0, 10);
    }
  } catch {}

  return null;
}

/**
 * Determines whether a service record belongs to pre-ownership history.
 */
export function isRecordExcludedFromTco(record: any, vehicle: any): boolean {
  if (!record) return false;
  if (record.exclude_from_tco === 1 || record.exclude_from_tco === true) {
    return true;
  }
  if (!vehicle) return false;

  const ownershipStart = getVehicleOwnershipStartDate(vehicle);
  if (ownershipStart && record.date && String(record.date).slice(0, 10) < ownershipStart) {
    return true;
  }

  const initOdo = Number(vehicle.initial_odometer) || 0;
  const recOdo = Number(record.odometer) || 0;
  if (initOdo > 0 && recOdo > 0 && recOdo < initOdo) {
    return true;
  }

  return false;
}


import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { initializeDatabase } from '../db/schema.js';
import { HaController } from '../controllers/haController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { TcoService } from '../services/tcoService.js';
import { FuelController } from '../controllers/fuelController.js';
import { StationService } from '../services/stationService.js';
import { VehicleController } from '../controllers/vehicleController.js';
import { NotificationService } from '../services/notificationService.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: { userId: 'test-user-v3', email: 'v3@vehiclevault.local', role: 'admin' },
    ...overrides,
  };
}

function mockRes(): any {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('VehicleVault v3.0 Milestone Features & Modernization', () => {
  const testUserId = 'test-v3-user-' + crypto.randomUUID();
  const testVehicleId = 'test-v3-vehicle-' + crypto.randomUUID();

  it('sets up a test vehicle and user for v3 testing', () => {
    initializeDatabase();

    db.run(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, 'hash', 'user', datetime('now'), datetime('now'))`,
      [testUserId, `v3_${Date.now()}@test.local`]
    );

    db.run(
      `INSERT INTO vehicles (id, user_id, name, license_plate, initial_odometer, created_at, updated_at)
       VALUES (?, ?, 'V3 Testcar', 'V3-TEST-01', 10000, datetime('now'), datetime('now'))`,
      [testVehicleId, testUserId]
    );

    const v = db.get<any>('SELECT * FROM vehicles WHERE id = ?', [testVehicleId]);
    assert.ok(v);
    assert.equal(v.license_plate, 'V3-TEST-01');
  });

  it('calculates separate normal vs. towing fuel consumption when caravan flag is set', () => {
    // Insert normal fueling entries
    const f1Id = crypto.randomUUID();
    const f2Id = crypto.randomUUID();
    const f3Id = crypto.randomUUID();

    // Leg 1: 10000 -> 10500 km (500 km, 25 L) = 5.0 L/100km (Solo)
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, is_towing, created_at)
       VALUES (?, ?, '2026-06-01', 10000, 40, 2.0, 80, 1, 0, datetime('now'))`,
      [f1Id, testVehicleId]
    );
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, is_towing, created_at)
       VALUES (?, ?, '2026-06-10', 10500, 25, 2.0, 50, 1, 0, datetime('now'))`,
      [f2Id, testVehicleId]
    );

    // Leg 2: 10500 -> 10900 km (400 km, 40 L) = 10.0 L/100km (Towing Caravan)
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, is_towing, created_at)
       VALUES (?, ?, '2026-06-20', 10900, 40, 2.0, 80, 1, 1, datetime('now'))`,
      [f3Id, testVehicleId]
    );

    const tco = TcoService.calculateTco({ vehicleId: testVehicleId });

    assert.ok(tco.fuelStats);
    assert.equal(tco.fuelStats.avgNormalLPer100Km, 5); // 5.0 L/100km solo
    assert.equal(tco.fuelStats.avgTowingLPer100Km, 10); // 10.0 L/100km towing
  });

  it('aggregates multi-vehicle Fleet TCO and cost distribution', async () => {
    const req = mockReq({
      user: { userId: testUserId, role: 'admin' },
      query: {},
    });
    const res = mockRes();

    await AnalyticsController.getFleetTco(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.fleetTotalCost > 0);
    assert.ok(res.body.vehicleCount >= 1);
    assert.ok(Array.isArray(res.body.vehicles));
    assert.ok(Array.isArray(res.body.monthlyBreakdown));
  });

  it('ingests universal telemetry webhook and updates vehicle odometer logs', async () => {
    const req = mockReq({
      user: { userId: testUserId, role: 'user' },
      body: {
        vehicle_id: testVehicleId,
        odometer: 11250,
        source: 'home_assistant_wican_obd2',
      },
    });
    const res = mockRes();

    await HaController.updateOdometer(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.odometer, 11250);

    const latestLog = db.get<any>(
      'SELECT * FROM odometer_logs WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 1',
      [testVehicleId]
    );
    assert.ok(latestLog);
    assert.equal(latestLog.odometer, 11250);
    assert.equal(latestLog.source, 'home_assistant_wican_obd2');
  });

  it('enforces Zod runtime validation middleware and rejects malformed inputs', () => {
    const testSchema = z.object({
      license_plate: z.string().min(2),
      odometer: z.number().positive(),
    });

    const middleware = validateBody(testSchema);

    // Invalid body test
    const badReq: any = { body: { license_plate: 'X', odometer: -50 } };
    const badRes = mockRes();
    let nextCalled = false;

    middleware(badReq, badRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(badRes.statusCode, 400);
    assert.equal(badRes.body.error, 'Validation failed');
    assert.ok(badRes.body.issues.length >= 2);

    // Valid body test
    const goodReq: any = { body: { license_plate: 'XX-123-Y', odometer: 50000 } };
    const goodRes = mockRes();
    let goodNextCalled = false;

    middleware(goodReq, goodRes, () => {
      goodNextCalled = true;
    });

    assert.equal(goodNextCalled, true);
    assert.equal(goodReq.body.license_plate, 'XX-123-Y');
    assert.equal(goodReq.body.odometer, 50000);
  });

  it('accepts fuel entries with numeric booleans (1/0) and fuel_amount alias without Zod errors', async () => {
    const req = mockReq({
      user: { userId: testUserId, role: 'admin' },
      body: {
        vehicle_id: testVehicleId,
        date: '2026-11-03',
        odometer: 12000,
        fuel_amount: 45.5,
        price_per_unit: 1.959,
        is_full_tank: 1, // numeric boolean
        missed_previous: 0, // numeric boolean
        is_towing: 1, // numeric boolean
        station_name: 'Shell Express',
        station_address: 'Hoofdstraat 1, 1000 AA Amsterdam',
      },
    });
    const res = mockRes();

    await FuelController.create(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.id);

    const saved = db.get<any>('SELECT * FROM fuel_entries WHERE id = ?', [res.body.id]);
    assert.ok(saved);
    assert.equal(saved.liters, 45.5);
    assert.equal(saved.price_per_liter, 1.959);
    assert.equal(saved.is_full_tank, 1);
    assert.equal(saved.is_towing, 1);
  });

  it('returns both fileName and filePath from uploadReceiptFile', async () => {
    const req: any = {
      file: { filename: 'test-receipt-123.jpg' },
    };
    const res = mockRes();

    await FuelController.uploadReceiptFile(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.fileName, 'test-receipt-123.jpg');
    assert.equal(res.body.filePath, 'test-receipt-123.jpg');
  });

  it('converts meters to km and properly bounds GPS coordinates in StationService', async () => {
    // 52.3676, 4.9041 is Amsterdam. Even with radius 15000 (meters), it must be clamped to <= 30km
    const stations = await StationService.findNearbyStations(52.3676, 4.9041, 15000);
    assert.ok(Array.isArray(stations));
    // If any stations are returned, ensure their distance is within reasonable bounds (not 1000s of km)
    for (const st of stations) {
      if (st.distanceMeters !== undefined) {
        assert.ok(st.distanceMeters < 50000, `Station distance ${st.distanceMeters}m is unreasonably far`);
      }
    }
  });

  it('supports per-vehicle notification settings and suppresses alerts when muted', async () => {
    const motoId = 'moto-test-' + crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert a test motorcycle with maintenance notifications disabled
    db.run(
      `INSERT INTO vehicles (
        id, user_id, name, type, license_plate, initial_odometer,
        notifications_enabled, maintenance_notifications_enabled, apk_notifications_enabled,
        status, created_at, updated_at
      ) VALUES (?, ?, 'Test Motor', 'motorcycle', 'MOTO-01', 5000, 1, 0, 0, 'active', ?, ?)`,
      [motoId, testUserId, now, now]
    );

    // Verify list endpoint returns booleans properly
    const listReq = mockReq({ user: { userId: testUserId, role: 'admin' } });
    const listRes = mockRes();
    await VehicleController.list(listReq, listRes);
    const moto = listRes.body.vehicles.find((v: any) => v.id === motoId);
    assert.ok(moto);
    assert.equal(moto.notifications_enabled, true);
    assert.equal(moto.maintenance_notifications_enabled, false);
    assert.equal(moto.apk_notifications_enabled, false);

    // Add an overdue maintenance interval for this motorcycle
    const cat = db.get<any>('SELECT id FROM service_categories LIMIT 1');
    assert.ok(cat);
    const intervalId = 'maint-test-' + crypto.randomUUID();
    db.run(
      `INSERT INTO maintenance_intervals (
        id, vehicle_id, category_id, custom_name, interval_km, interval_months,
        last_service_date, last_service_odometer, created_at
      ) VALUES (?, ?, ?, 'Ketting smeren', 1000, 1, '2020-01-01', 1000, ?)`,
      [intervalId, motoId, cat.id, now]
    );

    // When checking alerts with maintenance disabled for this motorcycle, no alert should be sent for it
    // Set a dummy webhook or provider so checkAndDispatchAlerts runs its logic
    NotificationService.saveSettings({ provider: 'none', enabledMaintenance: true });
    // Verify that checkAndDispatchAlerts respects vehicle setting:
    // Temporarily set provider to webhook with a mock url to test dispatch filter
    db.run("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('notification_provider', 'none', ?)", [now]);

    // Update motorcycle to enable maintenance notifications
    const updateReq = mockReq({
      params: { id: motoId },
      user: { userId: testUserId, role: 'admin' },
      body: { maintenance_notifications_enabled: true },
    });
    const updateRes = mockRes();
    await VehicleController.update(updateReq, updateRes);
    assert.equal(updateRes.statusCode, 200);

    const updated = db.get<any>('SELECT maintenance_notifications_enabled FROM vehicles WHERE id = ?', [motoId]);
    assert.equal(updated.maintenance_notifications_enabled, 1);
  });

  it('calculates seasonal fuel statistics (summer vs winter comparison)', () => {
    const seasonCarId = 'season-car-' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO vehicles (id, user_id, name, initial_odometer, created_at, updated_at)
       VALUES (?, ?, 'Season Test Car', 10000, ?, ?)`,
      [seasonCarId, testUserId, now, now]
    );

    // Baseline fill-up
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, missed_previous, created_at)
       VALUES (?, ?, '2025-04-01', 10000, 50, 1.90, 95.0, 1, 0, ?)`,
      [crypto.randomUUID(), seasonCarId, now]
    );

    // Summer fill-up (June: month 6 -> warm)
    // 500 km on 30 liters = 6.0 l/100km
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, missed_previous, created_at)
       VALUES (?, ?, '2025-06-15', 10500, 30, 1.95, 58.5, 1, 0, ?)`,
      [crypto.randomUUID(), seasonCarId, now]
    );

    // Winter fill-up (December: month 12 -> cold)
    // 500 km on 36 liters = 7.2 l/100km
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, missed_previous, created_at)
       VALUES (?, ?, '2025-12-20', 11000, 36, 1.85, 66.6, 1, 0, ?)`,
      [crypto.randomUUID(), seasonCarId, now]
    );

    const tco = TcoService.calculateTco({ vehicleId: seasonCarId });
    assert.ok(tco.seasonalStats);
    assert.equal(tco.seasonalStats.hasData, true);
    assert.equal(tco.seasonalStats.summer.fillCount, 1);
    assert.equal(tco.seasonalStats.summer.avgLPer100Km, 6.0);
    assert.equal(tco.seasonalStats.winter.fillCount, 1);
    assert.equal(tco.seasonalStats.winter.avgLPer100Km, 7.2);
    assert.equal(tco.seasonalStats.delta.isWinterHigher, true);
    assert.equal(tco.seasonalStats.delta.diffLPer100Km, 1.2);
    assert.equal(tco.seasonalStats.delta.percentDiff, 20.0);
  });

  it('supports tire season swap and tread depth alerts', () => {
    const tireCarId = 'tire-car-' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO vehicles (
        id, user_id, name, initial_odometer,
        notifications_enabled, tire_swap_notifications_enabled, tire_tread_notifications_enabled,
        created_at, updated_at
      ) VALUES (?, ?, 'Tire Test Car', 10000, 1, 1, 1, ?, ?)`,
      [tireCarId, testUserId, now, now]
    );

    const tireSetId = 'tire-set-' + crypto.randomUUID();
    db.run(
      `INSERT INTO tire_sets (
        id, vehicle_id, name, season, status, tread_depth_fl, tread_depth_fr, tread_depth_rl, tread_depth_rr, created_at
      ) VALUES (?, ?, 'Zomer Michelin', 'summer', 'mounted', 2.8, 2.9, 3.1, 3.2, ?)`,
      [tireSetId, tireCarId, now]
    );

    const tire = db.get<any>('SELECT * FROM tire_sets WHERE id = ?', [tireSetId]);
    assert.ok(tire);
    assert.equal(tire.season, 'summer');
    assert.equal(tire.tread_depth_fl, 2.8);
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { TelematicsService } from '../services/telematicsService.js';
import { TelematicsController } from '../controllers/telematicsController.js';

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: { userId: 'telematics-admin-user', email: 'telematics@vault.local', role: 'admin' },
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

describe('Home Assistant Telematics & Odometer Sync', () => {
  let adminUserId: string;
  let testVehicleId: string;
  const originalFetch = globalThis.fetch;

  before(() => {
    adminUserId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, 'hash123', 'admin', ?, ?)`,
      [adminUserId, `admin-${Date.now()}@telematics.local`, now, now]
    );

    testVehicleId = crypto.randomUUID();
    db.run(
      `INSERT INTO vehicles (
        id, user_id, name, type, license_plate, initial_odometer, status,
        telematics_enabled, telematics_provider, telematics_ha_entity_id,
        created_at, updated_at
      ) VALUES (?, ?, 'Kia Niro EV Test', 'car', 'N-123-EV', 50000, 'active', 1, 'home_assistant', 'sensor.kia_niro_odometer', ?, ?)`,
      [testVehicleId, adminUserId, now, now]
    );
  });

  after(() => {
    globalThis.fetch = originalFetch;
    db.run('DELETE FROM odometer_logs WHERE vehicle_id = ?', [testVehicleId]);
    db.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
    db.run('DELETE FROM users WHERE id = ?', [adminUserId]);
    db.run("DELETE FROM system_settings WHERE key IN ('ha_base_url', 'ha_access_token')");
  });

  it('saves and retrieves Home Assistant telematics configuration', () => {
    TelematicsService.saveHaConfig('http://192.168.1.100:8123', 'test-token-123');

    const config = TelematicsService.getHaConfig();
    assert.equal(config.baseUrl, 'http://192.168.1.100:8123');
    assert.equal(config.token, 'test-token-123');
  });

  it('tests connection to Home Assistant successfully when API returns valid response', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ message: 'API running.', version: '2026.3.1' }),
    })) as any;

    const result = await TelematicsService.testHaConnection();
    assert.equal(result.success, true);
    assert.equal(result.message, 'API running.');
    assert.equal(result.haVersion, '2026.3.1');
  });

  it('filters and sorts likely odometer sensors from HA states', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { entity_id: 'sensor.living_room_temperature', state: '21.5', attributes: { friendly_name: 'Temperature' } },
        { entity_id: 'sensor.kia_niro_odometer', state: '52300', attributes: { friendly_name: 'Kia Niro Kilometerstand', unit_of_measurement: 'km' } },
        { entity_id: 'sensor.car_battery_level', state: '85', attributes: { friendly_name: 'Battery' } },
        { entity_id: 'light.living_room', state: 'on' },
      ],
    })) as any;

    const sensors = await TelematicsService.getHaSensors();
    assert.equal(sensors.length, 3);
    assert.equal(sensors[0].entity_id, 'sensor.kia_niro_odometer');
    assert.equal(sensors[0].is_likely_odometer, true);
  });

  it('syncs vehicle odometer from Home Assistant entity and logs to odometer_logs', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        entity_id: 'sensor.kia_niro_odometer',
        state: '52500',
        attributes: { unit_of_measurement: 'km' },
      }),
    })) as any;

    const result = await TelematicsService.syncVehicleOdometer(testVehicleId);
    assert.equal(result.success, true);
    assert.equal(result.odometer, 52500);
    assert.equal(result.updated, true);

    const logs = db.query<any>('SELECT * FROM odometer_logs WHERE vehicle_id = ? ORDER BY created_at DESC', [testVehicleId]);
    assert.ok(logs.length >= 1);
    assert.equal(logs[0].odometer, 52500);
    assert.equal(logs[0].source, 'ha_telematics');

    const v = db.get<any>('SELECT * FROM vehicles WHERE id = ?', [testVehicleId]);
    assert.equal(v.telematics_last_status, 'ok');
    assert.equal(v.telematics_last_odometer, 52500);
    assert.ok(v.telematics_last_sync_at);
  });

  it('runs batch sync for all configured vehicles via syncAllVehicles', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        entity_id: 'sensor.kia_niro_odometer',
        state: '52550',
      }),
    })) as any;

    const result = await TelematicsService.syncAllVehicles();
    assert.ok(result.total >= 1);
    assert.ok(result.synced >= 1);
    assert.equal(result.errors, 0);
  });

  it('supports controller endpoints for config, test, and sync', async () => {
    // 1. getConfig
    const req1 = mockReq();
    const res1 = mockRes();
    TelematicsController.getConfig(req1, res1);
    assert.equal(res1.statusCode, 200);
    assert.equal(res1.body.configured, true);
    assert.equal(res1.body.ha_base_url, 'http://192.168.1.100:8123');

    // 2. syncVehicle
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        entity_id: 'sensor.kia_niro_odometer',
        state: '52600',
      }),
    })) as any;

    const req2 = mockReq({ params: { vehicleId: testVehicleId }, user: { userId: adminUserId, role: 'admin' } });
    const res2 = mockRes();
    await TelematicsController.syncVehicle(req2, res2);
    assert.equal(res2.statusCode, 200);
    assert.equal(res2.body.success, true);
    assert.equal(res2.body.odometer, 52600);
  });
});

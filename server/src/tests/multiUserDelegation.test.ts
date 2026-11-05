import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/database.js';
import { initializeDatabase } from '../db/schema.js';
import { VehicleShareController } from '../controllers/vehicleShareController.js';
import { UserManagementController } from '../controllers/auth/userManagementController.js';
import { TelematicsService } from '../services/telematicsService.js';
import { HaService } from '../services/haService.js';
import { getVehicleAccess } from '../utils/vehicleAccess.js';

describe('Multi-User Delegation & Super-Admin Capabilities', () => {
  const adminId = 'delegation-admin-1';
  const fatherInLawId = 'delegation-father-1';
  const fatherVehicleId = 'delegation-car-1';

  before(() => {
    initializeDatabase();
    db.run('DELETE FROM vehicle_shares WHERE vehicle_id = ?', [fatherVehicleId]);
    db.run('DELETE FROM vehicles WHERE id = ?', [fatherVehicleId]);
    db.run('DELETE FROM users WHERE email LIKE ?', ['%@delegation.test']);

    const now = new Date().toISOString();

    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [adminId, 'admin@delegation.test', 'hash', 'admin', now, now]
    );
    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [fatherInLawId, 'father@delegation.test', 'hash', 'user', now, now]
    );

    db.run(
      `INSERT INTO vehicles (
        id, user_id, name, type, license_plate, initial_odometer, purchase_price, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fatherVehicleId, fatherInLawId, 'Volvo V60 Schoonvader', 'car', 'AA-123-BB', 150000, 20000, 'active', now, now]
    );
  });

  it('allows vehicle owner to share vehicle with non-existent user and auto-provisions user with invite link', async () => {
    const wifeEmail = 'wife_new_invite@delegation.test';
    const req: any = {
      params: { id: fatherVehicleId },
      user: { userId: fatherInLawId, role: 'user' },
      body: {
        email: wifeEmail,
        role: 'editor',
      },
      get: () => 'localhost:3084',
      protocol: 'http',
    };

    let statusCode = 0;
    let jsonResult: any = null;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    };

    await VehicleShareController.addShare(req, res);

    assert.equal(statusCode, 201);
    assert.equal(jsonResult.isNewUser, true);
    assert.ok(jsonResult.inviteLink.includes('/login?invite='));

    const createdUser = db.get<any>('SELECT * FROM users WHERE email = ?', [wifeEmail]);
    assert.ok(createdUser, 'User account should be auto-created');
    assert.equal(createdUser.role, 'user');

    const shareRecord = db.get<any>('SELECT * FROM vehicle_shares WHERE vehicle_id = ? AND user_id = ?', [
      fatherVehicleId,
      createdUser.id,
    ]);
    assert.ok(shareRecord, 'Vehicle share record should be inserted');
    assert.equal(shareRecord.role, 'editor');
  });

  it('allows super-admin to have access to any vehicle across the instance', () => {
    const adminAccess = getVehicleAccess(fatherVehicleId, adminId, 'admin');
    assert.equal(adminAccess.hasAccess, true, 'Super-admin must have access');
    assert.equal(adminAccess.role, 'owner', 'Super-admin has full management rights');
  });

  it('scopes Home Assistant sensors payload strictly to user owned and shared vehicles', () => {
    const fatherSensors = HaService.getSensorsPayload(fatherInLawId);
    assert.equal(fatherSensors.total_vehicles, 1);
    assert.equal(fatherSensors.vehicles[0].name, 'Volvo V60 Schoonvader');

    const randomUserId = 'unrelated-user-999';
    const unrelatedSensors = HaService.getSensorsPayload(randomUserId);
    assert.equal(unrelatedSensors.total_vehicles, 0);
  });

  it('allows non-admin user to configure and isolate their own Home Assistant credentials', () => {
    TelematicsService.saveHaConfig('https://ha.fatherinlaw.local', 'token_father_123', fatherInLawId);

    const fatherConfig = TelematicsService.getHaConfig(fatherInLawId);
    assert.equal(fatherConfig.baseUrl, 'https://ha.fatherinlaw.local');
    assert.equal(fatherConfig.token, 'token_father_123');

    // Other users don't get polluted by father-in-law's config
    const otherUserConfig = TelematicsService.getHaConfig('other-user-999');
    assert.notEqual(otherUserConfig.baseUrl, 'https://ha.fatherinlaw.local');
  });

  it('allows super-admin to update user role from user to admin and vice versa', async () => {
    const req: any = {
      params: { id: fatherInLawId },
      body: { role: 'admin' },
    };
    let jsonResult: any = null;
    const res: any = {
      json: (d: any) => {
        jsonResult = d;
        return res;
      },
      status: () => res,
    };

    await UserManagementController.updateUserRole(req, res);
    assert.equal(jsonResult.success, true);
    assert.equal(jsonResult.user.role, 'admin');

    const updated = db.get<any>('SELECT role FROM users WHERE id = ?', [fatherInLawId]);
    assert.equal(updated.role, 'admin');
  });
});

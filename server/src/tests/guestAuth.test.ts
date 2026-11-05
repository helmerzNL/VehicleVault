import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { initializeDatabase } from '../db/schema.js';
import { GuestAuthController } from '../controllers/auth/guestAuthController.js';
import { setSystemSetting } from '../services/ai/aiSettings.js';
import { comparePassword } from '../utils/token.js';

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    cookies: {} as Record<string, any>,
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: unknown) => {
    res.body = data;
    return res;
  };
  res.cookie = (name: string, val: string, opts: any) => {
    res.cookies[name] = { val, opts };
    return res;
  };
  return res;
}

function mockReq(extra: Record<string, unknown> = {}) {
  return {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1',
    cookies: {},
    query: {},
    body: {},
    path: '',
    method: 'POST',
    ...extra,
  } as any;
}

describe('Guest / Trial Mode Authentication Engine', () => {
  before(() => {
    initializeDatabase();
    setSystemSetting('allow_guest_access', 'true');
  });

  after(() => {
    setSystemSetting('allow_guest_access', 'true');
  });

  it('provisions an isolated 1-click guest user with role user and is_guest=1', async () => {
    const req = mockReq();
    const res = mockRes();

    await GuestAuthController.guestLogin(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.user);
    assert.equal(res.body.isGuest, true);
    assert.match(res.body.user.email, /^gast_[a-f0-9]+@proef\.local$/);

    const guestId = res.body.user.id;
    const dbRecord = db.get<any>('SELECT * FROM users WHERE id = ?', [guestId]);
    assert.ok(dbRecord);
    assert.equal(dbRecord.is_guest, 1);
    assert.equal(dbRecord.role, 'user');
    assert.ok(res.cookies.refresh_token);
  });

  it('rejects guest login when allow_guest_access setting is false', async () => {
    setSystemSetting('allow_guest_access', 'false');

    const req = mockReq();
    const res = mockRes();

    await GuestAuthController.guestLogin(req, res);

    assert.equal(res.statusCode, 403);
    assert.match(res.body.error, /uitgeschakeld/i);

    // Restore setting
    setSystemSetting('allow_guest_access', 'true');
  });

  it('converts a guest user to a permanent account with valid email & password', async () => {
    // 1. Create guest
    const req1 = mockReq();
    const res1 = mockRes();
    await GuestAuthController.guestLogin(req1, res1);
    const guestUser = res1.body.user;

    // 2. Convert guest
    const newEmail = `permanent_${crypto.randomBytes(3).toString('hex')}@test.com`;
    const newPass = 'SuperSecret123!';
    const reqConvert = mockReq({
      user: { userId: guestUser.id, email: guestUser.email, role: 'user' },
      body: { email: newEmail, password: newPass },
    });
    const resConvert = mockRes();

    await GuestAuthController.convertGuest(reqConvert, resConvert);

    assert.equal(resConvert.statusCode, 200);
    assert.equal(resConvert.body.success, true);
    assert.equal(resConvert.body.user.email, newEmail);
    assert.equal(resConvert.body.user.isGuest, false);

    // Check DB record
    const updated = db.get<any>('SELECT * FROM users WHERE id = ?', [guestUser.id]);
    assert.equal(updated.email, newEmail);
    assert.equal(updated.is_guest, 0);

    const passwordMatches = await comparePassword(newPass, updated.password_hash);
    assert.equal(passwordMatches, true);
  });

  it('rejects guest conversion if email is already taken', async () => {
    // Create guest
    const req1 = mockReq();
    const res1 = mockRes();
    await GuestAuthController.guestLogin(req1, res1);
    const guestUser = res1.body.user;

    // Create an existing other user
    const existingEmail = `existing_${crypto.randomBytes(3).toString('hex')}@test.com`;
    db.run(
      'INSERT INTO users (id, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
      [crypto.randomUUID(), existingEmail, 'hash', 'user', new Date().toISOString(), new Date().toISOString()]
    );

    const reqConvert = mockReq({
      user: { userId: guestUser.id, email: guestUser.email, role: 'user' },
      body: { email: existingEmail, password: 'StrongPassword123!' },
    });
    const resConvert = mockRes();

    await GuestAuthController.convertGuest(reqConvert, resConvert);

    assert.equal(resConvert.statusCode, 409);
    assert.match(resConvert.body.error, /bestaat al/i);
  });

  it('rejects guest conversion for already permanent user', async () => {
    const permId = crypto.randomUUID();
    const permEmail = `perm_${crypto.randomBytes(3).toString('hex')}@test.com`;
    db.run(
      'INSERT INTO users (id, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
      [permId, permEmail, 'hash', 'user', new Date().toISOString(), new Date().toISOString()]
    );

    const reqConvert = mockReq({
      user: { userId: permId, email: permEmail, role: 'user' },
      body: { email: 'another@test.com', password: 'StrongPassword123!' },
    });
    const resConvert = mockRes();

    await GuestAuthController.convertGuest(reqConvert, resConvert);

    assert.equal(resConvert.statusCode, 400);
    assert.match(resConvert.body.error, /al een permanent account/i);
  });
});


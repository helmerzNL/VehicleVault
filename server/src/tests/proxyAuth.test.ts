import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { initializeDatabase } from '../db/schema.js';
import { isProxyAuthEnabled, isTrustedProxy, getProxyUser } from '../middleware/proxyAuth.js';

function mockReq(extra: Record<string, any> = {}) {
  return {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1',
    method: 'GET',
    ...extra,
  } as any;
}

describe('Reverse Proxy Authentication & SSO Hardening', () => {
  before(() => {
    initializeDatabase();
  });

  it('isProxyAuthEnabled() must be FALSE by default (no spoofable open headers)', () => {
    delete process.env.TRUST_PROXY_HEADERS;
    delete process.env.ENABLE_PROXY_AUTH;
    db.run('DELETE FROM system_settings WHERE key = ?', ['enable_proxy_auth']);

    assert.equal(isProxyAuthEnabled(), false, 'Proxy auth must default to false for security');
  });

  it('rejects spoofed proxy headers when proxy auth is disabled', () => {
    delete process.env.TRUST_PROXY_HEADERS;
    delete process.env.ENABLE_PROXY_AUTH;
    db.run('DELETE FROM system_settings WHERE key = ?', ['enable_proxy_auth']);

    const req = mockReq({
      headers: {
        'remote-email': 'admin@victim.com',
      },
    });

    const user = getProxyUser(req);
    assert.equal(user, null, 'Must ignore remote-email headers when proxy auth is disabled');
  });

  it('rejects proxy headers from untrusted upstream IPs even if proxy auth is enabled', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    const untrustedReq = mockReq({
      socket: { remoteAddress: '203.0.113.195' }, // Public internet IP
      ip: '203.0.113.195',
      headers: {
        'remote-email': 'admin@victim.com',
      },
    });

    assert.equal(isTrustedProxy(untrustedReq), false);
    const user = getProxyUser(untrustedReq);
    assert.equal(user, null, 'Must reject proxy headers arriving from public untrusted IP');
    delete process.env.TRUST_PROXY_HEADERS;
  });

  it('accepts proxy headers from trusted upstream (loopback / private subnet) when explicitly enabled', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    const trustedReq = mockReq({
      socket: { remoteAddress: '127.0.0.1' },
      ip: '127.0.0.1',
      headers: {
        'remote-email': 'trusted-proxy-user@example.com',
      },
    });

    assert.equal(isTrustedProxy(trustedReq), true);
    const user = getProxyUser(trustedReq);
    assert.ok(user);
    assert.equal(user.email, 'trusted-proxy-user@example.com');
    delete process.env.TRUST_PROXY_HEADERS;

    db.run('DELETE FROM users WHERE email = ?', ['trusted-proxy-user@example.com']);
  });

  it('prioritizes database setting so UI toggle can turn proxy auth OFF even if env has ENABLE_PROXY_AUTH=true', () => {
    process.env.ENABLE_PROXY_AUTH = 'true';
    db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
      'enable_proxy_auth',
      'false',
      new Date().toISOString(),
    ]);

    assert.equal(isProxyAuthEnabled(), false, 'Database setting false must override env ENABLE_PROXY_AUTH=true');

    db.run('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
      'enable_proxy_auth',
      'true',
      new Date().toISOString(),
    ]);
    assert.equal(isProxyAuthEnabled(), true, 'Database setting true must enable proxy auth');

    db.run('DELETE FROM system_settings WHERE key = ?', ['enable_proxy_auth']);
    delete process.env.ENABLE_PROXY_AUTH;
  });

  it('matches user by username prefix from remote-user if remote-email is absent', () => {
    const testEmail = 'rob@romanas.nl';
    const existing = db.get<{ id: string }>('SELECT id FROM users WHERE email = ?', [testEmail]);
    const userId = existing?.id || crypto.randomUUID();
    if (!existing) {
      db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
        userId,
        testEmail,
        'hash',
        'admin',
        new Date().toISOString(),
        new Date().toISOString(),
      ]);
    }

    process.env.TRUST_PROXY_HEADERS = 'true';
    const req = mockReq({
      socket: { remoteAddress: '127.0.0.1' },
      ip: '127.0.0.1',
      headers: {
        'remote-user': 'rob',
      },
    });

    const user = getProxyUser(req);
    assert.ok(user);
    assert.equal(user.email, 'rob@romanas.nl');

    delete process.env.TRUST_PROXY_HEADERS;
    if (!existing) {
      db.run('DELETE FROM users WHERE id = ?', [userId]);
    }
  });
});


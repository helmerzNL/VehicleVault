import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

import { createApp } from '../app.js';
import { getChannel } from '../utils/channel.js';

const repoRoot = path.resolve(process.cwd(), process.cwd().endsWith('server') ? '..' : '.');

async function getJson(pathname: string): Promise<any> {
  const server = createApp().listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
    return await res.json();
  } finally {
    server.close();
  }
}

describe('Release channel (stable / beta)', () => {
  const original = process.env.VEHICLEVAULT_TAG;
  afterEach(() => {
    if (original === undefined) delete process.env.VEHICLEVAULT_TAG;
    else process.env.VEHICLEVAULT_TAG = original;
  });

  it('is beta only when the tag says so', () => {
    assert.equal(getChannel('beta'), 'beta');
    assert.equal(getChannel('Beta-3f2a1c'), 'beta');
    assert.equal(getChannel('latest'), 'stable');
    assert.equal(getChannel('2.0.0'), 'stable');
    assert.equal(getChannel(''), 'stable');
    assert.equal(getChannel(undefined), 'stable');
  });

  it('reports the channel next to the version, and differs between beta and stable', async () => {
    process.env.VEHICLEVAULT_TAG = 'beta';
    const beta = await getJson('/api/version');
    delete process.env.VEHICLEVAULT_TAG;
    const stable = await getJson('/api/version');

    assert.equal(beta.channel, 'beta');
    assert.equal(stable.channel, 'stable');
    assert.equal(beta.version, stable.version);

    // The version follows the server's package.json, so it cannot fall behind a release again
    const serverPkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'server', 'package.json'), 'utf8'));
    assert.equal(stable.version, serverPkg.version);

    process.env.VEHICLEVAULT_TAG = 'beta';
    assert.equal((await getJson('/healthz')).channel, 'beta');
  });

  it('keeps docker-compose.yml and .env.example in step on VEHICLEVAULT_TAG', () => {
    const compose = fs.readFileSync(path.join(repoRoot, 'docker-compose.yml'), 'utf8');
    const env = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');

    assert.match(compose, /image:\s*ghcr\.io\/[a-z0-9_.-]+\/[a-z0-9_.-]+:\$\{VEHICLEVAULT_TAG:-latest\}/);
    assert.match(compose, /-\s*VEHICLEVAULT_TAG=\$\{VEHICLEVAULT_TAG:-latest\}/);
    assert.match(env, /^VEHICLEVAULT_TAG=latest$/m);
  });
});

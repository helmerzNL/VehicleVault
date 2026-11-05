import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { orm } from '../db/drizzle.js';
import * as schema from '../db/schema.drizzle.js';
import { env } from '../config/env.js';

/**
 * Standard Better-Auth instance backed by Drizzle ORM and SQLite.
 * Provides battle-tested authentication, session management, and standard endpoints.
 */
export const auth = betterAuth({
  basePath: '/api/auth/v3',
  secret: process.env.BETTER_AUTH_SECRET || env.JWT_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${env.PORT}`,
  database: drizzleAdapter(orm, {
    provider: 'sqlite',
    schema: {
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});

import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { db as dbAccess } from './database.js';
import * as schema from './schema.drizzle.js';

/**
 * Type-safe Drizzle ORM instance wrapping VehicleVault's SQLite connection.
 * Guarantees zero extra native dependencies and complete compatibility with WAL mode.
 */
export const orm = drizzle(
  async (sql, params, method) => {
    try {
      if (method === 'all') {
        const rows = dbAccess.query(sql, params);
        return { rows: rows.map((r: any) => Object.values(r)) };
      } else if (method === 'get') {
        const row = dbAccess.get(sql, params);
        return { rows: row ? Object.values(row as any) : [] };
      } else {
        dbAccess.run(sql, params);
        return { rows: [] };
      }
    } catch (err: any) {
      console.error(`Drizzle ORM execution error on SQL "${sql.slice(0, 100)}":`, err?.message);
      throw err;
    }
  },
  { schema }
);

export { schema };


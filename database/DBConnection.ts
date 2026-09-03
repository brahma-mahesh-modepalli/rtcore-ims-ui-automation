/**
 * Database Connection
 * ====================
 * Owns the PostgreSQL connection pool for the framework. Reads configuration
 * from environment variables (via dotenv) and exposes a single, reusable
 * `executeQuery` method for the rest of the framework (TestDataRepository, etc.)
 * to run parameterized queries against.
 *
 * Conceptually:
 *   Test -> TestDataRepository -> DBConnection -> PostgreSQL Pool -> PostgreSQL DB
 *
 * IMPORTANT:
 *   - Never log process.env.DB_PASSWORD or any full connection string.
 *   - Always use parameterized queries ($1, $2, ...) - never string-concatenate
 *     user/test values into SQL.
 */

import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import { Reporting } from '../reporting/Reporting';

dotenv.config();

let pool: Pool | undefined;

/** Lazily create (and cache) the shared connection pool. */
function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT) || 5432;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error(
      'Database configuration is incomplete. Ensure DB_HOST, DB_NAME, DB_USER and ' +
        'DB_PASSWORD are set (see .env.example).',
    );
  }

  // Managed Postgres instances (e.g. Stage) typically require TLS; DB_SSL=false opts out for local DBs.
  const ssl =
    process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false };

  pool = new Pool({ host, port, database, user, password, ssl });

  pool.on('error', (err) => {
    // Unexpected error on an idle client - never log err which may include connection info.
    Reporting.error(`Database pool error: ${err.message}`);
  });

  Reporting.info(`Database pool created for host: ${host}:${port}/${database}`);

  return pool;
}

/**
 * Execute a parameterized SQL query using a pooled connection.
 * Connections are automatically returned to the pool by `pool.query`.
 *
 * @param query  SQL text with $1, $2, ... placeholders
 * @param values Values bound to the placeholders, in order
 */
export async function executeQuery<T>(
  query: string,
  values: unknown[] = [],
): Promise<T[]> {
  try {
    const result: QueryResult = await getPool().query(query, values);
    return result.rows as T[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Reporting.error(`Database query failed. Error: ${message}`);
    throw new Error(`Database query failed: ${message}`);
  }
}

/** Close the pool. Call once when a test run finishes (e.g. global teardown). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export const DBConnection = {
  executeQuery,
  closePool,
};

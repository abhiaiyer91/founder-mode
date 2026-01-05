/**
 * Database Connection - Drizzle + PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://founder:founder123@localhost:5432/founder_mode';

// Create postgres connection
const client = postgres(DATABASE_URL);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './schema';

// Check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

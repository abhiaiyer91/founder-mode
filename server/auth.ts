import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize SQLite database
const db = new Database(path.join(__dirname, '..', 'data', 'founder-mode.db'));

// Create the auth instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: {
    db,
    type: 'sqlite',
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // For dev simplicity
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3001',
  ],
  user: {
    additionalFields: {
      gameData: {
        type: 'string',
        required: false,
        defaultValue: null,
      },
    },
  },
});

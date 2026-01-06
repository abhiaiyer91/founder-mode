import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';

// Create the auth instance with Drizzle adapter
export const auth = betterAuth({
  database: drizzleAdapter(db, { 
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[],
});

// Helper to sync user to Convex after auth
export async function syncUserToConvex(
  convexUrl: string,
  user: { id: string; email: string; name: string }
) {
  try {
    // This would call a Convex HTTP action to sync the user
    // For now, we'll handle this on the client side
    console.log('User to sync to Convex:', user.email);
  } catch (error) {
    console.error('Failed to sync user to Convex:', error);
  }
}

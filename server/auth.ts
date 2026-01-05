import { betterAuth } from 'better-auth';

// Create the auth instance with Convex-compatible setup
// Note: better-auth will use its own session management
// We sync user data to Convex via the API
export const auth = betterAuth({
  // Use in-memory for sessions, sync to Convex for persistence
  database: {
    type: 'memory',
  },
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
  ],
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

import { createAuthClient } from 'better-auth/react';

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});

// Export hooks and utilities
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Types
export type Session = Awaited<ReturnType<typeof getSession>>;

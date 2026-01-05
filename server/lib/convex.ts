/**
 * Convex client for server-side operations
 * 
 * This module provides the Convex client that the API server uses
 * to persist game data.
 */

import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.warn('⚠️ CONVEX_URL not set. Database features will be disabled.');
}

// Create the Convex HTTP client for server-side use
export const convex = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;

export const isConvexConfigured = !!CONVEX_URL;

// Helper to check if Convex is available
export function requireConvex() {
  if (!convex) {
    throw new Error('Convex is not configured. Set CONVEX_URL environment variable.');
  }
  return convex;
}

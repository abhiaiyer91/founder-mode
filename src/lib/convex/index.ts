import { ConvexReactClient } from 'convex/react';

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  console.warn('VITE_CONVEX_URL not set. Convex features will be disabled. Using local storage only.');
}

export const convex = new ConvexReactClient(convexUrl || 'https://placeholder.convex.cloud');

export const isConvexConfigured = !!convexUrl;

// Re-export hooks
export { useGameSync, useGameSaves } from './useGameSync';

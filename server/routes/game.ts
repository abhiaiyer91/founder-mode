/**
 * Game API Routes
 * 
 * Handles all game state persistence operations:
 * - Save/Load games
 * - CRUD for employees and tasks
 * - Activity logging
 */

import { Router, type IRouter } from 'express';
import { isConvexConfigured } from '../lib/convex';

const router: IRouter = Router();

// Middleware to check Convex availability
router.use((_req, _res, next) => {
  if (!isConvexConfigured) {
    console.log('Convex not configured, using in-memory storage');
  }
  next();
});

// ============================================
// Game Saves
// ============================================

// List all saves for a user
router.get('/saves', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!isConvexConfigured) {
      return res.json({ saves: [] });
    }

    // TODO: Implement with Convex when configured
    res.json({ saves: [] });
  } catch (error) {
    console.error('Error listing saves:', error);
    res.status(500).json({ error: 'Failed to list saves' });
  }
});

// Get a specific save
router.get('/saves/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;

    if (!isConvexConfigured) {
      return res.status(404).json({ error: 'Save not found', saveId });
    }

    // TODO: Implement with Convex
    res.json({ save: null, saveId });
  } catch (error) {
    console.error('Error getting save:', error);
    res.status(500).json({ error: 'Failed to get save' });
  }
});

// Create a new save
router.post('/saves', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, gameState } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!isConvexConfigured) {
      console.log('Creating local save:', name, 'with state tick:', gameState?.tick);
      return res.json({ saveId: `local-${Date.now()}`, message: 'Saved locally only' });
    }

    // TODO: Implement with Convex
    res.json({ saveId: `mock-${Date.now()}` });
  } catch (error) {
    console.error('Error creating save:', error);
    res.status(500).json({ error: 'Failed to create save' });
  }
});

// Update a save
router.put('/saves/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;
    const { gameState } = req.body;

    if (!isConvexConfigured) {
      console.log('Updating local save:', saveId, 'tick:', gameState?.tick);
      return res.json({ success: true, message: 'Saved locally only' });
    }

    // TODO: Implement with Convex
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating save:', error);
    res.status(500).json({ error: 'Failed to update save' });
  }
});

// Delete a save
router.delete('/saves/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;

    if (!isConvexConfigured) {
      console.log('Deleting local save:', saveId);
      return res.json({ success: true });
    }

    // TODO: Implement with Convex
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting save:', error);
    res.status(500).json({ error: 'Failed to delete save' });
  }
});

// ============================================
// Full Game State Sync (for auto-save)
// ============================================

// Sync full game state
router.post('/sync', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { saveId, gameState } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log(`Syncing game state for user ${userId}:`, {
      tick: gameState?.tick,
      money: gameState?.money,
      employees: gameState?.employees?.length || 0,
      tasks: gameState?.tasks?.length || 0,
    });

    if (!isConvexConfigured) {
      return res.json({ 
        success: true, 
        saveId: saveId || `local-${userId}`,
        message: 'Convex not configured - data saved locally only' 
      });
    }

    // TODO: Implement with Convex
    res.json({ success: true, saveId: saveId || `new-${Date.now()}` });
  } catch (error) {
    console.error('Error syncing game state:', error);
    res.status(500).json({ error: 'Failed to sync game state' });
  }
});

// Load full game state
router.get('/sync/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;

    if (!isConvexConfigured) {
      return res.status(404).json({ error: 'Save not found - Convex not configured', saveId });
    }

    // TODO: Implement with Convex
    res.json({ 
      gameState: null,
      saveId,
      message: 'Load not implemented yet' 
    });
  } catch (error) {
    console.error('Error loading game state:', error);
    res.status(500).json({ error: 'Failed to load game state' });
  }
});

export default router;

/**
 * Game API Routes
 * 
 * Handles all game state persistence with PostgreSQL via Drizzle ORM.
 */

import { Router, type IRouter } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, gameSaves, employees, tasks, activityLogs } from '../db';

const router: IRouter = Router();

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

    const saves = await db.query.gameSaves.findMany({
      where: eq(gameSaves.userId, userId),
      orderBy: desc(gameSaves.updatedAt),
    });

    res.json({ saves });
  } catch (error) {
    console.error('Error listing saves:', error);
    res.status(500).json({ error: 'Failed to list saves' });
  }
});

// Get a specific save with all data
router.get('/saves/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;

    const save = await db.query.gameSaves.findFirst({
      where: eq(gameSaves.id, saveId),
      with: {
        employees: true,
        tasks: true,
        activityLogs: {
          orderBy: desc(activityLogs.createdAt),
          limit: 100,
        },
      },
    });

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ save });
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

    const [newSave] = await db.insert(gameSaves).values({
      userId,
      name: name || 'New Game',
      tick: gameState?.tick || 0,
      money: gameState?.money || 100000,
      runway: gameState?.runway || 12,
      project: gameState?.project || null,
      stats: gameState?.stats || {
        totalRevenue: 0,
        totalExpenses: 0,
        tasksCompleted: 0,
        linesOfCodeGenerated: 0,
        commitsCreated: 0,
        featuresShipped: 0,
      },
    }).returning();

    res.json({ saveId: newSave.id, save: newSave });
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

    const [updated] = await db.update(gameSaves)
      .set({
        tick: gameState.tick,
        money: gameState.money,
        runway: gameState.runway,
        project: gameState.project,
        stats: gameState.stats,
        updatedAt: new Date(),
      })
      .where(eq(gameSaves.id, saveId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ success: true, save: updated });
  } catch (error) {
    console.error('Error updating save:', error);
    res.status(500).json({ error: 'Failed to update save' });
  }
});

// Delete a save
router.delete('/saves/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;

    // Cascade delete will handle employees, tasks, and activity logs
    await db.delete(gameSaves).where(eq(gameSaves.id, saveId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting save:', error);
    res.status(500).json({ error: 'Failed to delete save' });
  }
});

// ============================================
// Full Game State Sync
// ============================================

// Sync full game state (create or update)
router.post('/sync', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { saveId, gameState } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    let save;

    if (saveId) {
      // Update existing save
      const [updated] = await db.update(gameSaves)
        .set({
          tick: gameState.tick,
          money: gameState.money,
          runway: gameState.runway,
          project: gameState.project,
          stats: gameState.stats,
          updatedAt: new Date(),
        })
        .where(eq(gameSaves.id, saveId))
        .returning();
      
      save = updated;
    } else {
      // Create new save
      const [created] = await db.insert(gameSaves).values({
        userId,
        name: gameState.project?.name || 'Auto Save',
        tick: gameState.tick,
        money: gameState.money,
        runway: gameState.runway,
        project: gameState.project,
        stats: gameState.stats,
      }).returning();
      
      save = created;
    }

    if (!save) {
      return res.status(500).json({ error: 'Failed to sync save' });
    }

    // Sync employees - delete and recreate for simplicity
    await db.delete(employees).where(eq(employees.gameSaveId, save.id));
    
    if (gameState.employees?.length > 0) {
      await db.insert(employees).values(
        gameState.employees.map((emp: { id: string; name: string; role: string; skillLevel: string; status: string; avatarEmoji: string; salary: number; productivity: number; morale: number; currentTaskId: string | null; hiredAt: number }) => ({
          gameSaveId: save.id,
          empId: emp.id,
          name: emp.name,
          role: emp.role,
          skillLevel: emp.skillLevel,
          status: emp.status,
          avatarEmoji: emp.avatarEmoji,
          salary: emp.salary,
          productivity: emp.productivity,
          morale: emp.morale,
          currentTaskId: emp.currentTaskId,
          hiredAt: emp.hiredAt,
        }))
      );
    }

    // Sync tasks - delete and recreate
    await db.delete(tasks).where(eq(tasks.gameSaveId, save.id));
    
    if (gameState.tasks?.length > 0) {
      await db.insert(tasks).values(
        gameState.tasks.map((task: { id: string; title: string; description: string; type: string; status: string; priority: string; assigneeId: string | null; estimatedTicks: number; progressTicks: number; createdAt: number; completedAt: number | null; codeGenerated: string | null; filesCreated: string[] }) => ({
          gameSaveId: save.id,
          taskId: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          estimatedTicks: task.estimatedTicks,
          progressTicks: task.progressTicks,
          taskCreatedAt: task.createdAt,
          completedAt: task.completedAt,
          codeGenerated: task.codeGenerated,
          filesCreated: task.filesCreated,
        }))
      );
    }

    console.log(`Synced game state for user ${userId}: tick=${gameState.tick}, employees=${gameState.employees?.length || 0}, tasks=${gameState.tasks?.length || 0}`);

    res.json({ success: true, saveId: save.id });
  } catch (error) {
    console.error('Error syncing game state:', error);
    res.status(500).json({ error: 'Failed to sync game state' });
  }
});

// Load full game state
router.get('/sync/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;

    const save = await db.query.gameSaves.findFirst({
      where: eq(gameSaves.id, saveId),
      with: {
        employees: true,
        tasks: true,
        activityLogs: {
          orderBy: desc(activityLogs.createdAt),
          limit: 100,
        },
      },
    });

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    // Transform back to client format
    const gameState = {
      tick: save.tick,
      money: save.money,
      runway: save.runway,
      project: save.project,
      stats: save.stats,
      employees: save.employees.map(emp => ({
        id: emp.empId,
        name: emp.name,
        role: emp.role,
        skillLevel: emp.skillLevel,
        status: emp.status,
        avatarEmoji: emp.avatarEmoji,
        salary: emp.salary,
        productivity: emp.productivity,
        morale: emp.morale,
        currentTaskId: emp.currentTaskId,
        hiredAt: emp.hiredAt,
      })),
      tasks: save.tasks.map(task => ({
        id: task.taskId,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        estimatedTicks: task.estimatedTicks,
        progressTicks: task.progressTicks,
        createdAt: task.taskCreatedAt,
        completedAt: task.completedAt,
        codeGenerated: task.codeGenerated,
        filesCreated: task.filesCreated,
      })),
      activityLog: save.activityLogs.map(log => ({
        id: log.id,
        tick: log.tick,
        message: log.message,
        type: log.type,
        employeeId: log.employeeId,
        taskId: log.taskId,
        timestamp: log.createdAt.getTime(),
      })),
    };

    res.json({ gameState, saveId: save.id });
  } catch (error) {
    console.error('Error loading game state:', error);
    res.status(500).json({ error: 'Failed to load game state' });
  }
});

// ============================================
// Activity Log
// ============================================

// Add activity log entries
router.post('/activity/:saveId', async (req, res) => {
  try {
    const { saveId } = req.params;
    const { entries } = req.body;

    if (!entries?.length) {
      return res.json({ success: true });
    }

    await db.insert(activityLogs).values(
      entries.map((entry: { tick: number; message: string; type: string; employeeId?: string; taskId?: string }) => ({
        gameSaveId: saveId,
        tick: entry.tick,
        message: entry.message,
        type: entry.type,
        employeeId: entry.employeeId,
        taskId: entry.taskId,
      }))
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding activity logs:', error);
    res.status(500).json({ error: 'Failed to add activity logs' });
  }
});

export default router;

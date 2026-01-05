/**
 * Missions API - Git worktree management for mission branches
 * 
 * Each mission gets its own git branch and worktree, allowing parallel development
 * and easy merging when the mission is complete.
 */

import { Router, type IRouter } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const router: IRouter = Router();

// Base directory for worktrees (in the project's parent directory)
const WORKTREE_BASE = process.env.WORKTREE_BASE || path.join(process.cwd(), '..', 'founder-mode-worktrees');

// GitHub token from header
const getGitHubToken = (req: { headers: Record<string, string | undefined> }) => 
  req.headers['x-github-token'];

// Get repo info from header
const getRepoInfo = (req: { headers: Record<string, string | undefined> }) => {
  const repo = req.headers['x-github-repo'];
  if (!repo) return null;
  const [owner, name] = (repo as string).split('/');
  return owner && name ? { owner, repo: name } : null;
};

/**
 * Create a new worktree for a mission
 * POST /missions/:missionId/worktree
 */
router.post('/:missionId/worktree', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { branchName, baseBranch = 'main' } = req.body;

    if (!branchName) {
      return res.status(400).json({ error: 'branchName is required' });
    }

    const worktreePath = path.join(WORKTREE_BASE, missionId);

    // Ensure worktree base directory exists
    await fs.mkdir(WORKTREE_BASE, { recursive: true });

    // Check if worktree already exists
    try {
      await fs.access(worktreePath);
      return res.status(400).json({ error: 'Worktree already exists' });
    } catch {
      // Worktree doesn't exist, continue
    }

    // Create the branch if it doesn't exist
    try {
      await execAsync(`git branch ${branchName} ${baseBranch}`);
    } catch {
      // Branch might already exist, continue
    }

    // Create the worktree
    await execAsync(`git worktree add "${worktreePath}" ${branchName}`);

    res.json({
      success: true,
      worktreePath,
      branchName,
    });
  } catch (error) {
    console.error('Failed to create worktree:', error);
    res.status(500).json({ 
      error: 'Failed to create worktree',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Remove a worktree
 * DELETE /missions/:missionId/worktree
 */
router.delete('/:missionId/worktree', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { deleteBranch = false } = req.body;
    
    const worktreePath = path.join(WORKTREE_BASE, missionId);

    // Get branch name before removing worktree
    let branchName: string | undefined;
    try {
      const { stdout } = await execAsync(`git worktree list --porcelain`);
      const worktrees = stdout.split('\n\n');
      for (const wt of worktrees) {
        if (wt.includes(worktreePath)) {
          const branchMatch = wt.match(/branch refs\/heads\/(.+)/);
          if (branchMatch) {
            branchName = branchMatch[1];
          }
        }
      }
    } catch {
      // Ignore errors getting branch name
    }

    // Remove the worktree
    await execAsync(`git worktree remove "${worktreePath}" --force`);

    // Optionally delete the branch
    if (deleteBranch && branchName) {
      try {
        await execAsync(`git branch -D ${branchName}`);
      } catch {
        // Branch deletion failed, but worktree is removed
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to remove worktree:', error);
    res.status(500).json({ 
      error: 'Failed to remove worktree',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Write files to a mission's worktree
 * POST /missions/:missionId/files
 */
router.post('/:missionId/files', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { files } = req.body;

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'files array is required' });
    }

    const worktreePath = path.join(WORKTREE_BASE, missionId);

    // Check worktree exists
    try {
      await fs.access(worktreePath);
    } catch {
      return res.status(404).json({ error: 'Worktree not found' });
    }

    // Write each file
    const written: string[] = [];
    for (const file of files) {
      const { path: filePath, content } = file;
      if (!filePath || typeof content !== 'string') continue;

      const fullPath = path.join(worktreePath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      written.push(filePath);
    }

    res.json({ success: true, filesWritten: written });
  } catch (error) {
    console.error('Failed to write files:', error);
    res.status(500).json({ 
      error: 'Failed to write files',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Commit changes in a mission's worktree
 * POST /missions/:missionId/commit
 */
router.post('/:missionId/commit', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { message, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'commit message is required' });
    }

    const worktreePath = path.join(WORKTREE_BASE, missionId);

    // Check worktree exists
    try {
      await fs.access(worktreePath);
    } catch {
      return res.status(404).json({ error: 'Worktree not found' });
    }

    // Stage files
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        await execAsync(`git -C "${worktreePath}" add "${file}"`);
      }
    } else {
      // Stage all changes
      await execAsync(`git -C "${worktreePath}" add -A`);
    }

    // Check if there are changes to commit
    const { stdout: statusOutput } = await execAsync(`git -C "${worktreePath}" status --porcelain`);
    if (!statusOutput.trim()) {
      return res.json({ success: false, message: 'No changes to commit' });
    }

    // Commit
    await execAsync(`git -C "${worktreePath}" commit -m "${message.replace(/"/g, '\\"')}"`);
    
    // Get commit SHA
    const { stdout: shaOutput } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
    const sha = shaOutput.trim();

    // Get list of changed files
    const { stdout: diffOutput } = await execAsync(`git -C "${worktreePath}" diff-tree --no-commit-id --name-only -r ${sha}`);
    const filesChanged = diffOutput.trim().split('\n').filter(Boolean);

    res.json({
      success: true,
      sha,
      message,
      filesChanged,
    });
  } catch (error) {
    console.error('Failed to commit:', error);
    res.status(500).json({ 
      error: 'Failed to commit',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Push a mission branch to GitHub
 * POST /missions/:missionId/push
 */
router.post('/:missionId/push', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { branchName } = req.body;
    const token = getGitHubToken(req);
    const repoInfo = getRepoInfo(req);

    if (!token || !repoInfo) {
      return res.status(400).json({ error: 'GitHub token and repo info required' });
    }

    const worktreePath = path.join(WORKTREE_BASE, missionId);

    // Check worktree exists
    try {
      await fs.access(worktreePath);
    } catch {
      return res.status(404).json({ error: 'Worktree not found' });
    }

    // Set up remote with token
    const remoteUrl = `https://${token}@github.com/${repoInfo.owner}/${repoInfo.repo}.git`;
    
    try {
      await execAsync(`git -C "${worktreePath}" remote set-url origin "${remoteUrl}"`);
    } catch {
      await execAsync(`git -C "${worktreePath}" remote add origin "${remoteUrl}"`);
    }

    // Push the branch
    await execAsync(`git -C "${worktreePath}" push -u origin ${branchName}`);

    res.json({
      success: true,
      branchName,
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
    });
  } catch (error) {
    console.error('Failed to push:', error);
    res.status(500).json({ 
      error: 'Failed to push',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Create a pull request for a mission
 * POST /missions/:missionId/pr
 */
router.post('/:missionId/pr', async (req, res) => {
  try {
    const { title, body, branchName, baseBranch = 'main' } = req.body;
    const token = getGitHubToken(req);
    const repoInfo = getRepoInfo(req);

    if (!token || !repoInfo) {
      return res.status(400).json({ error: 'GitHub token and repo info required' });
    }

    if (!title || !branchName) {
      return res.status(400).json({ error: 'title and branchName are required' });
    }

    // Create PR via GitHub API
    const response = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: body || '',
        head: branchName,
        base: baseBranch,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: 'Failed to create PR',
        details: error.message || JSON.stringify(error),
      });
    }

    const pr = await response.json();

    res.json({
      success: true,
      pullRequestUrl: pr.html_url,
      pullRequestNumber: pr.number,
    });
  } catch (error) {
    console.error('Failed to create PR:', error);
    res.status(500).json({ 
      error: 'Failed to create PR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Merge a mission branch (via GitHub PR merge)
 * POST /missions/:missionId/merge
 */
router.post('/:missionId/merge', async (req, res) => {
  try {
    const { pullRequestNumber, mergeMethod = 'squash' } = req.body;
    const token = getGitHubToken(req);
    const repoInfo = getRepoInfo(req);

    if (!token || !repoInfo) {
      return res.status(400).json({ error: 'GitHub token and repo info required' });
    }

    if (!pullRequestNumber) {
      return res.status(400).json({ error: 'pullRequestNumber is required' });
    }

    // Merge via GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/pulls/${pullRequestNumber}/merge`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merge_method: mergeMethod, // 'merge', 'squash', or 'rebase'
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: 'Failed to merge PR',
        details: error.message || JSON.stringify(error),
      });
    }

    const result = await response.json();

    res.json({
      success: true,
      sha: result.sha,
      merged: result.merged,
    });
  } catch (error) {
    console.error('Failed to merge:', error);
    res.status(500).json({ 
      error: 'Failed to merge',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get status of a mission's worktree
 * GET /missions/:missionId/status
 */
router.get('/:missionId/status', async (req, res) => {
  try {
    const { missionId } = req.params;
    const worktreePath = path.join(WORKTREE_BASE, missionId);

    // Check worktree exists
    try {
      await fs.access(worktreePath);
    } catch {
      return res.json({ exists: false });
    }

    // Get branch info
    const { stdout: branchOutput } = await execAsync(`git -C "${worktreePath}" branch --show-current`);
    const branch = branchOutput.trim();

    // Get status
    const { stdout: statusOutput } = await execAsync(`git -C "${worktreePath}" status --porcelain`);
    const hasChanges = statusOutput.trim().length > 0;

    // Get commit count ahead of main
    let commitsAhead = 0;
    try {
      const { stdout: countOutput } = await execAsync(`git -C "${worktreePath}" rev-list --count main..HEAD`);
      commitsAhead = parseInt(countOutput.trim()) || 0;
    } catch {
      // Might fail if main doesn't exist remotely
    }

    res.json({
      exists: true,
      branch,
      hasChanges,
      commitsAhead,
      worktreePath,
    });
  } catch (error) {
    console.error('Failed to get status:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

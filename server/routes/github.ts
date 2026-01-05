/**
 * GitHub API Routes - Push code to repos
 */

import { Router, type IRouter } from 'express';

const router: IRouter = Router();

interface CommitFile {
  path: string;
  content: string;
}

// Push files to a GitHub repo
router.post('/push', async (req, res) => {
  try {
    const token = req.headers['x-github-token'] as string;
    const { owner, repo, branch = 'main', files, message } = req.body as {
      owner: string;
      repo: string;
      branch?: string;
      files: CommitFile[];
      message: string;
    };

    if (!token) {
      return res.status(401).json({ error: 'GitHub token required' });
    }

    if (!owner || !repo || !files || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Step 1: Get the latest commit SHA for the branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { headers }
    );

    if (!refResponse.ok) {
      const error = await refResponse.json();
      return res.status(refResponse.status).json({ 
        error: `Failed to get branch: ${error.message}` 
      });
    }

    const refData = await refResponse.json();
    const latestCommitSha = refData.object.sha;

    // Step 2: Get the tree SHA for the latest commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      { headers }
    );

    if (!commitResponse.ok) {
      return res.status(500).json({ error: 'Failed to get commit' });
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 3: Create blobs for each file
    const treeItems = [];
    for (const file of files) {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      );

      if (!blobResponse.ok) {
        return res.status(500).json({ error: `Failed to create blob for ${file.path}` });
      }

      const blobData = await blobResponse.json();
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // Step 4: Create a new tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );

    if (!treeResponse.ok) {
      return res.status(500).json({ error: 'Failed to create tree' });
    }

    const treeData = await treeResponse.json();

    // Step 5: Create a new commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );

    if (!newCommitResponse.ok) {
      return res.status(500).json({ error: 'Failed to create commit' });
    }

    const newCommitData = await newCommitResponse.json();

    // Step 6: Update the branch reference
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      }
    );

    if (!updateRefResponse.ok) {
      return res.status(500).json({ error: 'Failed to update branch' });
    }

    res.json({
      success: true,
      sha: newCommitData.sha,
      url: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`,
      filesCommitted: files.length,
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: 'Failed to push to GitHub' });
  }
});

// Get repo info
router.get('/repo', async (req, res) => {
  try {
    const token = req.headers['x-github-token'] as string;
    const { owner, repo } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'GitHub token required' });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      res.json({
        name: data.name,
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        private: data.private,
        url: data.html_url,
      });
    } else {
      const error = await response.json();
      res.status(response.status).json({ error: error.message });
    }
  } catch {
    res.status(500).json({ error: 'Failed to get repo info' });
  }
});

export default router;

/**
 * Integration API Routes - GitHub and Linear imports
 */

import { Router, type IRouter } from 'express';

const router: IRouter = Router();

// ============================================
// GitHub Integration
// ============================================

// Fetch issues from a GitHub repo
router.get('/github/issues', async (req, res) => {
  try {
    const { repo, state = 'open', labels } = req.query;
    const token = req.headers['x-github-token'] as string;

    if (!repo) {
      return res.status(400).json({ error: 'Repository required (owner/repo format)' });
    }

    const url = new URL(`https://api.github.com/repos/${repo}/issues`);
    url.searchParams.set('state', state as string);
    url.searchParams.set('per_page', '50');
    if (labels) {
      url.searchParams.set('labels', labels as string);
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Founder-Mode-Game',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', error);
      return res.status(response.status).json({ 
        error: 'GitHub API error', 
        details: response.status === 403 ? 'Rate limit exceeded or token invalid' : error 
      });
    }

    const issues = await response.json();
    
    // Filter out pull requests (they come through issues API too)
    const filteredIssues = issues.filter((issue: { pull_request?: unknown }) => !issue.pull_request);

    res.json({ 
      issues: filteredIssues,
      count: filteredIssues.length,
    });
  } catch (error) {
    console.error('Error fetching GitHub issues:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub issues' });
  }
});

// ============================================
// Linear Integration
// ============================================

// Fetch issues from Linear
router.get('/linear/issues', async (req, res) => {
  try {
    const { teamId, state } = req.query;
    const apiKey = req.headers['x-linear-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'Linear API key required' });
    }

    // GraphQL query for Linear issues
    const query = `
      query Issues($teamId: String, $filter: IssueFilter) {
        issues(filter: $filter, first: 50) {
          nodes {
            id
            identifier
            title
            description
            priority
            state {
              name
              type
            }
            labels {
              nodes {
                name
                color
              }
            }
            assignee {
              name
            }
            createdAt
            url
          }
        }
      }
    `;

    const variables: { filter: { team?: { id: { eq: string } }; state?: { type: { in: string[] } } } } = {
      filter: {},
    };

    if (teamId) {
      variables.filter.team = { id: { eq: teamId as string } };
    }

    if (state) {
      variables.filter.state = { type: { in: [state as string] } };
    }

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Linear API error:', error);
      return res.status(response.status).json({ error: 'Linear API error' });
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('Linear GraphQL errors:', data.errors);
      return res.status(400).json({ error: 'Linear query error', details: data.errors });
    }

    const issues = data.data.issues.nodes.map((issue: {
      id: string;
      identifier: string;
      title: string;
      description: string | null;
      priority: number;
      state: { name: string; type: string };
      labels: { nodes: Array<{ name: string; color: string }> };
      assignee: { name: string } | null;
      createdAt: string;
      url: string;
    }) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      state: issue.state,
      labels: issue.labels.nodes,
      assignee: issue.assignee,
      createdAt: issue.createdAt,
      url: issue.url,
    }));

    res.json({ 
      issues,
      count: issues.length,
    });
  } catch (error) {
    console.error('Error fetching Linear issues:', error);
    res.status(500).json({ error: 'Failed to fetch Linear issues' });
  }
});

// Get Linear teams (for team selection)
router.get('/linear/teams', async (req, res) => {
  try {
    const apiKey = req.headers['x-linear-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'Linear API key required' });
    }

    const query = `
      query Teams {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `;

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Linear API error' });
    }

    const data = await response.json();
    
    res.json({ 
      teams: data.data.teams.nodes,
    });
  } catch (error) {
    console.error('Error fetching Linear teams:', error);
    res.status(500).json({ error: 'Failed to fetch Linear teams' });
  }
});

export default router;

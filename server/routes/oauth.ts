/**
 * GitHub OAuth Routes
 */

import { Router, type IRouter } from 'express';

const router: IRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/api/oauth/github/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Start GitHub OAuth flow
router.get('/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  const scopes = ['repo', 'read:user'].join(' ');
  const state = Buffer.from(JSON.stringify({ 
    timestamp: Date.now(),
    returnTo: req.query.returnTo || '/'
  })).toString('base64');

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: OAUTH_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData.error);
      return res.redirect(`${FRONTEND_URL}?error=${tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    const userData = await userResponse.json();

    // Parse state (for potential future use like return URL)
    try {
      if (state) {
        JSON.parse(Buffer.from(state as string, 'base64').toString());
      }
    } catch {
      // Ignore state parsing errors
    }

    // Redirect back to frontend with token in URL fragment (more secure than query)
    // The frontend will store this in localStorage
    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.hash = `github_token=${accessToken}&github_user=${encodeURIComponent(userData.login)}&github_avatar=${encodeURIComponent(userData.avatar_url || '')}`;
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${FRONTEND_URL}?error=oauth_failed`);
  }
});

// Check if GitHub OAuth is configured
router.get('/github/status', (req, res) => {
  res.json({
    configured: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
    clientId: GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.slice(0, 8)}...` : null,
  });
});

// Revoke GitHub token
router.post('/github/revoke', async (req, res) => {
  const token = req.headers['x-github-token'] as string;
  
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    // GitHub doesn't have a simple revoke endpoint, but we can delete the token
    await fetch(`https://api.github.com/applications/${GITHUB_CLIENT_ID}/token`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Basic ${Buffer.from(`${GITHUB_CLIENT_ID}:${GITHUB_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({ access_token: token }),
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to revoke token' });
  }
});

export default router;

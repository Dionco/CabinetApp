const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();

// In-memory token storage (replace with database in production)
const tokenStorage = new Map();

/**
 * Step 1: Initiate OAuth2 flow
 * Generates authorization URL for Rabobank login
 */
router.post('/authorize', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('redirectUri').isURL().withMessage('Valid redirect URI is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, redirectUri } = req.body;
    
    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with user info
    tokenStorage.set(state, {
      userId,
      redirectUri,
      timestamp: Date.now()
    });

    // Rabobank OAuth2 authorization URL
    const authUrl = new URL(process.env.RABOBANK_OAUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.RABOBANK_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'account-info:read payment-info:read');
    authUrl.searchParams.set('state', state);

    res.json({
      authorizationUrl: authUrl.toString(),
      state,
      expiresIn: 600 // 10 minutes
    });

  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Failed to initiate authorization' });
  }
});

/**
 * Step 2: Handle OAuth2 callback
 * Exchange authorization code for access token
 */
router.post('/callback', [
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('state').notEmpty().withMessage('State parameter is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, state } = req.body;
    
    // Verify state parameter
    const stateData = tokenStorage.get(state);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state parameter' });
    }

    // Clean up used state
    tokenStorage.delete(state);

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, stateData.redirectUri);
    
    if (!tokenResponse.access_token) {
      return res.status(400).json({ error: 'Failed to obtain access token' });
    }

    // Generate JWT for frontend
    const userToken = jwt.sign(
      { 
        userId: stateData.userId,
        rabobankToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: userToken,
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type
    });

  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Failed to process authorization callback' });
  }
});

/**
 * Step 3: Verify token status
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    userId: req.user.userId,
    expiresAt: req.user.expiresAt,
    remainingTime: req.user.expiresAt - Date.now()
  });
});

/**
 * Step 4: Refresh access token
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    if (!req.user.refreshToken) {
      return res.status(401).json({ error: 'No refresh token available' });
    }

    const tokenResponse = await refreshAccessToken(req.user.refreshToken);
    
    // Generate new JWT
    const userToken = jwt.sign(
      { 
        userId: req.user.userId,
        rabobankToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || req.user.refreshToken,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: userToken,
      expiresIn: tokenResponse.expires_in
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * Helper function: Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, redirectUri) {
  const axios = require('axios');
  
  const tokenData = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: process.env.RABOBANK_CLIENT_ID,
    client_secret: process.env.RABOBANK_CLIENT_SECRET
  };

  const response = await axios.post(
    `${process.env.RABOBANK_API_BASE_URL}/oauth/v2/token`,
    new URLSearchParams(tokenData),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }
  );

  return response.data;
}

/**
 * Helper function: Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  const axios = require('axios');
  
  const tokenData = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.RABOBANK_CLIENT_ID,
    client_secret: process.env.RABOBANK_CLIENT_SECRET
  };

  const response = await axios.post(
    `${process.env.RABOBANK_API_BASE_URL}/oauth/v2/token`,
    new URLSearchParams(tokenData),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }
  );

  return response.data;
}

/**
 * Middleware: Authenticate JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if Rabobank token is expired
    if (user.expiresAt && Date.now() > user.expiresAt) {
      return res.status(401).json({ error: 'Rabobank token expired', needsRefresh: true });
    }
    
    req.user = user;
    next();
  });
}

module.exports = router;

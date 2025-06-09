const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * Middleware: Authenticate JWT token (same as auth.js)
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
    
    if (user.expiresAt && Date.now() > user.expiresAt) {
      return res.status(401).json({ error: 'ING token expired', needsRefresh: true });
    }
    
    req.user = user;
    next();
  });
}

/**
 * Get user's bank accounts
 */
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const response = await makeINGAPICall(
      'GET',
      '/v1/accounts',
      req.user.ingToken
    );

    // Transform ING response to our format
    const accounts = response.data.accounts?.map(account => ({
      id: account.resourceId,
      iban: account.iban,
      name: account.name || account.product || 'Checking Account',
      balance: account.balances?.[0]?.balanceAmount?.amount || '0',
      currency: account.balances?.[0]?.balanceAmount?.currency || 'EUR',
      type: account.cashAccountType || 'CURRENT'
    })) || [];

    res.json({ accounts });

  } catch (error) {
    console.error('Accounts error:', error);
    handleINGAPIError(error, res);
  }
});

/**
 * Get account balance
 */
router.get('/accounts/:accountId/balance', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const response = await makeINGAPICall(
      'GET',
      `/v1/accounts/${accountId}/balances`,
      req.user.ingToken
    );

    const balances = response.data.balances?.map(balance => ({
      type: balance.balanceType,
      amount: balance.balanceAmount.amount,
      currency: balance.balanceAmount.currency,
      date: balance.referenceDate
    })) || [];

    res.json({ balances });

  } catch (error) {
    console.error('Balance error:', error);
    handleINGAPIError(error, res);
  }
});

/**
 * Get account transactions
 */
router.get('/accounts/:accountId/transactions', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { 
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      dateTo = new Date().toISOString().split('T')[0], // today
      limit = 100 
    } = req.query;

    const response = await makeINGAPICall(
      'GET',
      `/v1/accounts/${accountId}/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
      req.user.ingToken
    );

    // Transform ING transactions to our format
    const transactions = response.data.transactions?.booked?.map(transaction => ({
      id: transaction.transactionId,
      date: transaction.bookingDate,
      amount: parseFloat(transaction.transactionAmount.amount),
      currency: transaction.transactionAmount.currency,
      description: transaction.remittanceInformationUnstructured || 
                  transaction.creditorName || 
                  transaction.debtorName || 
                  'Unknown transaction',
      counterparty: {
        name: transaction.creditorName || transaction.debtorName,
        iban: transaction.creditorAccount?.iban || transaction.debtorAccount?.iban
      },
      category: categorizeTransaction(transaction),
      type: parseFloat(transaction.transactionAmount.amount) > 0 ? 'credit' : 'debit',
      raw: transaction // Keep original data for debugging
    })) || [];

    res.json({ 
      transactions,
      totalCount: response.data.transactions?.booked?.length || 0,
      dateRange: { from: dateFrom, to: dateTo }
    });

  } catch (error) {
    console.error('Transactions error:', error);
    handleINGAPIError(error, res);
  }
});

/**
 * Sync recent transactions (for real-time updates)
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { accountId, lastSyncDate } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Get transactions since last sync
    const dateFrom = lastSyncDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = new Date().toISOString().split('T')[0];

    const response = await makeINGAPICall(
      'GET',
      `/v1/accounts/${accountId}/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      req.user.ingToken
    );

    const newTransactions = response.data.transactions?.booked?.map(transaction => ({
      id: transaction.transactionId,
      date: transaction.bookingDate,
      amount: parseFloat(transaction.transactionAmount.amount),
      currency: transaction.transactionAmount.currency,
      description: transaction.remittanceInformationUnstructured || 
                  transaction.creditorName || 
                  transaction.debtorName || 
                  'Unknown transaction',
      counterparty: {
        name: transaction.creditorName || transaction.debtorName,
        iban: transaction.creditorAccount?.iban || transaction.debtorAccount?.iban
      },
      category: categorizeTransaction(transaction),
      type: parseFloat(transaction.transactionAmount.amount) > 0 ? 'credit' : 'debit'
    })) || [];

    // Get current balance
    const balanceResponse = await makeINGAPICall(
      'GET',
      `/v1/accounts/${accountId}/balances`,
      req.user.ingToken
    );

    const currentBalance = balanceResponse.data.balances?.[0]?.balanceAmount?.amount || '0';

    res.json({
      newTransactions,
      transactionCount: newTransactions.length,
      currentBalance: parseFloat(currentBalance),
      lastSyncDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    handleINGAPIError(error, res);
  }
});

/**
 * Helper function: Make authenticated API call to ING
 */
async function makeINGAPICall(method, endpoint, accessToken, data = null) {
  const config = {
    method,
    url: `${process.env.ING_API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  return await axios(config);
}

/**
 * Helper function: Categorize transactions (enhanced from CSV version)
 */
function categorizeTransaction(transaction) {
  const description = (
    transaction.remittanceInformationUnstructured || 
    transaction.creditorName || 
    transaction.debtorName || 
    ''
  ).toLowerCase();

  const amount = parseFloat(transaction.transactionAmount.amount);

  // Food & Groceries
  if (description.includes('albert heijn') || 
      description.includes('ah ') ||
      description.includes('jumbo') ||
      description.includes('lidl') ||
      description.includes('plus') ||
      description.includes('aldi') ||
      description.includes('boodschappen') ||
      description.includes('supermarkt')) {
    return 'food';
  }

  // Toiletries
  if (description.includes('kruidvat') ||
      description.includes('etos') ||
      description.includes('toiletpapier') ||
      description.includes('drogist')) {
    return 'toiletries';
  }

  // Cleaning
  if (description.includes('action') ||
      description.includes('blokker') ||
      description.includes('hema') ||
      description.includes('cleaning') ||
      description.includes('schoonmaak')) {
    return 'cleaning';
  }

  // Beer & Alcohol
  if (description.includes('schultenbräu') ||
      description.includes('beer') ||
      description.includes('bier')) {
    return 'beer';
  }

  // Seltzer & Water
  if (description.includes('seltzer') ||
      description.includes('gigg') ||
      description.includes('viper')) {
    return 'seltzer';
  }

  // Coffee
  if (description.includes('coffee') ||
      description.includes('koffie') ||
      description.includes('starbucks') ||
      description.includes('costa') ||
      description.includes('espresso') ||
      description.includes('cappuccino')) {
    return 'coffee';
  }

  // Utilities
  if (description.includes('vattenfall') ||
      description.includes('eneco') ||
      description.includes('essent') ||
      description.includes('gas') ||
      description.includes('water') ||
      description.includes('electric')) {
    return 'utilities';
  }

  // Contributions (incoming transfers)
  if (amount > 0 && amount >= 8 && amount <= 15 && 
      (description.includes('huishoudpot') ||
       description.includes('house') ||
       description.includes('shared') ||
       description.includes('contribution'))) {
    return 'contribution';
  }

  return 'other';
}

/**
 * Helper function: Handle ING API errors
 */
function handleINGAPIError(error, res) {
  if (error.response) {
    // ING API returned an error
    const status = error.response.status;
    const message = error.response.data?.error_description || error.response.data?.message || 'API Error';
    
    if (status === 401) {
      res.status(401).json({ error: 'ING token expired', needsRefresh: true });
    } else if (status === 403) {
      res.status(403).json({ error: 'Access denied by ING', message });
    } else if (status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded', message });
    } else {
      res.status(status).json({ error: 'ING API Error', message });
    }
  } else if (error.request) {
    // Network error
    res.status(503).json({ error: 'Unable to reach ING API', message: 'Network error' });
  } else {
    // Other error
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = router;

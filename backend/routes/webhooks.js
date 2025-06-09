const express = require('express');
const crypto = require('crypto');
const router = express.Router();

/**
 * Webhook endpoint for real-time transaction updates
 * Rabobank will send POST requests here when transactions occur
 */
router.post('/rabobank', (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-rabobank-signature'];
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { eventType, accountId, transaction, timestamp } = req.body;

    console.log('📞 Webhook received:', {
      eventType,
      accountId,
      transactionId: transaction?.transactionId,
      amount: transaction?.transactionAmount?.amount,
      timestamp
    });

    // Process different event types
    switch (eventType) {
      case 'TRANSACTION_CREATED':
        handleNewTransaction(accountId, transaction);
        break;
      case 'ACCOUNT_BALANCE_UPDATED':
        handleBalanceUpdate(accountId, req.body.balance);
        break;
      default:
        console.log('🤷 Unknown webhook event type:', eventType);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle new transaction webhook
 */
async function handleNewTransaction(accountId, transaction) {
  try {
    // Transform transaction to our format
    const formattedTransaction = {
      id: transaction.transactionId,
      accountId,
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
      timestamp: new Date().toISOString()
    };

    // Here you would typically:
    // 1. Save to database
    // 2. Send push notification to users
    // 3. Update Firebase in real-time
    // 4. Trigger any business logic

    console.log('💰 New transaction processed:', {
      id: formattedTransaction.id,
      amount: formattedTransaction.amount,
      category: formattedTransaction.category,
      description: formattedTransaction.description
    });

    // Example: Send to Firebase (you'd implement this)
    await sendToFirebase(formattedTransaction);

    // Example: Send push notification (you'd implement this)
    await sendPushNotification(formattedTransaction);

  } catch (error) {
    console.error('Error handling new transaction:', error);
  }
}

/**
 * Handle balance update webhook
 */
async function handleBalanceUpdate(accountId, balance) {
  try {
    const formattedBalance = {
      accountId,
      amount: parseFloat(balance.balanceAmount.amount),
      currency: balance.balanceAmount.currency,
      type: balance.balanceType,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Balance updated:', formattedBalance);

    // Update balance in your system
    await updateAccountBalance(formattedBalance);

  } catch (error) {
    console.error('Error handling balance update:', error);
  }
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(payload, signature) {
  if (!signature || !process.env.WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Categorize transaction (same logic as ing.js)
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
      description.includes('aldi')) {
    return 'food';
  }

  // Toiletries
  if (description.includes('kruidvat') ||
      description.includes('etos')) {
    return 'toiletries';
  }

  // Cleaning
  if (description.includes('action') ||
      description.includes('blokker') ||
      description.includes('hema')) {
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
      description.includes('essent')) {
    return 'utilities';
  }

  // Contributions
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
 * Example function: Send transaction to Firebase
 * You would implement this based on your Firebase setup
 */
async function sendToFirebase(transaction) {
  // This would integrate with your existing Firebase setup
  // to add the transaction in real-time
  console.log('🔥 Would send to Firebase:', transaction.id);
}

/**
 * Example function: Send push notification
 * You would implement this with a service like FCM
 */
async function sendPushNotification(transaction) {
  // This would send push notifications to users
  // about new transactions
  console.log('📱 Would send push notification for:', transaction.amount);
}

/**
 * Example function: Update account balance
 * You would implement this to update your local balance cache
 */
async function updateAccountBalance(balance) {
  // This would update your local balance tracking
  console.log('💰 Would update balance to:', balance.amount);
}

/**
 * Health check for webhook endpoint
 */
router.get('/rabobank/health', (req, res) => {
  res.json({
    status: 'active',
    endpoint: '/api/webhooks/rabobank',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

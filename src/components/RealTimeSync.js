import React, { useState, useEffect } from 'react';

const RealTimeSync = ({ isConnected, onSyncComplete, onError }) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [newTransactions, setNewTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [autoSync, setAutoSync] = useState(true);

  // Auto-sync every 5 minutes when connected
  useEffect(() => {
    if (!isConnected || !autoSync) return;

    const interval = setInterval(() => {
      performSync();
    }, 5 * 60 * 1000); // 5 minutes

    // Initial sync
    performSync();

    return () => clearInterval(interval);
  }, [isConnected, autoSync]);

  /**
   * Perform sync with bank API
   */
  const performSync = async () => {
    if (!isConnected) return;

    try {
      setSyncStatus('syncing');
      
      const token = localStorage.getItem('bank_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      // Get account ID (you might store this when connecting)
      const accountId = localStorage.getItem('selected_account_id');
      if (!accountId) {
        throw new Error('No account selected');
      }

      const response = await fetch('/api/rabobank/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId,
          lastSyncDate: lastSync
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsRefresh) {
          await refreshToken();
          return performSync(); // Retry after refresh
        }
        throw new Error(errorData.error || 'Sync failed');
      }

      const data = await response.json();
      
      setNewTransactions(data.newTransactions || []);
      setBalance(data.currentBalance);
      setLastSync(data.lastSyncDate);
      setSyncStatus('success');

      // Notify parent component
      onSyncComplete?.(data);

      // Auto-clear success status after 3 seconds
      setTimeout(() => {
        if (setSyncStatus) setSyncStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      onError?.(error.message);

      // Auto-clear error status after 5 seconds
      setTimeout(() => {
        if (setSyncStatus) setSyncStatus('idle');
      }, 5000);
    }
  };

  /**
   * Refresh authentication token
   */
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('bank_token');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('bank_token', data.token);
      
    } catch (error) {
      console.error('Token refresh error:', error);
      // Redirect to reconnection
      localStorage.removeItem('bank_token');
      window.location.reload();
    }
  };

  /**
   * Manual sync trigger
   */
  const handleManualSync = () => {
    performSync();
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center text-gray-500">
          <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
          <span>Connect your bank account to enable real-time sync</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Real-time Sync</h3>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="mr-2"
            />
            Auto-sync
          </label>
          
          <button
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm"
          >
            {syncStatus === 'syncing' ? '🔄' : '↻'} Sync Now
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="mb-4">
        {syncStatus === 'idle' && lastSync && (
          <div className="flex items-center text-gray-600 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Last synced: {new Date(lastSync).toLocaleString()}
          </div>
        )}

        {syncStatus === 'syncing' && (
          <div className="flex items-center text-blue-600 text-sm">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing with ING...
          </div>
        )}

        {syncStatus === 'success' && (
          <div className="flex items-center text-green-600 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Sync completed successfully
          </div>
        )}

        {syncStatus === 'error' && (
          <div className="flex items-center text-red-600 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            Sync failed - please try again
          </div>
        )}
      </div>

      {/* Current Balance */}
      {balance !== null && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Current Balance</div>
          <div className="text-2xl font-bold text-gray-900">
            €{balance.toFixed(2)}
          </div>
        </div>
      )}

      {/* New Transactions */}
      {newTransactions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            New Transactions ({newTransactions.length})
          </h4>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {newTransactions.map((transaction, index) => (
              <div key={transaction.id || index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {transaction.description}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                  </div>
                </div>
                <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Stats */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-bold text-gray-900">{newTransactions.length}</div>
            <div className="text-gray-500">New today</div>
          </div>
          <div>
            <div className="font-bold text-gray-900">{autoSync ? '5min' : 'Manual'}</div>
            <div className="text-gray-500">Sync freq.</div>
          </div>
          <div>
            <div className="font-bold text-green-600">●</div>
            <div className="text-gray-500">Connected</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeSync;

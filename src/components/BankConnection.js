import React, { useState, useEffect } from 'react';

const BankConnection = ({ onConnectionSuccess, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userToken, setUserToken] = useState(null);

  // Check if user already has a connection
  useEffect(() => {
    const token = localStorage.getItem('bank_token');
    if (token) {
      verifyExistingConnection(token);
    }
  }, []);

  /**
   * Verify existing bank connection
   */
  const verifyExistingConnection = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserToken(token);
        setConnectionStatus('connected');
        onConnectionSuccess?.(data);
      } else {
        localStorage.removeItem('bank_token');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Connection verification error:', error);
      setConnectionStatus('disconnected');
    }
  };

  /**
   * Start OAuth2 flow with Rabobank
   */
  const initiateConnection = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      // Generate user ID (you might get this from your user management system)
      const userId = `user_${Date.now()}`;
      const redirectUri = `${window.location.origin}/api/auth/callback`;

      const response = await fetch('/api/auth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          redirectUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate authorization');
      }

      const data = await response.json();
      
      // Store state for callback verification
      localStorage.setItem('auth_state', data.state);
      localStorage.setItem('auth_user_id', userId);
      
      // Redirect to ING authorization page
      window.location.href = data.authorizationUrl;

    } catch (error) {
      console.error('Connection initiation error:', error);
      setIsConnecting(false);
      setConnectionStatus('error');
      onError?.('Failed to start bank connection');
    }
  };

  /**
   * Disconnect bank account
   */
  const disconnectBank = () => {
    localStorage.removeItem('bank_token');
    localStorage.removeItem('auth_state');
    localStorage.removeItem('auth_user_id');
    setUserToken(null);
    setConnectionStatus('disconnected');
  };

  /**
   * Handle OAuth callback (called from your routing system)
   */
  const handleCallback = async (code, state) => {
    try {
      const storedState = localStorage.getItem('auth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        throw new Error('Authorization failed');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('bank_token', data.token);
      setUserToken(data.token);
      setConnectionStatus('connected');
      
      // Clean up temporary storage
      localStorage.removeItem('auth_state');
      localStorage.removeItem('auth_user_id');
      
      onConnectionSuccess?.(data);

    } catch (error) {
      console.error('Callback handling error:', error);
      setConnectionStatus('error');
      onError?.('Bank authorization failed');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        🏦 Rabobank Connection
      </h3>

      {connectionStatus === 'disconnected' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Connect your Rabobank account for real-time transaction sync and automatic expense tracking.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>✅ Automatic transaction import</li>
              <li>✅ Real-time balance updates</li>
              <li>✅ Smart expense categorization</li>
              <li>✅ Instant contribution detection</li>
              <li>✅ No more manual CSV uploads</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">🔐 Security:</h4>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Bank-grade OAuth2 encryption</li>
              <li>• No passwords stored</li>
              <li>• Read-only access to transactions</li>
              <li>• Revoke access anytime</li>
            </ul>
          </div>

          <button
            onClick={initiateConnection}
            disabled={isConnecting}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting to Rabobank...
              </span>
            ) : (
              '🔗 Connect Rabobank Account'
            )}
          </button>
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className="text-center py-8">
          <div className="animate-spin mx-auto mb-4 h-8 w-8 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
          <p className="text-gray-600">Redirecting to Rabobank for authorization...</p>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-800 font-medium">Connected to Rabobank</span>
            </div>
            <span className="text-green-600 text-sm">✅ Active</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-500">Status:</span>
              <div className="font-medium text-green-600">Real-time sync active</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-500">Last sync:</span>
              <div className="font-medium">Just now</div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={disconnectBank}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              🔗 Disconnect Bank Account
            </button>
          </div>
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">Connection Failed</h4>
            <p className="text-red-800 text-sm">
              Unable to connect to your Rabobank account. Please try again or check your internet connection.
            </p>
          </div>
          
          <button
            onClick={() => {
              setConnectionStatus('disconnected');
              setIsConnecting(false);
            }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default BankConnection;

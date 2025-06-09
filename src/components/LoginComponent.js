import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const LoginComponent = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginUser(username.trim());
    } catch (err) {
      setError('Error logging in. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            House Finance Tracker
          </h1>
          <p className="text-gray-600">
            Welcome! Please enter your name to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your first name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="flex items-center">
              <span className="text-green-600 mr-2">👑</span>
              <strong>First user becomes Admin</strong> - Full access
            </p>
            <p className="flex items-center">
              <span className="text-blue-600 mr-2">💰</span>
              <strong>Nathalie gets Treasurer</strong> - Financial management
            </p>
            <p className="flex items-center">
              <span className="text-gray-600 mr-2">👤</span>
              <strong>Others are Members</strong> - Basic access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;

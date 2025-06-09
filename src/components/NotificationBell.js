import React, { useState, useEffect } from 'react';

const NotificationBell = ({ isConnected }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for real-time notifications (WebSocket or Server-Sent Events)
  useEffect(() => {
    if (!isConnected) return;

    // Example: WebSocket connection for real-time updates
    // const ws = new WebSocket('ws://localhost:3001/notifications');
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   addNotification(notification);
    // };

    // For now, simulate notifications
    const interval = setInterval(() => {
      // This would be triggered by real webhook events
      if (Math.random() > 0.9) { // 10% chance every 30 seconds
        simulateNotification();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      // ws?.close();
    };
  }, [isConnected]);

  /**
   * Add new notification
   */
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep last 20
    setUnreadCount(prev => prev + 1);

    // Auto-mark as read after 10 seconds if bell is open
    if (isOpen) {
      setTimeout(() => {
        markAsRead(newNotification.id);
      }, 10000);
    }
  };

  /**
   * Simulate notification (remove in production)
   */
  const simulateNotification = () => {
    const notifications = [
      {
        type: 'transaction',
        title: 'New Expense',
        message: 'Albert Heijn purchase detected: €23.45',
        amount: -23.45,
        category: 'food',
        icon: '🛒'
      },
      {
        type: 'contribution',
        title: 'Contribution Received',
        message: 'Lisa paid house contribution: €10.00',
        amount: 10.00,
        category: 'contribution',
        icon: '💰'
      },
      {
        type: 'balance',
        title: 'Low Balance Alert',
        message: 'House account balance is below €50',
        amount: 0,
        category: 'alert',
        icon: '⚠️'
      }
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    addNotification(randomNotification);
  };

  /**
   * Mark notification as read
   */
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  /**
   * Mark all as read
   */
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  /**
   * Toggle notification panel
   */
  const togglePanel = () => {
    setIsOpen(!isOpen);
    
    // Mark visible notifications as read when opening
    if (!isOpen && notifications.length > 0) {
      setTimeout(() => {
        const visibleNotifications = notifications.slice(0, 5);
        visibleNotifications.forEach(notification => {
          if (!notification.read) {
            markAsRead(notification.id);
          }
        });
      }, 1000);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={togglePanel}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a6 6 0 10-12 0v3l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>No notifications yet</p>
                <p className="text-sm">You'll see real-time updates here</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{notification.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {notification.amount !== 0 && (
                            <span className={`font-bold ${
                              notification.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {notification.amount > 0 ? '+' : ''}€{Math.abs(notification.amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 text-center">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Real-time sync active
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;

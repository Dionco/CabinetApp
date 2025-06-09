import React from 'react';
import { useUser } from '../contexts/UserContext';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const { hasPermission, PERMISSIONS } = useUser();

  const baseTabs = [
    { id: 'dashboard', label: '🏠 Dashboard', icon: '🏠' },
    { id: 'analytics', label: '📊 Analytics', icon: '📊' },
    { id: 'expenses', label: '💰 Expenses', icon: '💰' },
    { id: 'payments', label: '💳 Payments', icon: '💳' },
    { id: 'consumption', label: '🍺☕🥤 Consumption', icon: '🍺' }
  ];

  // Add admin/treasurer tabs based on permissions
  const tabs = [...baseTabs];
  
  if (hasPermission(PERMISSIONS.VIEW_USER_LIST)) {
    tabs.push({ id: 'users', label: '👥 Users', icon: '👥' });
  }

  return (
    <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg mr-2">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
            <span className="sm:hidden">{tab.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;

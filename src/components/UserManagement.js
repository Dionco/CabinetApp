import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const UserManagement = () => {
  const { 
    currentUser, 
    users, 
    updateUserRole, 
    grantPermission, 
    revokePermission, 
    deleteUser,
    deprecateUser,
    reactivateUser,
    hasPermission, 
    ROLES, 
    PERMISSIONS, 
    ROLE_PERMISSIONS 
  } = useUser();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeprecateModal, setShowDeprecateModal] = useState(false);
  const [deprecationReason, setDeprecationReason] = useState('');
  const [showDeprecatedUsers, setShowDeprecatedUsers] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if current user can manage roles
  const canManageRoles = hasPermission(PERMISSIONS.MANAGE_ROLES);
  const canDeleteUsers = hasPermission(PERMISSIONS.DELETE_USER);
  const canDeprecateUsers = hasPermission(PERMISSIONS.DEPRECATE_USER);

  const handleRoleChange = async (userId, newRole) => {
    if (!canManageRoles) return;
    
    setLoading(true);
    try {
      await updateUserRole(userId, newRole);
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      alert('Error updating role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!canDeleteUsers) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\n` +
      `This action cannot be undone and will permanently remove all user data.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await deleteUser(userId);
      alert(`User "${userName}" has been deleted successfully.`);
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (userId, permission, hasPermission) => {
    if (!canManageRoles) return;
    
    setLoading(true);
    try {
      if (hasPermission) {
        await revokePermission(userId, permission);
      } else {
        await grantPermission(userId, permission);
      }
    } catch (error) {
      alert('Error updating permission: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeprecateUser = async (userId, userName) => {
    if (!canDeprecateUsers) return;
    
    setSelectedUser({ id: userId, name: userName });
    setShowDeprecateModal(true);
  };

  const confirmDeprecateUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await deprecateUser(selectedUser.id, deprecationReason);
      alert(`User "${selectedUser.name}" has been deprecated successfully.`);
      setShowDeprecateModal(false);
      setSelectedUser(null);
      setDeprecationReason('');
    } catch (error) {
      alert('Error deprecating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateUser = async (userId, userName) => {
    if (!canDeprecateUsers) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to reactivate user "${userName}"?\n\n` +
      `This will restore their access to the system.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await reactivateUser(userId);
      alert(`User "${userName}" has been reactivated successfully.`);
    } catch (error) {
      alert('Error reactivating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-red-100 text-red-800 border-red-200';
      case ROLES.TREASURER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ROLES.MODERATOR:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return '👑';
      case ROLES.TREASURER:
        return '💰';
      case ROLES.MODERATOR:
        return '🛡️';
      default:
        return '👤';
    }
  };

  if (!hasPermission(PERMISSIONS.VIEW_USER_LIST)) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              👥 User Management
            </h2>
            <p className="text-gray-600">
              Manage user roles and permissions for the house finance tracker
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Your role: <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(currentUser?.role)}`}>
                {getRoleIcon(currentUser?.role)} {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {showDeprecatedUsers ? 'Deprecated Users' : 'Active Users'} ({
                showDeprecatedUsers 
                  ? users.filter(u => u.isDeprecated).length
                  : users.filter(u => !u.isDeprecated).length
              })
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeprecatedUsers(!showDeprecatedUsers)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showDeprecatedUsers
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {showDeprecatedUsers ? '👥 Show Active' : '📦 Show Deprecated'}
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {users
            .filter(user => showDeprecatedUsers ? user.isDeprecated : !user.isDeprecated)
            .map((user) => (
            <div key={user.id} className={`p-6 transition-colors ${
              user.isDeprecated 
                ? 'bg-gray-100 hover:bg-gray-150 opacity-75' 
                : 'hover:bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {user.isDeprecated ? '📦' : getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h4 className={`text-lg font-medium ${
                      user.isDeprecated ? 'text-gray-600' : 'text-gray-800'
                    }`}>
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-sm text-indigo-600">(You)</span>
                      )}
                      {user.isDeprecated && (
                        <span className="ml-2 text-sm text-red-600 font-medium">(Deprecated)</span>
                      )}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        user.isDeprecated ? 'bg-gray-200 text-gray-600 border-gray-300' : getRoleColor(user.role)
                      }`}>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                      </span>
                      <span className={`text-xs ${user.isDeprecated ? 'text-gray-500' : 'text-gray-500'}`}>
                        {user.permissions?.length || 0} permissions
                      </span>
                      {user.isDeprecated && user.deprecatedAt && (
                        <span className="text-xs text-red-500">
                          Deprecated: {new Date(user.deprecatedAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {user.isDeprecated && user.deprecationReason && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        Reason: {user.deprecationReason}
                      </p>
                    )}
                  </div>
                </div>

                {canManageRoles && user.id !== currentUser?.id && (
                  <div className="flex space-x-2">
                    {!user.isDeprecated ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionModal(true);
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                        >
                          Permissions
                        </button>
                        {canDeprecateUsers && (
                          <button
                            onClick={() => handleDeprecateUser(user.id, user.name)}
                            disabled={loading}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            📦 Deprecate
                          </button>
                        )}
                        {canDeleteUsers && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      // Deprecated user actions
                      <>
                        {canDeprecateUsers && (
                          <button
                            onClick={() => handleReactivateUser(user.id, user.name)}
                            disabled={loading}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ↩️ Reactivate
                          </button>
                        )}
                        {canDeleteUsers && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Permanently Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* User permissions preview */}
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Key Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {(user.permissions || []).slice(0, 5).map(permission => (
                    <span 
                      key={permission}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {permission.replace('_', ' ').toLowerCase()}
                    </span>
                  ))}
                  {(user.permissions || []).length > 5 && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                      +{(user.permissions || []).length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Change Role for {selectedUser.name}
            </h3>
            
            <div className="space-y-3">
              {Object.values(ROLES).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(selectedUser.id, role)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedUser.role === role 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getRoleIcon(role)}</span>
                    <div>
                      <div className="font-medium">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {ROLE_PERMISSIONS[role]?.length || 0} permissions
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Management Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage Permissions for {selectedUser.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(PERMISSIONS).map(permission => {
                const hasPermission = selectedUser.permissions?.includes(permission);
                return (
                  <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePermissionToggle(selectedUser.id, permission, hasPermission)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        hasPermission
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {hasPermission ? 'Granted' : 'Grant'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Role Descriptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">👑</span>
              <h4 className="font-medium">Admin (Creator)</h4>
            </div>
            <p className="text-sm text-gray-600">
              Full system access. Can manage all users, roles, and permissions. Usually the person who set up the app.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💰</span>
              <h4 className="font-medium">Treasurer</h4>
            </div>
            <p className="text-sm text-gray-600">
              Financial management access. Can delete/edit expenses, manage contributions, and handle financial operations.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🛡️</span>
              <h4 className="font-medium">Moderator</h4>
            </div>
            <p className="text-sm text-gray-600">
              Can manage expenses and flatmates. Good for trusted housemates who help with organization.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">👤</span>
              <h4 className="font-medium">Member</h4>
            </div>
            <p className="text-sm text-gray-600">
              Basic access. Can add expenses and view analytics. Standard role for most flatmates.
            </p>
          </div>
        </div>
      </div>

      {/* Deprecate User Modal */}
      {showDeprecateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📦</span>
                <h3 className="text-xl font-semibold text-gray-800">
                  Deprecate User
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                You are about to deprecate <strong>{selectedUser.name}</strong>. 
                This will preserve all their data but mark them as inactive. 
                They will no longer appear in active user lists or be able to access the system.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deprecation (optional)
                </label>
                <textarea
                  value={deprecationReason}
                  onChange={(e) => setDeprecationReason(e.target.value)}
                  placeholder="e.g., Moved out, graduated, etc."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows="3"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeprecateModal(false);
                    setSelectedUser(null);
                    setDeprecationReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeprecateUser}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deprecating...' : 'Deprecate User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

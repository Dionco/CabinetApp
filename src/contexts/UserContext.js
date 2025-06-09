import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role definitions
  const ROLES = {
    ADMIN: 'admin',           // Creator/Full admin access
    TREASURER: 'treasurer',   // Financial management access
    MODERATOR: 'moderator',   // Can manage expenses and users
    MEMBER: 'member'          // Basic user
  };

  // Permission definitions
  const PERMISSIONS = {
    // Expense permissions
    DELETE_EXPENSE: 'delete_expense',
    EDIT_EXPENSE: 'edit_expense',
    ADD_EXPENSE: 'add_expense',
    
    // Flatmate management
    ADD_FLATMATE: 'add_flatmate',
    REMOVE_FLATMATE: 'remove_flatmate',
    EDIT_FLATMATE: 'edit_flatmate',
    
    // Financial management
    MANAGE_CONTRIBUTIONS: 'manage_contributions',
    DELETE_CONTRIBUTION: 'delete_contribution',
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',
    IMPORT_DATA: 'import_data',
    
    // User management
    MANAGE_ROLES: 'manage_roles',
    VIEW_USER_LIST: 'view_user_list',
    
    // System administration
    RESET_BALANCES: 'reset_balances',
    BULK_OPERATIONS: 'bulk_operations',
    SYSTEM_SETTINGS: 'system_settings'
  };

  // Role-permission mapping
  const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS), // All permissions
    [ROLES.TREASURER]: [
      PERMISSIONS.DELETE_EXPENSE,
      PERMISSIONS.EDIT_EXPENSE,
      PERMISSIONS.ADD_EXPENSE,
      PERMISSIONS.ADD_FLATMATE,
      PERMISSIONS.EDIT_FLATMATE,
      PERMISSIONS.MANAGE_CONTRIBUTIONS,
      PERMISSIONS.DELETE_CONTRIBUTION,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.IMPORT_DATA,
      PERMISSIONS.VIEW_USER_LIST,
      PERMISSIONS.RESET_BALANCES,
      PERMISSIONS.BULK_OPERATIONS
    ],
    [ROLES.MODERATOR]: [
      PERMISSIONS.DELETE_EXPENSE,
      PERMISSIONS.EDIT_EXPENSE,
      PERMISSIONS.ADD_EXPENSE,
      PERMISSIONS.ADD_FLATMATE,
      PERMISSIONS.EDIT_FLATMATE,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_USER_LIST
    ],
    [ROLES.MEMBER]: [
      PERMISSIONS.ADD_EXPENSE,
      PERMISSIONS.VIEW_ANALYTICS
    ]
  };

  // Fetch users from Firebase
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Initialize user system
  const initializeUser = async (userName) => {
    try {
      // Check if this is the first user (creator)
      const usersSnapshot = await getDocs(collection(db, "users"));
      const isFirstUser = usersSnapshot.empty;
      
      const userData = {
        name: userName,
        role: isFirstUser ? ROLES.ADMIN : ROLES.MEMBER,
        joinedAt: new Date(),
        isActive: true,
        permissions: isFirstUser ? Object.values(PERMISSIONS) : ROLE_PERMISSIONS[ROLES.MEMBER]
      };

      // Save user to Firebase
      const userRef = doc(db, "users", userName);
      await setDoc(userRef, userData);
      
      // Set as current user
      setCurrentUser({ id: userName, ...userData });
      
      // If this is Nathalie, automatically give treasurer role
      if (userName.toLowerCase() === 'nathalie' && !isFirstUser) {
        await updateUserRole(userName, ROLES.TREASURER);
      }
      
      await fetchUsers();
      return userData;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  };

  // Login user
  const loginUser = async (userName) => {
    try {
      const userRef = doc(db, "users", userName);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = { id: userName, ...userDoc.data() };
        setCurrentUser(userData);
        return userData;
      } else {
        // Create new user if not exists
        return await initializeUser(userName);
      }
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      if (!hasPermission(PERMISSIONS.MANAGE_ROLES)) {
        throw new Error('You do not have permission to manage roles');
      }

      const userRef = doc(db, "users", userId);
      const newPermissions = ROLE_PERMISSIONS[newRole] || [];
      
      await setDoc(userRef, {
        role: newRole,
        permissions: newPermissions,
        updatedAt: new Date()
      }, { merge: true });
      
      await fetchUsers();
      
      // Update current user if it's them
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => ({
          ...prev,
          role: newRole,
          permissions: newPermissions
        }));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Grant specific permission to user
  const grantPermission = async (userId, permission) => {
    try {
      if (!hasPermission(PERMISSIONS.MANAGE_ROLES)) {
        throw new Error('You do not have permission to manage permissions');
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentPermissions = userData.permissions || [];
        
        if (!currentPermissions.includes(permission)) {
          const newPermissions = [...currentPermissions, permission];
          
          await setDoc(userRef, {
            permissions: newPermissions,
            updatedAt: new Date()
          }, { merge: true });
          
          await fetchUsers();
        }
      }
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  };

  // Revoke specific permission from user
  const revokePermission = async (userId, permission) => {
    try {
      if (!hasPermission(PERMISSIONS.MANAGE_ROLES)) {
        throw new Error('You do not have permission to manage permissions');
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentPermissions = userData.permissions || [];
        const newPermissions = currentPermissions.filter(p => p !== permission);
        
        await setDoc(userRef, {
          permissions: newPermissions,
          updatedAt: new Date()
        }, { merge: true });
        
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  };

  // Check if current user has specific permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return currentUser.permissions?.includes(permission) || false;
  };

  // Check if current user has specific role
  const hasRole = (role) => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  // Check if current user is admin or treasurer
  const isAdminOrTreasurer = () => {
    return hasRole(ROLES.ADMIN) || hasRole(ROLES.TREASURER);
  };

  // Logout user
  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Load current user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  // Save current user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      fetchUsers();
    }
  }, [currentUser]);

  const value = {
    // State
    currentUser,
    users,
    loading,
    
    // Constants
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    
    // Functions
    loginUser,
    logoutUser,
    initializeUser,
    updateUserRole,
    grantPermission,
    revokePermission,
    hasPermission,
    hasRole,
    isAdminOrTreasurer,
    fetchUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

import React from 'react';
import { useUser } from '../contexts/UserContext';

// Component to wrap elements that require specific permissions
const PermissionWrapper = ({ 
  permission, 
  role, 
  fallback = null, 
  children,
  showFallback = true 
}) => {
  const { hasPermission, hasRole, currentUser } = useUser();

  // Check permission if provided
  if (permission && !hasPermission(permission)) {
    return showFallback ? fallback : null;
  }

  // Check role if provided
  if (role && !hasRole(role)) {
    return showFallback ? fallback : null;
  }

  // If no user is logged in
  if (!currentUser) {
    return showFallback ? fallback : null;
  }

  return children;
};

// Hook for conditional rendering based on permissions
export const usePermissionCheck = () => {
  const { hasPermission, hasRole, currentUser } = useUser();

  const canAccess = (permission, role) => {
    if (!currentUser) return false;
    
    if (permission && !hasPermission(permission)) return false;
    if (role && !hasRole(role)) return false;
    
    return true;
  };

  return {
    canAccess,
    hasPermission,
    hasRole,
    isLoggedIn: !!currentUser
  };
};

export default PermissionWrapper;

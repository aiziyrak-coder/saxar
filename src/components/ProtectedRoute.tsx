import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME_PATHS } from '../constants/roles';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }

  if (userData.status === 'inactive') {
    return <Navigate to="/login" replace state={{ deactivated: true }} />;
  }

  if (
    userData.role === 'b2b' &&
    userData.status === 'pending' &&
    allowedRoles?.includes('b2b') &&
    !window.location.pathname.startsWith('/b2b/profile')
  ) {
    return <Navigate to="/b2b/profile" replace state={{ pendingApproval: true }} />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    const redirect = ROLE_HOME_PATHS[userData.role] || '/';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
};

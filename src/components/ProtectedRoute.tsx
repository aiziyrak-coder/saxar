import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

const ROLE_DASHBOARD: Record<UserRole, string> = {
  admin: '/admin',
  accountant: '/accountant',
  warehouse: '/warehouse',
  agent: '/agent',
  driver: '/driver',
  b2b: '/b2b',
  production: '/production',
};

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

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    const redirect = ROLE_DASHBOARD[userData.role] || '/';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
};

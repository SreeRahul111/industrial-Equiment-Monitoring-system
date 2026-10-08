import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-wide">Validating security session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <ShieldAlert size={28} />
          <h2 className="text-xl font-bold">Access Restricted</h2>
        </div>
        <p className="text-slate-600 mb-4">
          Your current role (<strong className="text-slate-900">{user.role}</strong>) does not have authorization
          to access this sensitive operational module.
        </p>
        <p className="text-xs text-slate-400 font-mono mb-6">
          Security audit notice: This access denial has been recorded in the system audit trail.
        </p>
        <a
          href="/overview"
          className="inline-flex px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          Return to Overview
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

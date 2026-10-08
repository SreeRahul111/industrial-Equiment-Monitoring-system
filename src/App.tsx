import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { MachinesPage } from './pages/MachinesPage';
import { MachineDetailPage } from './pages/MachineDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { ThresholdsPage } from './pages/ThresholdsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { AuditPage } from './pages/AuditPage';
import { AdminPage } from './pages/AdminPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Screen */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Core Screens */}
            <Route
              path="/overview"
              element={
                <ProtectedRoute>
                  <OverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machines"
              element={
                <ProtectedRoute>
                  <MachinesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machines/:id"
              element={
                <ProtectedRoute>
                  <MachineDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/thresholds"
              element={
                <ProtectedRoute>
                  <ThresholdsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <MaintenancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AuditPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Only Screen */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* System Health Screen */}
            <Route
              path="/health"
              element={
                <ProtectedRoute>
                  <SystemHealthPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

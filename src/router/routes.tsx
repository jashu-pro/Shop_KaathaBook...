/* router/routes.tsx */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Layout
import MainLayout from '../layouts/MainLayout';

// Auth Pages
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import ForgotPassword from '../features/auth/pages/ForgotPassword';

import AuthCallback from '../features/auth/pages/AuthCallback';

// Shop Onboarding Page
import ShopRegistration from '../features/shop/pages/ShopRegistration';

// Core Application Pages
import Dashboard from '../features/dashboard/pages/Dashboard';
import { CustomerListPage } from '../features/customers';
import { ProductListPage } from '../features/inventory';
import { NewSale, SalesListPage } from '../features/sales';
import { ReceivePaymentPage, PaymentsListPage } from '../features/payments';
import { LedgerPage } from '../features/ledger';
import Reports from '../features/reports/pages/Reports';
import { SettingsPage } from '../features/settings';
import { AIAssistantPage } from '../features/dashboard/pages/AIAssistantPage';
import { 
  WorkerLoginPage, 
  WorkerPinSetupPage, 
  WorkerDashboardPage, 
  PermissionGuard,
  useWorkerPermissions 
} from '../features/staff';

const DashboardRouter: React.FC = () => {
  const { isWorker } = useWorkerPermissions();
  return isWorker ? <WorkerDashboardPage /> : <Dashboard />;
};

// Guard for routes that require authentication
export const ProtectedRoute: React.FC<{ requireShop?: boolean }> = ({ requireShop = true }) => {
  const { isAuthenticated, isOnboarded, isLoading } = useAuthStore();
  const { isWorker } = useWorkerPermissions();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Allow active workers or authenticated owners
  if (!isAuthenticated && !isWorker) {
    return <Navigate to="/login" replace />;
  }

  if (requireShop && !isOnboarded && !isWorker) {
    return <Navigate to="/shop-setup" replace />;
  }

  return <Outlet />;
};

// Guard for routes that are public (login/register) and should redirect if already authenticated
export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isOnboarded, isLoading } = useAuthStore();
  const { isWorker } = useWorkerPermissions();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated || isWorker) {
    if (!isOnboarded && !isWorker) {
      return <Navigate to="/shop-setup" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/worker-login" element={<WorkerLoginPage />} />
          <Route path="/worker-activate" element={<WorkerPinSetupPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Route>

        {/* Onboarding Routes - Requires login, but no shop registration check */}
        <Route element={<ProtectedRoute requireShop={false} />}>
          <Route path="/shop-setup" element={<ShopRegistration />} />
        </Route>

        {/* Protected Application Routes - Requires login and active shop (or worker session) */}
        <Route element={<ProtectedRoute requireShop={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardRouter />} />
            
            <Route path="/customers" element={
              <PermissionGuard module="customers" action="view">
                <CustomerListPage />
              </PermissionGuard>
            } />
            <Route path="/customers/:id" element={
              <PermissionGuard module="customers" action="view">
                <CustomerListPage />
              </PermissionGuard>
            } />
            
            <Route path="/inventory" element={
              <PermissionGuard module="inventory" action="view">
                <ProductListPage />
              </PermissionGuard>
            } />
            <Route path="/inventory/new" element={
              <PermissionGuard module="inventory" action="add">
                <ProductListPage />
              </PermissionGuard>
            } />

            <Route path="/sales" element={
              <PermissionGuard module="sales" action="view">
                <SalesListPage />
              </PermissionGuard>
            } />
            <Route path="/sales/new" element={
              <PermissionGuard module="sales" action="create">
                <NewSale />
              </PermissionGuard>
            } />

            <Route path="/payments" element={
              <PermissionGuard module="payments" action="view">
                <PaymentsListPage />
              </PermissionGuard>
            } />
            <Route path="/payments/receive" element={
              <PermissionGuard module="payments" action="receive">
                <ReceivePaymentPage />
              </PermissionGuard>
            } />

            <Route path="/ledger" element={
              <PermissionGuard module="customers" action="ledger">
                <LedgerPage />
              </PermissionGuard>
            } />

            <Route path="/reports" element={
              <PermissionGuard module="reports">
                <Reports />
              </PermissionGuard>
            } />

            <Route path="/ai-assistant" element={<AIAssistantPage />} />

            <Route path="/settings" element={
              <PermissionGuard module="settings">
                <SettingsPage />
              </PermissionGuard>
            } />
          </Route>
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

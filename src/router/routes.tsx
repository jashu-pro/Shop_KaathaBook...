/* router/routes.tsx */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Auth Pages
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import ForgotPassword from '../features/auth/pages/ForgotPassword';
import AuthCallback from '../features/auth/pages/AuthCallback';

// Shop Onboarding & Approval Gatekeeper
import ShopRegistration from '../features/shop/pages/ShopRegistration';
import RegistrationApprovalStatusPage from '../features/shop/pages/RegistrationApprovalStatusPage';

// Admin Portal Pages & Hook
import { 
  useAdminAuth,
  AdminLoginPage,
  AdminDashboardPage,
  AdminPendingRequestsPage,
  AdminShopsPage,
  AdminWorkersPage,
  AdminPermissionsPage,
  AdminAuditLogsPage,
  AdminReportsPage,
  AdminSettingsPage
} from '../features/admin';

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

// Guard for routes that require merchant authentication and active shop status
export const ProtectedRoute: React.FC<{ requireShop?: boolean }> = ({ requireShop = true }) => {
  const { isAuthenticated, shop, isLoading } = useAuthStore();
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

  if (requireShop && !isWorker) {
    if (!shop) {
      return <Navigate to="/shop-setup" replace />;
    }
    if (shop.status !== 'active') {
      return <Navigate to="/approval-status" replace />;
    }
  }

  return <Outlet />;
};

// Guard for routes that are public (login/register) and should redirect if already authenticated
export const PublicRoute: React.FC = () => {
  const { isAuthenticated, shop, isLoading } = useAuthStore();

  const { isWorker } = useWorkerPermissions();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated || isWorker) {
    if (!isWorker) {
      if (!shop) {
        return <Navigate to="/shop-setup" replace />;
      }
      if (shop.status !== 'active') {
        return <Navigate to="/approval-status" replace />;
      }
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Guard for Admin Portal routes (/admin/*)
export const AdminProtectedRoute: React.FC = () => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
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
        </Route>

        {/* Dedicated OAuth Callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Admin Portal Authentication */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Protected Control Center */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/pending" element={<AdminPendingRequestsPage />} />
            <Route path="/admin/shops" element={<AdminShopsPage />} />
            <Route path="/admin/workers" element={<AdminWorkersPage />} />
            <Route path="/admin/permissions" element={<AdminPermissionsPage />} />
            <Route path="/admin/audit" element={<AdminAuditLogsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* Onboarding & Approval Gatekeeper - Requires login, but no active shop check */}
        <Route element={<ProtectedRoute requireShop={false} />}>
          <Route path="/shop-setup" element={<ShopRegistration />} />
          <Route path="/approval-status" element={<RegistrationApprovalStatusPage />} />
        </Route>

        {/* Protected Merchant Application Routes - Strictly requires active approved shop (or worker) */}
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
            <Route path="/cashbook" element={
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

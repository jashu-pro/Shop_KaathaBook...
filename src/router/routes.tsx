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

// Guard for routes that require authentication
export const ProtectedRoute: React.FC<{ requireShop?: boolean }> = ({ requireShop = true }) => {
  const { isAuthenticated, isOnboarded, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireShop && !isOnboarded) {
    return <Navigate to="/shop-setup" replace />;
  }

  return <Outlet />;
};

// Guard for routes that are public (login/register) and should redirect if already authenticated
export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isOnboarded, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (!isOnboarded) {
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
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Route>

        {/* Onboarding Routes - Requires login, but no shop registration check */}
        <Route element={<ProtectedRoute requireShop={false} />}>
          <Route path="/shop-setup" element={<ShopRegistration />} />
        </Route>

        {/* Protected Application Routes - Requires login and active shop */}
        <Route element={<ProtectedRoute requireShop={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/:id" element={<CustomerListPage />} />
            <Route path="/inventory" element={<ProductListPage />} />
            <Route path="/sales" element={<SalesListPage />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/payments" element={<PaymentsListPage />} />
            <Route path="/payments/receive" element={<ReceivePaymentPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

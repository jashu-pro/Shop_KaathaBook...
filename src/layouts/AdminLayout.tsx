/* layouts/AdminLayout.tsx */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../features/admin/hooks/useAdminAuth';
import './AdminLayout.css';
import { RepositoryFactory } from '../repositories/RepositoryFactory';
import {
  ShieldAlert,
  LayoutDashboard,
  Clock,
  Store,
  Users,
  KeyRound,
  History,
  FileBarChart2,
  Sliders,
  LogOut,
  ExternalLink,
  Menu,
} from 'lucide-react';

const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminEmail, role, logoutAdmin } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: pendingRequests } = useQuery({
    queryKey: ['admin', 'pending-requests'],
    queryFn: () => adminRepo.getPendingRequests(),
    refetchInterval: 30000,
    staleTime: 15000,
  });
  const pendingCount = pendingRequests?.length ?? 0;

  const handleSignOut = async () => {
    await logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/pending', label: 'Pending Requests', icon: Clock, badge: pendingCount > 0 ? pendingCount : null },
    { to: '/admin/shops', label: 'Shops Management', icon: Store },
    { to: '/admin/workers', label: 'Staff & Workers', icon: Users },
    { to: '/admin/permissions', label: 'Manage Admins & Roles', icon: KeyRound },
    { to: '/admin/audit', label: 'Activity & Audit', icon: History },
    { to: '/admin/reports', label: 'Platform Reports', icon: FileBarChart2 },
    { to: '/admin/settings', label: 'Admin Settings', icon: Sliders },
  ];

  return (
    <div className="admin-shell">
      <div
        className={`admin-backdrop${mobileOpen ? ' is-open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${mobileOpen ? ' is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="admin-brand-title">Shop KhattaBook</div>
            <div className="admin-brand-subtitle">Admin Control Center</div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-heading">Core Management</div>
          <div className="admin-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`admin-nav-link${isActive ? ' is-active' : ''}`}
                >
                  <div className="admin-nav-link-label">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="admin-user">
          <div className="admin-user-info">
            <div className="admin-avatar">{(adminEmail || 'A').charAt(0)}</div>
            <div className="admin-user-text">
              <div className="admin-user-email">{adminEmail || 'Administrator'}</div>
              {role && (
                <div className="admin-user-role">
                  <span className="admin-user-role-dot" />
                  <span>{role.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="admin-user-actions">
            <button
              onClick={() => navigate('/')}
              className="admin-btn admin-btn-secondary"
              title="Open Merchant App"
            >
              <ExternalLink size={13} />
              <span>Merchant App</span>
            </button>
            <button
              onClick={handleSignOut}
              className="admin-btn admin-btn-danger"
              title="Admin Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="admin-main-wrap">
        <header className="admin-header">
          <button
            className="admin-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <span className="admin-header-title">Platform Operations & Governance</span>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

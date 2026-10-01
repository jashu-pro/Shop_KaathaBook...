/* layouts/AdminLayout.tsx */
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../features/admin/hooks/useAdminAuth';
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
  ShieldCheck,
} from 'lucide-react';

const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminEmail, role, logoutAdmin } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadPending = async () => {
      try {
        const reqs = await adminRepo.getPendingRequests();
        if (isMounted) setPendingCount(reqs.length);
      } catch {}
    };
    loadPending();
    const interval = setInterval(loadPending, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f3f4f6',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: '270px',
          backgroundColor: '#0d1322',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          transform: mobileOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.25s ease-in-out',
        }}
        className="admin-sidebar"
      >
        {/* Brand Header */}
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>
              Shop KhattaBook
            </div>
            <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Admin Control Center
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: '1.25rem 0.75rem', overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6b7280',
            padding: '0 0.75rem 0.5rem',
          }}>
            Core Management
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : '#9ca3af',
                    backgroundColor: isActive ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} style={{ color: isActive ? '#ef4444' : '#9ca3af' }} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Admin User Footer */}
        <div style={{
          padding: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}>
              A
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f3f4f6', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {adminEmail || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>{role || 'Super Admin'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.45rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9ca3af',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
              title="Open Merchant App"
            >
              <ExternalLink size={13} />
              <span>Merchant App</span>
            </button>

            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
              title="Admin Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div style={{
        flex: 1,
        marginLeft: '270px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: 'calc(100% - 270px)',
      }}>
        {/* Top Header Bar */}
        <header style={{
          height: '64px',
          backgroundColor: '#0d1322',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Platform Operations & Governance
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              <ShieldCheck size={14} />
              <span>RLS + Audit Guard Enforced</span>
            </div>
          </div>
        </header>

        {/* Sub-view Content */}
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

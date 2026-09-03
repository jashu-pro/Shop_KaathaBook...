/* layouts/MainLayout.tsx */
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../providers/ThemeProvider';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  Settings, 
  Plus, 
  Sun, 
  Moon,
  X,
  CreditCard,
  UserPlus,
  PackagePlus,
  Package,
  LogOut
} from 'lucide-react';

import { RecordCreditSaleModal } from '../features/sales/components/RecordCreditSaleModal';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { useWorkerPermissions, useInactivityLogout } from '../features/staff';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { shop, signOut } = useAuthStore();
  const { isWorker, activeWorker, can, exitWorkerSpace } = useWorkerPermissions();

  // Inactivity auto-logout & session revocation heartbeat for worker sessions
  useInactivityLogout();

  const [onlineStatus, setOnlineStatus] = useState(true);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);


  // Dynamic Navigation Items based on active permissions
  const allNavItems: Array<{ to: string; label: string; icon: any; badge?: string; visible: boolean }> = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, visible: can('dashboard') },
    { to: '/customers', label: 'Customers', icon: Users, visible: can('customers', 'view') },
    { to: '/inventory', label: 'Inventory', icon: Package, visible: can('inventory', 'view') },
    { to: '/ledger', label: 'Ledger', icon: BookOpen, visible: can('customers', 'ledger') },
    { to: '/reports', label: 'Reports', icon: BarChart3, visible: can('reports') },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, visible: true },
    { to: '/settings', label: 'Settings', icon: Settings, visible: can('settings') },
  ];

  const navItems = allNavItems.filter((i) => i.visible);

  const shopInitials = isWorker && activeWorker
    ? activeWorker.name.substring(0, 1).toUpperCase()
    : shop?.name ? shop.name.substring(0, 1).toUpperCase() : 'K';

  const shopLocation = [shop?.city, shop?.state].filter(Boolean).join(', ') || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-heading)' }}>
      
      {/* Worker Space Notification Banner (Shown when logged in as Worker) */}
      {isWorker && activeWorker && (
        <div
          style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            padding: '0.45rem 1.5rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            zIndex: 60,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>👷</span>
            <span>
              Worker Space: <strong>{activeWorker.name}</strong> ({activeWorker.emailOrPhone})
            </span>
          </div>

          <button
            onClick={() => {
              exitWorkerSpace();
              navigate('/login');
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <LogOut size={13} />
            <span>Exit to Owner Login</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TOP HORIZONTAL NAVBAR                                         */}
      {/* ------------------------------------------------------------- */}
      <header className="top-navbar">
        {/* Left: Brand Identity */}
        <div className="top-nav-brand-container">
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
              backgroundColor: isWorker ? '#0284C7' : 'var(--primary)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '1.15rem', boxShadow: '0 4px 12px var(--primary-glow)'
            }}>
              {isWorker ? '👷' : 'K'}
            </div>
            <div className="top-nav-brand-text">
              <h1 className="top-nav-brand-title">
                Shop KhattaBook
              </h1>
              <span 
                className="top-nav-brand-subtitle"
                title={isWorker && activeWorker ? `${activeWorker.name} • Worker Space` : shop?.name || 'POS SaaS'}
              >
                {isWorker && activeWorker ? `${activeWorker.name} • Worker Space` : shop?.name || 'POS SaaS'}
              </span>
            </div>
          </NavLink>
        </div>

        {/* Center: Horizontal Navigation Links (Desktop & Tablet) */}
        <nav className="top-nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`top-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span>{item.label}</span>

                {item.badge && (
                  <span style={{
                    backgroundColor: '#8B5CF6', color: '#FFFFFF',
                    fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.4rem',
                    borderRadius: '6px', letterSpacing: '0.05em'
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Actions & User Controls */}
        <div className="top-nav-actions">
          {/* New Sale Button (Protected by permission; hidden on mobile in favor of bottom FAB) */}
          {can('sales', 'create') && (
            <button
              onClick={() => setIsRecordSaleModalOpen(true)}
              className="btn btn-primary top-nav-btn-sale"
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '0.875rem',
                gap: '0.4rem'
              }}
            >
              <Plus size={18} />
              <span>New Sale</span>
            </button>
          )}

          {/* Online/Offline Toggle */}
          <button
            onClick={() => setOnlineStatus(!onlineStatus)}
            className="btn btn-secondary top-nav-status-btn"
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              borderRadius: '12px',
              gap: '0.35rem',
              color: onlineStatus ? '#10B981' : 'var(--text-muted)'
            }}
            title="Toggle Online/Offline mode"
          >
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: onlineStatus ? '#10B981' : '#94A3B8',
              boxShadow: onlineStatus ? '0 0 8px #10B981' : 'none'
            }} />
            <span className="online-status-text">{onlineStatus ? 'Online' : 'Offline'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon top-nav-icon-btn"
            style={{ width: '38px', height: '38px', borderRadius: '12px' }}
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              if (isWorker) {
                exitWorkerSpace();
                navigate('/worker-login');
              } else {
                await signOut();
                navigate('/login');
              }
            }}
            className="btn btn-secondary btn-icon top-nav-icon-btn"
            style={{ width: '38px', height: '38px', borderRadius: '12px', color: '#EF4444' }}
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>

          {/* Shop/Worker Profile Chip */}
          <div
            className="top-nav-avatar"
            style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: isWorker ? '#0284C7' : '#047857', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '0.95rem',
              boxShadow: isWorker ? '0 2px 8px rgba(2, 132, 199, 0.3)' : '0 2px 8px rgba(4, 120, 87, 0.25)',
              cursor: 'pointer'
            }}
            title={isWorker && activeWorker ? `${activeWorker.name} (Worker)` : `${shop?.name || 'Sri Laxmi Traders'}${shopLocation ? ` (${shopLocation})` : ''}`}
          >
            {shopInitials}
          </div>
        </div>
      </header>

      {/* Offline & Sync Status Banner */}
      <OfflineBanner />

      {/* Main Content Router Outlet */}
      <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }} className="mobile-view-container">
        <Outlet />
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Visible ONLY on Mobile < 768px)  */}
      {/* ------------------------------------------------------------- */}
      <nav className="mobile-bottom-nav">
        {can('dashboard') && (
          <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        )}

        {can('customers', 'view') ? (
          <NavLink to="/customers" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Customers</span>
          </NavLink>
        ) : can('inventory', 'view') ? (
          <NavLink to="/inventory" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Package size={20} />
            <span>Inventory</span>
          </NavLink>
        ) : null}

        {/* Center Floating Action Button (FAB) */}
        {can('sales', 'create') && (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setFabMenuOpen(!fabMenuOpen)}
              className="mobile-fab"
              aria-label="Quick Action Menu"
            >
              <Plus size={28} />
            </button>
          </div>
        )}

        {can('customers', 'ledger') && (
          <NavLink to="/ledger" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} />
            <span>Ledger</span>
          </NavLink>
        )}

        {can('settings') ? (
          <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        ) : (
          <NavLink to="/ai-assistant" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Sparkles size={20} />
            <span>AI</span>
          </NavLink>
        )}
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE CENTER FAB QUICK ACTION MENU MODAL SHEET                */}
      {/* ------------------------------------------------------------- */}
      {fabMenuOpen && (
        <div className="modal-overlay" onClick={() => setFabMenuOpen(false)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: '90px',
              left: '1rem',
              right: '1rem',
              maxWidth: '400px',
              margin: '0 auto',
              padding: '1.5rem',
              borderRadius: '28px',
              backgroundColor: 'var(--bg-card)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              animation: 'modal-slide 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Quick Action
              </h3>
              <button onClick={() => setFabMenuOpen(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', padding: '0.4rem' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {can('sales', 'create') && (
                <button
                  onClick={() => { setFabMenuOpen(false); setIsRecordSaleModalOpen(true); }}
                  style={{
                    padding: '1rem', borderRadius: '18px', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  <Plus size={24} />
                  <span>New Sale</span>
                </button>
              )}

              {can('payments', 'receive') && (
                <button
                  onClick={() => { setFabMenuOpen(false); navigate('/payments/receive'); }}
                  style={{
                    padding: '1rem', borderRadius: '18px', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)', color: '#F59E0B',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  <CreditCard size={24} />
                  <span>Receive Payment</span>
                </button>
              )}

              {can('customers', 'add') && (
                <button
                  onClick={() => { setFabMenuOpen(false); navigate('/customers'); }}
                  style={{
                    padding: '1rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', color: 'var(--text-heading)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  <UserPlus size={24} />
                  <span>Add Customer</span>
                </button>
              )}

              {can('inventory', 'add') && (
                <button
                  onClick={() => { setFabMenuOpen(false); navigate('/inventory'); }}
                  style={{
                    padding: '1rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', color: 'var(--text-heading)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  <PackagePlus size={24} />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Credit Sale Modal */}
      <RecordCreditSaleModal
        isOpen={isRecordSaleModalOpen}
        onClose={() => setIsRecordSaleModalOpen(false)}
      />

    </div>
  );
};

export default MainLayout;

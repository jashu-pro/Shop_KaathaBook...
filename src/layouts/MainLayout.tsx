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
  ChevronLeft,
  Sun, 
  Moon,
  Wifi,
  X,
  CreditCard,
  UserPlus,
  PackagePlus
} from 'lucide-react';

import { RecordCreditSaleModal } from '../features/sales/components/RecordCreditSaleModal';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { shop } = useAuthStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/ledger', label: 'Ledger', icon: BookOpen },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'PRO' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const shopInitials = shop?.name ? shop.name.substring(0, 1).toUpperCase() : 'K';
  const shopLocation = [shop?.city, shop?.state].filter(Boolean).join(', ') || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-heading)' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* DESKTOP & TABLET SIDEBAR (Hidden on Mobile < 768px)          */}
      {/* ------------------------------------------------------------- */}
      <aside
        className="desktop-sidebar"
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem 1rem',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxShadow: '4px 0 20px rgba(15, 23, 42, 0.02)'
        }}
      >
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                backgroundColor: 'var(--primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 4px 12px var(--primary-glow)'
              }}>
                K
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-heading)' }}>
                    Shop KhattaBook
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credora POS SaaS</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn btn-secondary btn-icon"
              style={{ padding: '0.4rem', borderRadius: '10px' }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 300ms' }} />
            </button>
          </div>

          {/* New Sale Quick Action Button */}
          <button
            onClick={() => setIsRecordSaleModalOpen(true)}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '18px',
              fontWeight: '700',
              fontSize: '0.95rem',
              marginBottom: '2rem',
              backgroundColor: '#059669',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
            }}
          >
            <Plus size={20} />
            {!sidebarCollapsed && <span>+ New Sale</span>}
          </button>

          {/* Nav Links */}
          {!sidebarCollapsed && (
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '0 0.5rem', marginBottom: '0.75rem', display: 'block' }}>
              MAIN MENU
            </span>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    padding: '0.8rem 1rem',
                    borderRadius: '16px',
                    color: isActive ? 'var(--primary)' : 'var(--text-body)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    fontWeight: isActive ? '700' : '500',
                    transition: 'all 200ms',
                    textDecoration: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <Icon size={20} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {!sidebarCollapsed && item.badge && (
                    <span style={{
                      backgroundColor: '#8B5CF6', color: '#FFFFFF',
                      fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.45rem',
                      borderRadius: '8px', letterSpacing: '0.05em'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Shop Profile Card */}
        <div>
          {!sidebarCollapsed ? (
            <div style={{
              padding: '0.85rem',
              borderRadius: '18px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: '#047857', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '1rem'
                }}>
                  {shopInitials}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {shop?.name || 'Sri Laxmi Traders'}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {shopLocation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#047857', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', margin: '0 auto 0.75rem auto'
            }}>
              {shopInitials}
            </div>
          )}

          {/* Online Toggle & Theme Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setOnlineStatus(!onlineStatus)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.75rem',
                justifyContent: 'center',
                color: onlineStatus ? '#10B981' : 'var(--text-muted)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: onlineStatus ? '#10B981' : '#94A3B8' }} />
              {!sidebarCollapsed && (onlineStatus ? 'Online' : 'Offline')}
            </button>

            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-icon"
              style={{ width: '36px', height: '36px', borderRadius: '12px' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEWPORT CONTAINER (HEADER + MAIN CONTENT)              */}
      {/* ------------------------------------------------------------- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '70px' }} className="mobile-view-container">
        
        {/* TOP APP BAR (Shared Branding for Desktop & Mobile) */}
        <header
          style={{
            height: '74px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)'
          }}
        >
          {/* Left Shop Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              backgroundColor: '#047857', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
            }}>
              {shopInitials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
                  {shop?.name || 'Sri Laxmi Traders'}
                </h2>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                <span>{shopLocation}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Online Status Badge */}
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              padding: '0.4rem 0.75rem',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}>
              <Wifi size={14} />
              <span>Online</span>
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={() => navigate('/ai-assistant')}
              style={{
                width: '38px', height: '38px', borderRadius: '12px',
                backgroundColor: '#8B5CF6', color: '#FFFFFF',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
              title="AI Business Assistant"
            >
              <Sparkles size={18} />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                width: '38px', height: '38px', borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)', color: 'var(--text-heading)',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Main Content Router Outlet */}
        <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Visible ONLY on Mobile < 768px)  */}
      {/* ------------------------------------------------------------- */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/customers" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Customers</span>
        </NavLink>

        {/* Center Floating Action Button (FAB) */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
            className="mobile-fab"
            aria-label="Quick Action Menu"
          >
            <Plus size={28} />
          </button>
        </div>

        <NavLink to="/ledger" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Ledger</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
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
              <button
                onClick={() => { setFabMenuOpen(false); navigate('/sales/new'); }}
                style={{
                  padding: '1rem', borderRadius: '18px', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <Plus size={24} />
                <span>+ New Sale</span>
              </button>

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

              <button
                onClick={() => { setFabMenuOpen(false); navigate('/customers/new'); }}
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

              <button
                onClick={() => { setFabMenuOpen(false); navigate('/inventory/new'); }}
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

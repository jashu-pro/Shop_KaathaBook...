import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  LogOut,
  Check,
  Store,
  ChevronDown,
  Wallet,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  Bell,
  HelpCircle,
} from 'lucide-react';

import { RecordCreditSaleModal } from '../features/sales/components/RecordCreditSaleModal';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { useWorkerPermissions, useInactivityLogout } from '../features/staff';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { shop, shops, user, switchShop, signOut } = useAuthStore();
  const { isWorker, activeWorker, can, exitWorkerSpace } = useWorkerPermissions();

  useInactivityLogout();

  const [onlineStatus, setOnlineStatus] = useState(true);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  /* ── Desktop Navigation Items ── */
  const allNavItems: Array<{ to: string; label: string; icon: any; badge?: string; visible: boolean }> = [
    { to: '/',             label: 'Dashboard',  icon: LayoutDashboard, visible: can('dashboard') },
    { to: '/customers',    label: 'Customers',  icon: Users,           visible: can('customers', 'view') },
    { to: '/inventory',    label: 'Inventory',  icon: Package,         visible: can('inventory', 'view') },
    { to: '/cashbook',     label: 'Cashbook',   icon: Wallet,          visible: can('customers', 'ledger') },
    { to: '/reports',      label: 'Reports',    icon: BarChart3,       visible: can('reports') },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles,      visible: true },
    { to: '/settings',     label: 'Settings',   icon: Settings,        visible: can('settings') },
  ];
  const navItems = allNavItems.filter((i) => i.visible);

  const shopInitials = isWorker && activeWorker
    ? activeWorker.name.substring(0, 1).toUpperCase()
    : shop?.name ? shop.name.substring(0, 1).toUpperCase() : 'K';

  const shopLocation = [shop?.city, shop?.state].filter(Boolean).join(', ') || '';

  /* ── Active route detection for bottom nav ── */
  const isAtCustomers  = location.pathname.startsWith('/customers');
  const isAtCashbook   = location.pathname.startsWith('/cashbook') || location.pathname.startsWith('/ledger');
  const isAtReports    = location.pathname.startsWith('/reports');
  const isAtProfile    = profileSheetOpen;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-heading)' }}>

      {/* Worker Space Notification Banner */}
      {isWorker && activeWorker && (
        <div style={{
          backgroundColor: '#0284C7', color: '#FFFFFF',
          padding: '0.45rem 1.5rem', fontSize: '0.8rem', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', zIndex: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>👷</span>
            <span>Worker Space: <strong>{activeWorker.name}</strong> ({activeWorker.emailOrPhone})</span>
          </div>
          <button
            onClick={() => { exitWorkerSpace(); navigate('/login'); }}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF',
              border: 'none', borderRadius: '8px', padding: '0.2rem 0.65rem',
              fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <LogOut size={13} /><span>Exit to Owner Login</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────── */}
      {/* TOP HORIZONTAL NAVBAR                              */}
      {/* ─────────────────────────────────────────────────── */}
      <header className="top-navbar">
        {/* Left: Brand */}
        <div className="top-nav-brand-container">
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
              backgroundColor: isWorker ? '#0284C7' : 'var(--primary)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '1.15rem', boxShadow: '0 4px 12px var(--primary-glow)',
            }}>
              {isWorker ? '👷' : 'K'}
            </div>
            <div className="top-nav-brand-text">
              <h1 className="top-nav-brand-title">Shop KhattaBook</h1>
              <span className="top-nav-brand-subtitle" title={isWorker && activeWorker ? `${activeWorker.name} • Worker Space` : shop?.name || 'POS SaaS'}>
                {isWorker && activeWorker ? `${activeWorker.name} • Worker Space` : shop?.name || 'POS SaaS'}
              </span>
            </div>
          </NavLink>
        </div>

        {/* Center: Desktop Nav Links */}
        <nav className="top-nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to === '/cashbook' && location.pathname.startsWith('/ledger'));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`top-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="top-nav-actions">
          {can('sales', 'create') && (
            <button
              onClick={() => setIsRecordSaleModalOpen(true)}
              className="btn btn-primary top-nav-btn-sale"
              style={{ padding: '0.55rem 1.15rem', borderRadius: '14px', fontWeight: '700', fontSize: '0.875rem', gap: '0.4rem' }}
            >
              <Plus size={18} /><span>New Sale</span>
            </button>
          )}

          <button
            onClick={() => setOnlineStatus(!onlineStatus)}
            className="btn btn-secondary top-nav-status-btn"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '12px', gap: '0.35rem', color: onlineStatus ? '#10B981' : 'var(--text-muted)' }}
            title="Toggle Online/Offline mode"
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: onlineStatus ? '#10B981' : '#94A3B8', boxShadow: onlineStatus ? '0 0 8px #10B981' : 'none' }} />
            <span className="online-status-text">{onlineStatus ? 'Online' : 'Offline'}</span>
          </button>

          <button onClick={toggleTheme} className="btn btn-secondary btn-icon top-nav-icon-btn" style={{ width: '38px', height: '38px', borderRadius: '12px' }} title="Toggle Theme" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={async () => { if (isWorker) { exitWorkerSpace(); navigate('/worker-login'); } else { await signOut(); navigate('/login'); } }}
            className="btn btn-secondary btn-icon top-nav-icon-btn"
            style={{ width: '38px', height: '38px', borderRadius: '12px', color: '#EF4444' }}
            title="Sign Out" aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>

          {/* Shop Switcher Chip */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { if (!isWorker) setShopMenuOpen(!shopMenuOpen); }}
              className="top-nav-avatar"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                backgroundColor: isWorker ? '#0284C7' : '#047857',
                color: '#FFFFFF', border: 'none', borderRadius: '24px',
                padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                fontWeight: '700', fontSize: '0.85rem',
                boxShadow: isWorker ? '0 2px 8px rgba(2,132,199,0.3)' : '0 2px 8px rgba(4,120,87,0.25)',
                cursor: isWorker ? 'default' : 'pointer',
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                {shopInitials}
              </div>
              {!isWorker && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop?.name || 'Shop'}</span>
                  <ChevronDown size={14} style={{ opacity: 0.8 }} />
                </div>
              )}
            </button>

            {!isWorker && shopMenuOpen && (
              <>
                <div onClick={() => setShopMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px',
                  backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  padding: '0.75rem', zIndex: 999, animation: 'fadeIn 0.15s ease',
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '700' }}>Shop Workspace</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: '600', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'Logged In Account'}</div>
                  </div>
                  <div style={{ padding: '0.5rem 0', maxHeight: '240px', overflowY: 'auto' }}>
                    <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Your Shops ({shops.length > 0 ? shops.length : 1})</div>
                    {(shops.length > 0 ? shops : (shop ? [shop] : [])).map((s) => {
                      const isActive = s.id === shop?.id;
                      return (
                        <button
                          key={s.id}
                          onClick={async () => { if (!isActive) { await switchShop(s.id); queryClient.invalidateQueries(); } setShopMenuOpen(false); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.65rem 0.75rem', borderRadius: '10px', border: 'none',
                            backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                            color: isActive ? '#10B981' : 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: isActive ? '#10B981' : 'rgba(255,255,255,0.08)', color: isActive ? '#FFFFFF' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Store size={16} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: '700', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[s.city, s.state].filter(Boolean).join(', ') || 'Independent Shop'}</div>
                            </div>
                          </div>
                          {isActive && <Check size={16} color="#10B981" />}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => { setShopMenuOpen(false); navigate('/shop-setup'); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px dashed var(--border-color)', backgroundColor: 'transparent', color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', justifyContent: 'center' }}
                    >
                      <Plus size={15} /><span>+ Register New Shop</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <OfflineBanner />

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }} className="mobile-view-container">
        <Outlet />
      </main>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MOBILE BOTTOM NAVIGATION BAR — 4 Tabs + Center FAB        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <nav className="bottom-nav-bar" aria-label="Main navigation">
        {/* Tab 1: Customers (Khata) */}
        <NavLink
          to="/customers"
          className={({ isActive }) => `bottom-nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Customers"
        >
          <div className="bottom-nav-icon-wrap">
            <Users size={22} />
          </div>
          <span className="bottom-nav-label">Khata</span>
        </NavLink>

        {/* Tab 2: Cashbook */}
        <NavLink
          to="/cashbook"
          className={({ isActive }) => `bottom-nav-tab ${isActive || location.pathname.startsWith('/ledger') ? 'active' : ''}`}
          aria-label="Cashbook"
        >
          <div className="bottom-nav-icon-wrap">
            <Wallet size={22} />
          </div>
          <span className="bottom-nav-label">Cashbook</span>
        </NavLink>

        {/* Center FAB */}
        {can('sales', 'create') && (
          <div className="bottom-nav-fab-slot">
            <button
              onClick={() => setFabMenuOpen(!fabMenuOpen)}
              className={`bottom-nav-fab ${fabMenuOpen ? 'fab-open' : ''}`}
              aria-label="Quick actions"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Tab 3: Reports */}
        <NavLink
          to="/reports"
          className={({ isActive }) => `bottom-nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Reports"
        >
          <div className="bottom-nav-icon-wrap">
            <BarChart3 size={22} />
          </div>
          <span className="bottom-nav-label">Reports</span>
        </NavLink>

        {/* Tab 4: Profile */}
        <button
          onClick={() => setProfileSheetOpen(true)}
          className={`bottom-nav-tab ${profileSheetOpen ? 'active' : ''}`}
          aria-label="Profile"
        >
          <div className="bottom-nav-icon-wrap">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Shop" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={22} />
            )}
          </div>
          <span className="bottom-nav-label">Profile</span>
        </button>
      </nav>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FAB QUICK ACTION BOTTOM SHEET                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {fabMenuOpen && (
        <div className="modal-overlay" onClick={() => setFabMenuOpen(false)}>
          <div
            className="glass-panel bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bottom-sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>Quick Action</h3>
              <button onClick={() => setFabMenuOpen(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', padding: '0.4rem' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {can('sales', 'create') && (
                <button
                  onClick={() => { setFabMenuOpen(false); setIsRecordSaleModalOpen(true); }}
                  className="fab-action-card fab-green"
                >
                  <div className="fab-action-icon"><Plus size={26} /></div>
                  <span>New Sale</span>
                </button>
              )}
              {can('payments', 'receive') && (
                <button
                  onClick={() => { setFabMenuOpen(false); navigate('/payments/receive'); }}
                  className="fab-action-card fab-amber"
                >
                  <div className="fab-action-icon"><CreditCard size={26} /></div>
                  <span>Receive Payment</span>
                </button>
              )}
              {can('customers', 'add') && (
                <button
                  onClick={() => { setFabMenuOpen(false); navigate('/customers'); }}
                  className="fab-action-card fab-blue"
                >
                  <div className="fab-action-icon"><UserPlus size={26} /></div>
                  <span>Add Customer</span>
                </button>
              )}
              {can('inventory', 'add') && (
                <button
                  onClick={() => { setFabMenuOpen(false); navigate('/inventory'); }}
                  className="fab-action-card fab-default"
                >
                  <div className="fab-action-icon"><PackagePlus size={26} /></div>
                  <span>Add Product</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* PROFILE BOTTOM SHEET                                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {profileSheetOpen && (
        <div className="modal-overlay" onClick={() => setProfileSheetOpen(false)}>
          <div
            className="glass-panel bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bottom-sheet-handle" />

            {/* Shop Identity Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.25rem 0 1.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                backgroundColor: 'var(--primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '1.5rem', boxShadow: '0 6px 16px var(--primary-glow)',
                overflow: 'hidden',
              }}>
                {shop?.logoUrl
                  ? <img src={shop.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : shopInitials
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shop?.name || 'My Shop'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {shop?.businessType || 'General Store'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
                  {user?.email || user?.phone || ''}
                </div>
              </div>
              <button onClick={() => setProfileSheetOpen(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', padding: '0.35rem', marginLeft: 'auto', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Profile Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { icon: Store, label: 'My Shop', sub: 'Shop details & branding', color: '#10B981', action: () => { setProfileSheetOpen(false); navigate('/settings'); } },
                { icon: ShieldCheck, label: 'Security & Permissions', sub: 'Staff & worker access control', color: '#3B82F6', action: () => { setProfileSheetOpen(false); navigate('/settings'); } },
                { icon: Bell, label: 'Notifications', sub: 'Alerts & reminders', color: '#F59E0B', action: () => { setProfileSheetOpen(false); navigate('/settings'); } },
                { icon: Sparkles, label: 'AI Assistant', sub: 'Smart insights & ledger help', color: '#8B5CF6', action: () => { setProfileSheetOpen(false); navigate('/ai-assistant'); } },
                { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs & contact us', color: '#06B6D4', action: () => { setProfileSheetOpen(false); navigate('/settings'); } },
              ].map(({ icon: Icon, label, sub, color, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: '0.75rem 0.85rem', borderRadius: '16px', border: 'none',
                    backgroundColor: 'transparent', cursor: 'pointer',
                    transition: 'background-color 0.15s ease', textAlign: 'left', width: '100%',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-heading)' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              ))}

              {/* Theme Toggle */}
              <button
                onClick={() => { toggleTheme; toggleTheme(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 0.85rem', borderRadius: '16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(148,163,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {theme === 'dark' ? <Sun size={20} style={{ color: '#F59E0B' }} /> : <Moon size={20} style={{ color: '#6366F1' }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-heading)' }}>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Switch app appearance</div>
                </div>
                <div style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: theme === 'dark' ? '#F59E0B' : 'var(--bg-tertiary)', position: 'relative', transition: 'background-color 0.2s ease', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: theme === 'dark' ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#FFFFFF', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </button>

              {/* Sign Out */}
              <button
                onClick={async () => {
                  setProfileSheetOpen(false);
                  if (isWorker) { exitWorkerSpace(); navigate('/worker-login'); }
                  else { await signOut(); navigate('/login'); }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.75rem 0.85rem', borderRadius: '16px', border: 'none',
                  backgroundColor: 'rgba(239,68,68,0.06)', cursor: 'pointer',
                  textAlign: 'left', width: '100%', marginTop: '0.5rem',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)')}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LogOut size={20} style={{ color: '#EF4444' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#EF4444' }}>Sign Out</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Log out of your account</div>
                </div>
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

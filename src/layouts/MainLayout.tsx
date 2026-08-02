/* layouts/MainLayout.tsx */
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../providers/ThemeProvider';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  History, 
  TrendingUp, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Building2
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { shop, user, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/sales', label: 'Sales Log', icon: History },
    { to: '/reports', label: 'Reports', icon: TrendingUp },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass-header" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-icon"
            style={{ display: 'flex', padding: '0.4rem' }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: 1.2 }}>{shop?.name || 'Shop KhattaBook'}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{shop?.businessType || 'Digital Ledger'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.fullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Merchant</span>
          </div>

          <button onClick={handleLogout} className="btn btn-danger btn-icon" style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Responsive Drawer Menu */}
        <aside 
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'var(--sidebar-width)',
            height: '100%',
            zIndex: 99,
            borderRadius: 0,
            borderTop: 'none',
            borderBottom: 'none',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform var(--transition-normal)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: '1.5rem'
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid transparent',
                    fontWeight: isActive ? '600' : '400',
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Backdrop for open mobile menu drawer */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 98
            }}
          />
        )}

        {/* Content Viewport */}
        <main style={{ flex: 1, padding: '2rem 1.5rem', overflowY: 'auto', maxWidth: '100vw' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

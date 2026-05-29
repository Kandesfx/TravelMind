import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from './ThemeProvider';
import {
  Waves, Compass, Sliders, Brain, TrendingUp, User, LogOut,
  LayoutDashboard, Sun, Moon, Building, Menu, X
} from 'lucide-react';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  const navLinks = [
    { path: '/', label: 'Trang Chủ', icon: Compass },
    { path: '/hotels', label: 'Khách Sạn', icon: Building },
    { path: '/combo-builder', label: 'Tìm Combo', icon: Sliders },
    { path: '/quiz', label: 'Quiz Du Lịch', icon: Brain },
    { path: '/insights', label: 'Khám Phá', icon: TrendingUp },
  ];

  return (
    <nav style={{
      height: '68px',
      borderBottom: scrolled ? '1px solid rgba(14,165,160,0.15)' : '1px solid var(--navbar-border)',
      background: scrolled
        ? 'rgba(6,13,20,0.85)'
        : 'var(--navbar-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      transition: 'all 0.3s ease',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
    }}>

      {/* Brand logo */}
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: '0.65rem',
        textDecoration: 'none', color: 'var(--text-primary)',
        flexShrink: 0,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0ea5a0, #0c8f8a)',
          width: '36px', height: '36px', borderRadius: '10px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: '0 4px 14px rgba(14,165,160,0.45)',
          transition: 'all 0.3s ease',
        }}>
          <Waves size={19} color="white" />
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--text-primary) 0%, rgba(14,165,160,0.9) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          TravelMind
        </span>
      </Link>

      {/* Nav menu — desktop */}
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
                padding: '0.5rem 0.85rem', borderRadius: '10px',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                border: isActive ? '1px solid var(--badge-border)' : '1px solid transparent',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--hover-overlay)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={15} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {auth.logged_in ? (
          <>
            {auth.user?.role === 'admin' && (
              <Link to="/admin" style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                textDecoration: 'none', color: 'var(--text-secondary)',
                fontSize: '0.82rem', fontWeight: 500,
                padding: '0.45rem 0.9rem', borderRadius: '8px',
                background: 'var(--hover-overlay)', border: '1px solid var(--panel-border)',
                transition: 'var(--transition-smooth)',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--badge-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--panel-border)'; }}
              >
                <LayoutDashboard size={13} />
                <span>Admin</span>
              </Link>
            )}

            <Link to="/profile" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--text-primary)', textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 500,
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #0c8f8a)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 2px 8px rgba(14,165,160,0.4)',
                fontSize: '0.75rem', fontWeight: 700, color: 'white',
              }}>
                {(auth.user?.full_name || auth.user?.username || 'U')[0].toUpperCase()}
              </div>
              <span style={{ display: 'none', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {auth.user?.full_name || auth.user?.username}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: '0.4rem',
                borderRadius: '8px', transition: 'var(--transition-smooth)',
              }}
              title="Đăng xuất"
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <Link to="/login" className="glass-button" style={{
            textDecoration: 'none', padding: '0.5rem 1.25rem',
            fontSize: '0.85rem', borderRadius: '9px',
          }}>
            Đăng Nhập
          </Link>
        )}
      </div>
    </nav>
  );
}

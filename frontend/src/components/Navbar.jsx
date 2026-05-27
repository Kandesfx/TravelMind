import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Brain, Compass, Sliders, Calendar, TrendingUp, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { path: '/', label: 'Trang Chủ', icon: Compass },
    { path: '/combo-builder', label: 'Tìm Combo', icon: Sliders },
    { path: '/quiz', label: 'Quiz Du Lịch', icon: Brain },
    { path: '/insights', label: 'Khám Phá', icon: TrendingUp },
  ];

  return (
    <nav style={{
      height: '70px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      background: 'rgba(9, 13, 22, 0.4)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem'
    }}>
      {/* Brand logo */}
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        color: 'white'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #d946ef)',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Brain size={22} color="white" />
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>TravelMind</span>
      </Link>

      {/* Nav Menu */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Icon size={16} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Auth Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {auth.logged_in ? (
          <>
            {auth.user.role === 'admin' && (
              <Link to="/admin" className="glass-button glass-button-secondary" style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '8px'
              }}>
                <LayoutDashboard size={14} />
                <span>Admin Panel</span>
              </Link>
            )}
            <Link to="/profile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <User size={15} color="var(--text-secondary)" />
              </div>
              <span>{auth.user.full_name || auth.user.username}</span>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'var(--transition-smooth)'
              }}
              title="Đăng xuất"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <Link to="/login" className="glass-button" style={{
            textDecoration: 'none',
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            borderRadius: '8px'
          }}>
            Đăng Nhập
          </Link>
        )}
      </div>
    </nav>
  );
}

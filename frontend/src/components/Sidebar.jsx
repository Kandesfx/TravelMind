import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  LayoutDashboard, BarChart2, Briefcase, Gift, Calendar, Image, Ticket, Users, GitMerge, Database,
  FileText, ImageIcon, Video, Library, ClipboardList, History, Key, Activity, LogOut, ArrowLeft
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const menuGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        { path: '/admin', label: 'Dashboard KPI', icon: LayoutDashboard },
        { path: '/admin/reports', label: 'Báo Cáo Hiệu Quả', icon: BarChart2 },
      ]
    },
    {
      title: 'QUẢN LÝ KINH DOANH',
      items: [
        { path: '/admin/combos', label: 'Quản Lý Combo', icon: Briefcase },
        { path: '/admin/promotions', label: 'Chương Trình Ưu Đãi', icon: Gift },
        { path: '/admin/events', label: 'Sự Kiện & Chiến Dịch', icon: Calendar },
        { path: '/admin/banners', label: 'Banners Quảng Cáo', icon: Image },
        { path: '/admin/vouchers', label: 'Quản Lý Vouchers', icon: Ticket },
      ]
    },
    {
      title: 'DỮ LIỆU & MINING',
      items: [
        { path: '/admin/customers', label: 'Phân Khúc Khách Hàng', icon: Users },
        { path: '/admin/rules', label: 'Rules Lab (Mining)', icon: GitMerge },
        { path: '/admin/data', label: 'Dữ Liệu Booking Gốc', icon: Database },
      ]
    },
    {
      title: 'AI STUDIOS',
      items: [
        { path: '/admin/ai/content', label: 'AI Content Studio', icon: FileText },
        { path: '/admin/ai/images', label: 'AI Image Studio', icon: ImageIcon },
        { path: '/admin/ai/videos', label: 'AI Video Studio', icon: Video },
        { path: '/admin/ai/media', label: 'Thư Viện Media', icon: Library },
        { path: '/admin/ai/templates', label: 'Prompt Templates', icon: ClipboardList },
        { path: '/admin/ai/history', label: 'Lịch Sử Duyệt AI', icon: History },
      ]
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { path: '/admin/settings/api-keys', label: 'Khóa API Bảo Mật', icon: Key },
        { path: '/admin/settings/ai-usage', label: 'Sử Dụng AI & Chi Phí', icon: Activity },
      ]
    }
  ];

  return (
    <div style={{
      width: '260px',
      background: 'rgba(9, 13, 22, 0.95)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      {/* Brand area */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #d946ef)',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>TM</span>
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>TravelMind Admin</span>
      </div>

      {/* Navigation Links (Scrollable) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              padding: '0 0.75rem 0.5rem 0.75rem',
              letterSpacing: '0.05em'
            }}>{group.title}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={iIdx}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textDecoration: 'none',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={16} color={isActive ? '#6366f1' : 'rgba(255,255,255,0.5)'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Control area */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.8rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          transition: 'var(--transition-smooth)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          <ArrowLeft size={14} />
          <span>Về Website chính</span>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.8rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={14} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

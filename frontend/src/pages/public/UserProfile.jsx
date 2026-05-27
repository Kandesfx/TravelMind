import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../App';
import { User, ClipboardList, ShieldAlert, Award } from 'lucide-react';

export default function UserProfile() {
  const { auth } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        // Query user bookings from Flask
        const res = await axios.get('/api/public/bookings?user_id=me');
        setBookings(res.data.bookings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserBookings();
  }, []);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Đang tải hồ sơ cá nhân...</div>;
  }

  // Fallback mock bookings if none placed yet
  const userBookings = bookings.length > 0 ? bookings : [
    {
      id: 101,
      hotel_type: "Resort Hotel",
      check_in: "2026-07-15",
      check_out: "2026-07-20",
      total_price: 585.0,
      status: "confirmed"
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }} className="animate-fade-in">
      {/* Left sidebar: User details card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <GlassCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }} hover={false}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '2.2rem',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
          }}>{auth.user?.full_name?.charAt(0) || auth.user?.username?.charAt(0).toUpperCase()}</div>

          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'white' }}>{auth.user?.full_name || auth.user?.username}</h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem', display: 'inline-block' }}>
              Vai trò: {auth.user?.role}
            </span>
          </div>

          <div style={{
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span style={{ color: 'white' }}>{auth.user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tham gia:</span>
              <span style={{ color: 'white' }}>{auth.user?.created_at?.split('T')[0] || '2026-05-23'}</span>
            </div>
          </div>
        </GlassCard>

        {/* Loyalty badge */}
        <GlassCard style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} hover={false}>
          <Award size={36} color="var(--primary)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <h4 style={{ color: 'white', fontSize: '0.95rem' }}>Thành Viên Thân Thiết</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mức ưu đãi thành viên hạng Silver</span>
          </div>
        </GlassCard>
      </div>

      {/* Right container: Bookings history list */}
      <GlassCard style={{ padding: '2rem' }} hover={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
          <ClipboardList size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.35rem', color: 'white' }}>Lịch Sử Đặt Phòng Cá Nhân</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userBookings.map((b) => (
            <div key={b.id} style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ color: 'white', fontSize: '1.05rem', fontWeight: 650 }}>{b.hotel_type}</h4>
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: 'var(--success)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>{b.status}</span>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  Ngày đến: **{b.check_in}** — Ngày đi: **{b.check_out}**
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng hóa đơn</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '0.15rem' }}>${b.total_price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Search, Filter, Calendar, DollarSign, Users, Clock, CheckCircle, XCircle, LogIn, LogOut, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  confirmed: { label: 'Đã xác nhận', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  checked_in: { label: 'Đã nhận phòng', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  completed: { label: 'Hoàn thành', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  canceled: { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function BookingManager() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const fetchBookings = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 15, data_source: 'web' });
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);

    axios.get(`/api/admin/bookings?${params}`)
      .then(res => {
        setBookings(res.data.bookings || []);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    axios.get('/api/admin/bookings/stats')
      .then(res => setStats(res.data))
      .catch(console.error);
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(1); fetchBookings(); };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.put(`/api/admin/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Quản Lý Đơn Đặt Phòng</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tổng {total} đơn đặt phòng qua website</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
        <StatCard icon={Calendar} label="Đặt hôm nay" value={stats.today_bookings || 0} color="#6366f1" />
        <StatCard icon={CheckCircle} label="Đang hoạt động" value={stats.active_bookings || 0} color="#10b981" />
        <StatCard icon={DollarSign} label="Tổng doanh thu" value={`€${(stats.total_revenue || 0).toLocaleString()}`} color="#0ea5e9" />
        <StatCard icon={XCircle} label="Tỷ lệ hủy" value={`${stats.cancel_rate || 0}%`} color="#ef4444" />
        <StatCard icon={LogIn} label="Check-in hôm nay" value={stats.checking_in_today || 0} color="#f59e0b" />
        <StatCard icon={LogOut} label="Check-out hôm nay" value={stats.checking_out_today || 0} color="#8b5cf6" />
      </div>

      {/* Filters */}
      <GlassCard hover={false} style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <input
            type="text" placeholder="Tìm mã đặt phòng, tên khách, email..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="glass-input" style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
          <button onClick={handleSearch} className="glass-button" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Search size={14} /> Tìm
          </button>
        </div>
        <select
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="glass-input" style={{ width: '180px', padding: '0.5rem', fontSize: '0.85rem' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="checked_in">Đã nhận phòng</option>
          <option value="completed">Hoàn thành</option>
          <option value="canceled">Đã hủy</option>
        </select>
        <button onClick={() => { fetchBookings(); fetchStats(); }} className="glass-button glass-button-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} />
        </button>
      </GlassCard>

      {/* Bookings Table */}
      <GlassCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn đặt phòng nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--section-border)' }}>
                <th style={thStyle}>Mã đơn</th>
                <th style={thStyle}>Khách hàng</th>
                <th style={thStyle}>Khách sạn / Phòng</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Check-in</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Đêm</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tổng tiền</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const statusConf = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
                const nights = b.stays_in_weekend_nights + b.stays_in_week_nights;
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--section-border)' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.75rem' }}>{b.booking_code || `#${b.id}`}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{b.guest_name || '—'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.guest_email || ''}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{b.hotel_type}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Room {b.room_type} • {b.meal}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{b.check_in}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{nights}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>€{b.total_price}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ background: statusConf.bg, color: statusConf.color, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {statusConf.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {b.status === 'confirmed' && (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          <ActionBtn label="Check-in" color="#10b981" onClick={() => handleStatusChange(b.id, 'checked_in')} />
                          <ActionBtn label="Hủy" color="#ef4444" onClick={() => handleStatusChange(b.id, 'canceled')} />
                        </div>
                      )}
                      {b.status === 'checked_in' && (
                        <ActionBtn label="Hoàn thành" color="#6366f1" onClick={() => handleStatusChange(b.id, 'completed')} />
                      )}
                      {(b.status === 'completed' || b.status === 'canceled') && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button
              key={p} onClick={() => setPage(p)}
              className={p === page ? 'glass-button' : 'glass-button glass-button-secondary'}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', minWidth: '36px' }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '0.75rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' };
const tdStyle = { padding: '0.75rem 0.75rem' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <GlassCard hover={false} style={{ padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
    </GlassCard>
  );
}

function ActionBtn({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}15`, color, border: `1px solid ${color}30`,
        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem',
        cursor: 'pointer', fontWeight: 600, transition: 'var(--transition-smooth)'
      }}
    >{label}</button>
  );
}

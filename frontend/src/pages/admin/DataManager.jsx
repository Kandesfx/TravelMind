import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Database, Search, ArrowLeft, ArrowRight, Filter, Eye } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MEALS = [
  { value: 'BB', label: 'BB (Bed & Breakfast)' },
  { value: 'HB', label: 'HB (Half Board)' },
  { value: 'FB', label: 'FB (Full Board)' },
  { value: 'SC', label: 'SC (Self Catering)' }
];

export default function DataManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [hotel, setHotel] = useState('');
  const [month, setMonth] = useState('');
  const [meal, setMeal] = useState('');
  const [search, setSearch] = useState('');
  
  // Selected Booking Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        hotel: hotel || undefined,
        month: month || undefined,
        meal: meal || undefined,
        search: search || undefined
      };
      
      const res = await axios.get('/api/admin/data/bookings', { params });
      setBookings(res.data.bookings);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, perPage, hotel, month, meal]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleClearFilters = () => {
    setHotel('');
    setMonth('');
    setMeal('');
    setSearch('');
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Quản Lý Dữ Liệu Gốc (Data Manager)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tra cứu, lọc, và phân tích các giao dịch đặt phòng chi tiết trong cơ sở dữ liệu SQLite.</p>
        </div>
      </div>

      {/* Filter panel */}
      <GlassCard hover={false} style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Loại Khách Sạn</label>
            <select value={hotel} onChange={(e) => { setHotel(e.target.value); setPage(1); }} className="glass-input">
              <option value="">Tất cả loại khách sạn</option>
              <option value="Resort Hotel">Resort Hotel</option>
              <option value="City Hotel">City Hotel</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tháng Đến</label>
            <select value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className="glass-input">
              <option value="">Tất cả các tháng</option>
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gói Ăn Uống</label>
            <select value={meal} onChange={(e) => { setMeal(e.target.value); setPage(1); }} className="glass-input">
              <option value="">Tất cả các gói ăn</option>
              {MEALS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Từ khóa tìm kiếm (Quốc gia / Loại khách)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                placeholder="Nhập mã quốc gia (ví dụ: PRT, GBR) hoặc loại khách..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '2rem', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="glass-button">Tìm Kiếm</button>
            <button type="button" onClick={handleClearFilters} className="glass-button glass-button-secondary">Reset</button>
          </div>
        </form>
      </GlassCard>

      {/* Bookings Table */}
      <GlassCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--section-border)', background: 'var(--input-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="var(--primary)" />
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>Danh Sách Đặt Phòng ({total.toLocaleString()} bookings)</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Số dòng mỗi trang:</span>
            <select value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }} className="glass-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '4rem' }}>Đang tải danh sách đặt phòng...</div>
        ) : bookings.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '4rem' }}>Không tìm thấy đặt phòng nào phù hợp với bộ lọc.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Khách Sạn</th>
                  <th style={{ padding: '1rem' }}>Hủy</th>
                  <th style={{ padding: '1rem' }}>Lead Time (Ngày)</th>
                  <th style={{ padding: '1rem' }}>Thời Gian Đến</th>
                  <th style={{ padding: '1rem' }}>Khách (A/C/B)</th>
                  <th style={{ padding: '1rem' }}>Gói Ăn</th>
                  <th style={{ padding: '1rem' }}>Quốc Gia</th>
                  <th style={{ padding: '1rem' }}>Phân Khúc</th>
                  <th style={{ padding: '1rem' }}>ADR ($)</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>#{b.id}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{b.hotel}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: b.is_canceled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: b.is_canceled ? '#ef4444' : '#10b981',
                        border: b.is_canceled ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        {b.is_canceled ? 'HỦY' : 'OK'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{b.lead_time} ngày</td>
                    <td style={{ padding: '1rem' }}>{b.arrival_date_month} {b.arrival_date_year}</td>
                    <td style={{ padding: '1rem' }}>{b.adults} / {b.children} / {b.babies}</td>
                    <td style={{ padding: '1rem' }}>{b.meal}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{b.country || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{b.market_segment}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>${b.adr?.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => setSelectedBooking(b)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderTop: '1px solid var(--section-border)', background: 'var(--input-bg)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Hiển thị {(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} trên tổng số {total.toLocaleString()} dòng
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="glass-button glass-button-secondary"
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={14} />
              <span>Trước</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Trang {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="glass-button glass-button-secondary"
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Sau</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} className="animate-fade-in">
          <GlassCard style={{ width: '100%', maxWidth: '600px', padding: '2rem' }} hover={false}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
              Chi Tiết Đặt Phòng #{selectedBooking.id}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Khách sạn:</strong> {selectedBooking.hotel}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Trạng thái:</strong> {selectedBooking.is_canceled ? 'Đã Hủy' : 'Không Hủy'}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Số ngày đặt trước (Lead Time):</strong> {selectedBooking.lead_time} ngày</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Năm đến:</strong> {selectedBooking.arrival_date_year}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Tháng đến:</strong> {selectedBooking.arrival_date_month}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Tuần đến trong năm:</strong> {selectedBooking.arrival_date_week_number}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Ngày đến trong tháng:</strong> {selectedBooking.arrival_date_day_of_month}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Số đêm cuối tuần:</strong> {selectedBooking.stays_in_weekend_nights} đêm</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Số đêm trong tuần:</strong> {selectedBooking.stays_in_week_nights} đêm</div>
              </div>
              
              <div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Số người lớn:</strong> {selectedBooking.adults}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Số trẻ em:</strong> {selectedBooking.children}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Số trẻ sơ sinh:</strong> {selectedBooking.babies}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Gói ăn uống:</strong> {selectedBooking.meal}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Quốc gia:</strong> {selectedBooking.country}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Phân khúc thị trường:</strong> {selectedBooking.market_segment}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Kênh phân phối:</strong> {selectedBooking.distribution_channel}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Loại phòng đặt:</strong> Room {selectedBooking.reserved_room_type}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>Đơn giá trung bình (ADR):</strong> ${selectedBooking.adr?.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedBooking(null)} className="glass-button">Đóng</button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

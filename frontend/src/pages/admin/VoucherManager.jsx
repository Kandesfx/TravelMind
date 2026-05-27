import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Ticket, Plus, Edit2, Trash2, Tag, Calendar } from 'lucide-react';

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Form fields
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(10.0);
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minBookingValue, setMinBookingValue] = useState(0.0);
  const [totalQuantity, setTotalQuantity] = useState(100);
  const [maxPerUser, setMaxPerUser] = useState(1);
  const [expiryDate, setExpiryDate] = useState('2026-08-31');
  const [isActive, setIsActive] = useState(true);

  const fetchVouchers = async () => {
    try {
      const res = await axios.get('/api/admin/business/vouchers');
      setVouchers(res.data.vouchers);
    } catch (e) {
      console.error(e);
    } fillnd = () => {
      setLoading(false);
    };
    fetchVouchers().then(fillnd);
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setCode('');
    setDescription('');
    setDiscountType('percent');
    setDiscountValue(10.0);
    setMaxDiscount('');
    setMinBookingValue(0.0);
    setTotalQuantity(100);
    setMaxPerUser(1);
    setExpiryDate('2026-08-31');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (v) => {
    setEditingVoucher(v);
    setCode(v.code);
    setDescription(v.description || '');
    setDiscountType(v.discount_type);
    setDiscountValue(v.discount_value);
    setMaxDiscount(v.max_discount || '');
    setMinBookingValue(v.min_booking_value);
    setTotalQuantity(v.total_quantity);
    setMaxPerUser(v.max_per_user);
    setExpiryDate(v.expiry_date);
    setIsActive(v.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code,
      description,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
      min_booking_value: parseFloat(minBookingValue),
      total_quantity: parseInt(totalQuantity),
      max_per_user: parseInt(maxPerUser),
      expiry_date: expiryDate,
      is_active: isActive
    };

    try {
      if (editingVoucher) {
        await axios.put(`/api/admin/business/vouchers/${editingVoucher.id}`, payload);
      } else {
        await axios.post('/api/admin/business/vouchers', payload);
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa voucher này?')) return;
    try {
      await axios.delete(`/api/admin/business/vouchers/${id}`);
      fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const suggestions = [
    { target: "Nhóm khách hàng công tác (Business)", code: "BIZ2026", desc: "Giảm $15 cho City Hotel vào tháng 12 - tháng 2, kích thích đặt phòng mùa thấp điểm." },
    { target: "Nhóm gia đình (Family)", code: "FAMKIDS", desc: "Giảm 12% cho Resort Hotel mùa hè khi ở từ 5 đêm trở lên (thích hợp với stays_in_week_nights > 3)." }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }} className="animate-fade-in">
      {/* Left list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Quản Lý Mã Giảm Giá (Vouchers)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý phát hành, cấu hình điều kiện và theo dõi sử dụng mã ưu đãi voucher.</p>
          </div>
          <button onClick={openCreateModal} className="glass-button">
            <Plus size={16} />
            <span>Tạo Voucher</span>
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '3rem' }}>Đang tải danh sách voucher...</div>
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }} hover={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
                  <th style={{ padding: '1rem' }}>Mã Code</th>
                  <th style={{ padding: '1rem' }}>Chiết Khấu</th>
                  <th style={{ padding: '1rem' }}>Số Lượng (Đã Dùng)</th>
                  <th style={{ padding: '1rem' }}>Hạn Sử Dụng</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{v.code}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {v.discount_type === 'percent' ? `${v.discount_value}%` : `$${v.discount_value}`}
                    </td>
                    <td style={{ padding: '1rem' }}>{v.total_quantity} ({v.used_count})</td>
                    <td style={{ padding: '1rem' }}>{v.expiry_date}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditModal(v)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}>
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>

      {/* Right suggestions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} hover={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Tag size={20} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Đề Xuất Voucher Theo Phân Khúc</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {suggestions.map((s, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.target}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mã gợi ý: **{s.code}**</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.2rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Editor Modal */}
      {showModal && (
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
          <GlassCard style={{ width: '100%', maxWidth: '500px', padding: '2rem' }} hover={false}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              {editingVoucher ? 'Chỉnh Sửa Voucher' : 'Tạo Voucher Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mã Code (Chữ in hoa)</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="glass-input" required disabled={editingVoucher} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hạn sử dụng</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mô tả ngắn</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input" style={{ minHeight: '60px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Loại giảm giá</label>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="glass-input">
                    <option value="percent">Giảm theo %</option>
                    <option value="fixed">Giảm trực tiếp USD</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mức giảm</label>
                  <input type="number" step="0.1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Giảm tối đa ($)</label>
                  <input type="number" step="0.1" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} className="glass-input" placeholder="Không giới hạn" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đơn tối thiểu ($)</label>
                  <input type="number" step="0.1" value={minBookingValue} onChange={(e) => setMinBookingValue(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tổng số lượng phát hành</label>
                  <input type="number" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} className="glass-input" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lượt dùng tối đa/user</label>
                  <input type="number" value={maxPerUser} onChange={(e) => setMaxPerUser(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Kích hoạt mã sử dụng</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="glass-button glass-button-secondary">Hủy</button>
                <button type="submit" className="glass-button">Lưu</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

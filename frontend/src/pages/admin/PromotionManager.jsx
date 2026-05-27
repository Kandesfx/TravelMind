import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Gift, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PromotionManager() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(10.0);
  const [applyTo, setApplyTo] = useState('Meal_HB');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [sourceInsight, setSourceInsight] = useState('Phát hiện từ luật kết hợp {Group_Family, Hotel_Resort} -> {Meal_HB}');
  const [isActive, setIsActive] = useState(true);

  const fetchPromotions = async () => {
    try {
      const res = await axios.get('/api/admin/business/promotions');
      setPromotions(res.data.promotions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setName('');
    setDescription('');
    setDiscountType('percent');
    setDiscountValue(10.0);
    setApplyTo('Meal_HB');
    setStartDate('2026-06-01');
    setEndDate('2026-08-31');
    setSourceInsight('Phát hiện từ luật kết hợp {Group_Family, Hotel_Resort} -> {Meal_HB}');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingPromo(p);
    setName(p.name);
    setDescription(p.description || '');
    setDiscountType(p.discount_type);
    setDiscountValue(p.discount_value);
    setApplyTo(p.apply_to || '');
    setStartDate(p.start_date);
    setEndDate(p.end_date);
    setSourceInsight(p.source_insight || '');
    setIsActive(p.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      apply_to: applyTo,
      start_date: startDate,
      end_date: endDate,
      source_insight: sourceInsight,
      is_active: isActive
    };

    try {
      if (editingPromo) {
        await axios.put(`/api/admin/business/promotions/${editingPromo.id}`, payload);
      } else {
        await axios.post('/api/admin/business/promotions', payload);
      }
      setShowModal(false);
      fetchPromotions();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa ưu đãi này?')) return;
    try {
      await axios.delete(`/api/admin/business/promotions/${id}`);
      fetchPromotions();
    } catch (err) {
      console.error(err);
    }
  };

  // Mocked automated opportunities detected by rules
  const opportunities = [
    {
      insight: "Tỷ lệ hủy đặt phòng City Hotel tăng vọt vào ngày thường (41.7%)",
      suggestion: "Tạo chương trình 'Ưu đãi ngày thường City Hotel' - Giảm 10% phòng Room_A cho khách đặt không cọc, lưu trú tối đa 2 đêm."
    },
    {
      insight: "71% gia đình đặt Resort mùa hè cần bãi đỗ xe (Parking_Yes)",
      suggestion: "Tạo chiến dịch 'Gia Đình Tự Lái' - Miễn phí bãi đỗ xe kèm bữa tối HB giảm 15% khi đặt phòng trước 30 ngày."
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }} className="animate-fade-in">
      {/* Left side CRUD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Chương Trình Ưu Đãi</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý các chương trình giảm giá và cơ hội tiếp thị.</p>
          </div>
          <button onClick={openCreateModal} className="glass-button">
            <Plus size={16} />
            <span>Tạo Ưu Đãi</span>
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Đang tải danh sách ưu đãi...</div>
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }} hover={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                  <th style={{ padding: '1rem' }}>Tên Ưu Đãi</th>
                  <th style={{ padding: '1rem' }}>Mức Giảm</th>
                  <th style={{ padding: '1rem' }}>Áp Dụng</th>
                  <th style={{ padding: '1rem' }}>Thời Hạn</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr key={promo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'white' }}>{promo.name}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {promo.discount_type === 'percent' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                    </td>
                    <td style={{ padding: '1rem' }}>{promo.apply_to || 'Tất cả'}</td>
                    <td style={{ padding: '1rem' }}>{promo.start_date} ~ {promo.end_date}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditModal(promo)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(promo.id)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}>
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

      {/* Right side suggestions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} hover={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
            <AlertCircle size={20} />
            <h3 style={{ fontSize: '1.15rem', color: 'white' }}>Cơ Hội Phát Hiện Tự Động</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Mining Engine liên tục giám sát các luật kết hợp mới sinh ra và đề xuất các chiến dịch ưu đãi thích hợp để tối ưu doanh thu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {opportunities.map((opp, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>💡 {opp.insight}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{opp.suggestion}</span>
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
            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1.25rem' }}>
              {editingPromo ? 'Chỉnh Sửa Chương Trình' : 'Tạo Chương Trình Ưu Đãi Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tên Ưu Đãi</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mô tả chi tiết</label>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Áp dụng cho dịch vụ</label>
                <input type="text" value={applyTo} onChange={(e) => setApplyTo(e.target.value)} className="glass-input" placeholder="Ví dụ: Meal_HB, Parking..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ngày bắt đầu</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass-input" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ngày kết thúc</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cơ sở dữ liệu (Insight gốc)</label>
                <input type="text" value={sourceInsight} onChange={(e) => setSourceInsight(e.target.value)} className="glass-input" />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Đang hoạt động (Kích hoạt)</span>
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

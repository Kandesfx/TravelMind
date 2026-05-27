import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Image, Plus, Edit2, Trash2 } from 'lucide-react';

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('Đặt Ngay');
  const [ctaLink, setCtaLink] = useState('/');
  const [imageUrl, setImageUrl] = useState('/static/uploads/default_banner.jpg');
  const [position, setPosition] = useState('hero');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = async () => {
    try {
      const res = await axios.get('/api/admin/business/banners');
      setBanners(res.data.banners);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setCtaText('Đặt Ngay');
    setCtaLink('/');
    setImageUrl('/static/uploads/default_banner.jpg');
    setPosition('hero');
    setDisplayOrder(0);
    setStartDate('2026-06-01');
    setEndDate('2026-08-31');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (b) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setCtaText(b.cta_text || 'Đặt Ngay');
    setCtaLink(b.cta_link || '/');
    setImageUrl(b.image_url || '');
    setPosition(b.position);
    setDisplayOrder(b.display_order);
    setStartDate(b.start_date);
    setEndDate(b.end_date);
    setIsActive(b.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      subtitle,
      cta_text: ctaText,
      cta_link: ctaLink,
      image_url: imageUrl,
      position,
      display_order: parseInt(displayOrder),
      start_date: startDate,
      end_date: endDate,
      is_active: isActive
    };

    try {
      if (editingBanner) {
        await axios.put(`/api/admin/business/banners/${editingBanner.id}`, payload);
      } else {
        await axios.post('/api/admin/business/banners', payload);
      }
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này?')) return;
    try {
      await axios.delete(`/api/admin/business/banners/${id}`);
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Quản Lý Banner Quảng Cáo</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý vị trí hiển thị banner tiếp thị trên landing page và các trang sự kiện.</p>
        </div>
        <button onClick={openCreateModal} className="glass-button">
          <Plus size={16} />
          <span>Tạo Banner Mới</span>
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '3rem' }}>Đang tải danh sách banner...</div>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }} hover={false}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
                <th style={{ padding: '1rem' }}>Tiêu Đề Banner (Headline)</th>
                <th style={{ padding: '1rem' }}>Vị Trí</th>
                <th style={{ padding: '1rem' }}>Thứ Tự</th>
                <th style={{ padding: '1rem' }}>Thời Hạn Chạy</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.title}</td>
                  <td style={{ padding: '1rem', textTransform: 'uppercase' }}>{b.position}</td>
                  <td style={{ padding: '1rem' }}>{b.display_order}</td>
                  <td style={{ padding: '1rem' }}>{b.start_date} ~ {b.end_date}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEditModal(b)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}>
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
              {editingBanner ? 'Chỉnh Sửa Banner' : 'Tạo Banner Quảng Cáo Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tiêu đề Headline</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tagline phụ</label>
                <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="glass-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nút CTA Text</label>
                  <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Link CTA đích</label>
                  <input type="text" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vị trí hiển thị</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="glass-input">
                    <option value="hero">Hero slide (Trang chủ)</option>
                    <option value="sidebar">Sidebar widget</option>
                    <option value="popup">Popup quảng cáo</option>
                    <option value="footer">Footer banner</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Thứ tự sắp xếp</label>
                  <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đường dẫn ảnh Banner URL</label>
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="glass-input" required />
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Hiển thị hoạt động</span>
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

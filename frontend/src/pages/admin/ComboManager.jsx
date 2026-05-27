import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Briefcase, Plus, Edit2, Trash2, Eye, FileText, Check, X } from 'lucide-react';

export default function ComboManager() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [services, setServices] = useState('');
  const [price, setPrice] = useState(0.0);
  const [discount, setDiscount] = useState(0.0);
  const [targetGroup, setTargetGroup] = useState('Family');
  const [targetSeason, setTargetSeason] = useState('Summer');
  const [isActive, setIsActive] = useState(true);

  const navigate = useNavigate();

  const fetchCombos = async () => {
    try {
      const res = await axios.get('/api/admin/business/combos');
      setCombos(res.data.combos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const openCreateModal = () => {
    setEditingCombo(null);
    setName('');
    setSlug('');
    setShortDesc('');
    setServices('Resort, HB, Room_D, Parking');
    setPrice(120.0);
    setDiscount(10.0);
    setTargetGroup('Family');
    setTargetSeason('Summer');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingCombo(c);
    setName(c.name);
    setSlug(c.slug);
    setShortDesc(c.short_description || '');
    setServices(c.services.join(', '));
    setPrice(c.price_estimate);
    setDiscount(c.discount_percent);
    setTargetGroup(c.target_group);
    setTargetSeason(c.target_season);
    setIsActive(c.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      slug,
      short_description: shortDesc,
      services: services.split(',').map(s => s.trim()),
      price_estimate: parseFloat(price),
      discount_percent: parseFloat(discount),
      target_group: targetGroup,
      target_season: targetSeason,
      is_active: isActive
    };

    try {
      if (editingCombo) {
        await axios.put(`/api/admin/business/combos/${editingCombo.id}`, payload);
      } else {
        await axios.post('/api/admin/business/combos', payload);
      }
      setShowModal(false);
      fetchCombos();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa combo này?')) return;
    try {
      await axios.delete(`/api/admin/business/combos/${id}`);
      fetchCombos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Quản Lý Combo Du Lịch</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CRUD các gói combo dịch vụ đề xuất liên kết với các luật kết hợp.</p>
        </div>
        <button onClick={openCreateModal} className="glass-button">
          <Plus size={16} />
          <span>Tạo Combo Mới</span>
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Đang tải danh sách combo...</div>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }} hover={false}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                <th style={{ padding: '1rem' }}>Tên Combo</th>
                <th style={{ padding: '1rem' }}>Dịch Vụ</th>
                <th style={{ padding: '1rem' }}>Nhóm Mục Tiêu</th>
                <th style={{ padding: '1rem' }}>Giá Ước Tính</th>
                <th style={{ padding: '1rem' }}>Trạng Thái</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => (
                <tr key={combo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'white' }}>{combo.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {combo.services.map((s, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{combo.target_group} ({combo.target_season})</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>${combo.price_estimate}</td>
                  <td style={{ padding: '1rem' }}>
                    {combo.is_active ? (
                      <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Check size={14} /> Active</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><X size={14} /> Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/admin/ai/content?target_type=combo&target_id=${combo.id}`)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} title="Sinh mô tả AI">
                        <FileText size={14} color="#6366f1" />
                      </button>
                      <button onClick={() => openEditModal(combo)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(combo.id)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}>
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
            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1.25rem' }}>
              {editingCombo ? 'Chỉnh Sửa Gói Combo' : 'Tạo Gói Combo Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tên Combo</label>
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!editingCombo) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} className="glass-input" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>URL Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="glass-input" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mô tả ngắn</label>
                <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="glass-input" style={{ minHeight: '60px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dịch vụ (phân cách bằng dấu phẩy)</label>
                <input type="text" value={services} onChange={(e) => setServices(e.target.value)} className="glass-input" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Giá phòng trung bình ($)</label>
                  <input type="number" step="0.1" value={price} onChange={(e) => setPrice(e.target.value)} className="glass-input" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>% Giảm giá</label>
                  <input type="number" step="0.1" value={discount} onChange={(e) => setDiscount(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nhóm khách hàng</label>
                  <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="glass-input">
                    <option value="Solo">Solo</option>
                    <option value="Couple">Couple</option>
                    <option value="Family">Family</option>
                    <option value="Large">Large Group</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mùa mục tiêu</label>
                  <select value={targetSeason} onChange={(e) => setTargetSeason(e.target.value)} className="glass-input">
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Autumn">Autumn</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Hiển thị trên website chính</span>
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

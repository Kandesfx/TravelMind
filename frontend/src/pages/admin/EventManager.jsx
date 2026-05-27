import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Calendar, Plus, Edit2, Trash2, Link2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [targetAudience, setTargetAudience] = useState('Family');
  const [isActive, setIsActive] = useState(true);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/admin/business/events');
      setEvents(res.data.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setName('');
    setSlug('');
    setDescription('');
    setStartDate('2026-06-01');
    setEndDate('2026-08-31');
    setTargetAudience('Family');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setName(ev.name);
    setSlug(ev.slug);
    setDescription(ev.description || '');
    setStartDate(ev.start_date);
    setEndDate(ev.end_date);
    setTargetAudience(Array.isArray(ev.target_audience) ? ev.target_audience.join(', ') : 'Family');
    setIsActive(ev.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      slug,
      description,
      start_date: startDate,
      end_date: endDate,
      target_audience: targetAudience.split(',').map(s => s.trim()),
      is_active: isActive
    };

    try {
      if (editingEvent) {
        await axios.put(`/api/admin/business/events/${editingEvent.id}`, payload);
      } else {
        await axios.post('/api/admin/business/events', payload);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    try {
      await axios.delete(`/api/admin/business/events/${id}`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Sự Kiện & Chiến Dịch Tiếp Thị</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý các sự kiện lớn và chiến dịch du lịch mùa vụ.</p>
        </div>
        <button onClick={openCreateModal} className="glass-button">
          <Plus size={16} />
          <span>Tạo Sự Kiện Mới</span>
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '3rem' }}>Đang tải danh sách sự kiện...</div>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }} hover={false}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
                <th style={{ padding: '1rem' }}>Tên Sự Kiện</th>
                <th style={{ padding: '1rem' }}>Thời Gian Chạy</th>
                <th style={{ padding: '1rem' }}>Đối Tượng Phục Vụ</th>
                <th style={{ padding: '1rem' }}>Slug</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ev.name}</td>
                  <td style={{ padding: '1rem' }}>{ev.start_date} ~ {ev.end_date}</td>
                  <td style={{ padding: '1rem' }}>
                    {Array.isArray(ev.target_audience) ? ev.target_audience.join(', ') : 'Family'}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>/events/{ev.slug}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/admin/ai/content?target_type=event&target_id=${ev.id}`)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} title="Sinh mô tả chiến dịch bằng AI">
                        <Sparkles size={14} color="#d946ef" />
                      </button>
                      <button onClick={() => openEditModal(ev)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(ev.id)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}>
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
              {editingEvent ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Tiếp Thị Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tên Sự Kiện</label>
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!editingEvent) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} className="glass-input" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>URL Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="glass-input" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mô tả chiến dịch</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="glass-input" style={{ minHeight: '60px' }} />
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
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đối tượng hướng tới (phân cách bằng dấu phẩy)</label>
                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="glass-input" placeholder="Ví dụ: Family, Couple, Solo..." required />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Kích hoạt chạy sự kiện</span>
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

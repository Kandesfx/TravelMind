import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Plus, Edit2, Trash2, Settings, Terminal, Info } from 'lucide-react';

const CONTENT_TYPES = [
  { value: 'combo_desc', label: 'Combo Full Description' },
  { value: 'combo_short', label: 'Combo Tagline/Short Description' },
  { value: 'event_desc', label: 'Event Description' },
  { value: 'event_slogan', label: 'Event Slogan/Slogan' }
];

const TONES = [
  { value: 'friendly', label: 'Friendly (Thân thiện, cởi mở)' },
  { value: 'professional', label: 'Professional (Chuyên nghiệp)' },
  { value: 'luxury', label: 'Luxury (Sang trọng, quý phái)' },
  { value: 'energetic', label: 'Energetic (Trẻ trung, năng lượng)' },
  { value: 'persuasive', label: 'Persuasive (Thuyết phục, chốt sales)' }
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Form inputs
  const [name, setName] = useState('');
  const [contentType, setContentType] = useState('combo_desc');
  const [language, setLanguage] = useState('vi');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [variablesText, setVariablesText] = useState('combo_name, services, price_estimate');
  const [tone, setTone] = useState('friendly');
  const [isActive, setIsActive] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/ai/templates');
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setContentType('combo_desc');
    setLanguage('vi');
    setPromptTemplate('Hãy đóng vai là một chuyên gia viết copywriter du lịch. Tạo ra một mô tả cực kỳ hấp dẫn dài khoảng 100 từ cho gói combo du lịch tên "{combo_name}" bao gồm các dịch vụ cao cấp như: {services}. Gói này được thiết kế riêng cho phân khúc {target_group} du lịch vào mùa {target_season}. Giá dự kiến tầm {price_estimate} USD.');
    setVariablesText('combo_name, services, target_group, target_season, price_estimate');
    setTone('friendly');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingTemplate(t);
    setName(t.name);
    setContentType(t.content_type);
    setLanguage(t.language || 'vi');
    setPromptTemplate(t.prompt_template);
    setVariablesText(Array.isArray(t.variables) ? t.variables.join(', ') : '');
    setTone(t.tone || 'friendly');
    setIsActive(t.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedVariables = variablesText.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      name,
      content_type: contentType,
      language,
      prompt_template: promptTemplate,
      variables: parsedVariables,
      tone,
      is_active: isActive
    };

    try {
      if (editingTemplate) {
        await axios.put(`/api/admin/ai/templates/${editingTemplate.id}`, payload);
      } else {
        await axios.post('/api/admin/ai/templates', payload);
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi lưu template.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa template prompt này?')) return;
    try {
      await axios.delete(`/api/admin/ai/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Prompt Template Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Thiết kế các prompt mẫu tích hợp biến số giúp nhân viên dễ dàng sinh nội dung AI chuẩn hóa.</p>
        </div>
        <button onClick={openCreateModal} className="glass-button">
          <Plus size={16} />
          <span>Tạo Prompt Mẫu Mới</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        {/* Helper Card on Prompt Engineering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
              <Info size={18} />
              <h3 style={{ fontSize: '1rem', color: 'white', fontWeight: 700 }}>Hướng dẫn đặt Biến</h3>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Trong prompt mẫu, bạn có thể chèn các biến số nằm trong dấu ngoặc nhọn dạng `{`biến`}`. Khi chạy AI Studio, hệ thống sẽ tự lấy thông tin từ database để thay vào các biến này.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Terminal size={12} color="var(--primary)" /> Biến khả dụng cho Combo:
              </span>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>`{`combo_name`}`: Tên Combo</li>
                <li>`{`services`}`: Các dịch vụ đính kèm</li>
                <li>`{`target_group`}`: Phân khúc khách hàng mục tiêu</li>
                <li>`{`target_season`}`: Mùa du lịch</li>
                <li>`{`price_estimate`}`: Đơn giá ước lượng</li>
                <li>`{`discount_percent`}`: % giảm giá</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Terminal size={12} color="var(--accent)" /> Biến khả dụng cho Event:
              </span>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>`{`event_name`}`: Tên sự kiện</li>
                <li>`{`start_date`}`: Ngày bắt đầu chạy</li>
                <li>`{`end_date`}`: Ngày kết thúc</li>
                <li>`{`target_audience`}`: Nhóm khách nhắm tới</li>
              </ul>
            </div>
          </GlassCard>
        </div>

        {/* Templates list */}
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Đang tải danh sách prompt template...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {templates.map((tpl) => (
              <GlassCard key={tpl.id} style={{ padding: '1.5rem', position: 'relative' }} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>{tpl.name}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {tpl.content_type}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Language: {tpl.language}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Tone: {tpl.tone}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditModal(tpl)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(tpl.id)} className="glass-button glass-button-secondary" style={{ padding: '0.35rem', borderRadius: '6px' }}>
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.02)', whiteSpace: 'pre-wrap' }}>
                  {tpl.prompt_template}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biến khai báo:</span>
                  {tpl.variables?.map((v, i) => (
                    <span key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                      {v}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
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
          <GlassCard style={{ width: '100%', maxWidth: '600px', padding: '2rem' }} hover={false}>
            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1.25rem' }}>
              {editingTemplate ? 'Chỉnh Sửa Prompt Template' : 'Tạo Prompt Template Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tên mẫu template</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input" placeholder="Ví dụ: Mô tả ngắn combo du lịch hè" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phạm vi (Content Type)</label>
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="glass-input">
                    {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ngôn ngữ</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="glass-input">
                    <option value="vi">Tiếng Việt (vi)</option>
                    <option value="en">Tiếng Anh (en)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Giọng điệu (Tone)</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="glass-input">
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Khai báo danh sách biến (phân cách bằng dấu phẩy)</label>
                <input type="text" value={variablesText} onChange={(e) => setVariablesText(e.target.value)} className="glass-input" placeholder="combo_name, services, price_estimate" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cấu trúc Prompt (Prompt Template)</label>
                <textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  className="glass-input"
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}
                  required
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Hoạt động (Active)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="glass-button glass-button-secondary">Hủy</button>
                <button type="submit" className="glass-button">Lưu Cấu Hình</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

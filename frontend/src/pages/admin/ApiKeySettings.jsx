import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Key, Shield, HelpCircle, AlertCircle, CheckCircle, Wifi, RefreshCw } from 'lucide-react';

export default function ApiKeySettings() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  
  // Form input state
  const [editingProvider, setEditingProvider] = useState(null);
  const [serviceType, setServiceType] = useState('text');
  const [providerName, setProviderName] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-2.0-flash');
  const [monthlyLimit, setMonthlyLimit] = useState(10.0);
  const [isActive, setIsActive] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/settings/ai-providers');
      setProviders(res.data.providers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleEditClick = (p) => {
    setEditingProvider(p);
    setServiceType(p.service_type);
    setProviderName(p.provider_name);
    setApiKey(''); // Do not display existing password for security
    setModelName(p.model_name || '');
    setMonthlyLimit(p.monthly_limit_usd || 10.0);
    setIsActive(p.is_active);
  };

  const handleAddNewClick = () => {
    setEditingProvider(null);
    setServiceType('text');
    setProviderName('gemini');
    setApiKey('');
    setModelName('gemini-2.0-flash');
    setMonthlyLimit(10.0);
    setIsActive(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/settings/ai-providers', {
        service_type: serviceType,
        provider_name: providerName,
        api_key: apiKey || undefined, // only send if filled
        model_name: modelName,
        monthly_limit_usd: parseFloat(monthlyLimit),
        is_active: isActive
      });
      alert('Đã lưu cấu hình khóa API nhà cung cấp thành công!');
      setEditingProvider(null);
      setApiKey('');
      fetchProviders();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi lưu.');
    }
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const res = await axios.post(`/api/admin/settings/ai-providers/${id}/test`);
      alert(res.data.message);
    } catch (err) {
      alert('Không kết nối được tới API của nhà cung cấp.');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🔑 Cấu Hình API Keys & Bảo Mật</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý khóa API của các dịch vụ AI. Khóa được mã hóa bằng AES-256 trước khi ghi vào cơ sở dữ liệu.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Providers list */}
        <GlassCard hover={false} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--primary)" />
              <span>Nhà Cung Cấp AI Dịch Vụ</span>
            </h3>
            <button onClick={handleAddNewClick} className="glass-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              Thêm Mới
            </button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '2rem' }}>Đang tải danh sách khóa API...</div>
          ) : providers.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Chưa cấu hình dịch vụ AI nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {providers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--section-border)',
                    background: 'var(--input-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {p.provider_name}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.35rem',
                        borderRadius: '4px',
                        background: p.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: p.is_active ? '#10b981' : 'var(--text-muted)',
                        border: p.is_active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {p.is_active ? 'HOẠT ĐỘNG' : 'TẠM NGỪNG'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div><strong>Chức năng:</strong> {p.service_type?.toUpperCase()}</div>
                      <div><strong>Model sử dụng:</strong> {p.model_name || 'Mặc định'}</div>
                      <div><strong>Hạn mức tháng:</strong> ${p.monthly_limit_usd?.toFixed(2)} USD</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleTestConnection(p.id)}
                      disabled={testingId === p.id}
                      className="glass-button glass-button-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {testingId === p.id ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
                      <span>Test</span>
                    </button>
                    <button
                      onClick={() => handleEditClick(p)}
                      className="glass-button"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Cấu Hình
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Edit Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard hover={false} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.75rem' }}>
              <Key size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {editingProvider ? `Sửa Dịch Vụ: ${editingProvider.provider_name}` : 'Thêm Dịch Vụ AI'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Loại Dịch Vụ (Service Type)</label>
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="glass-input">
                  <option value="text">Văn bản (LLM Text)</option>
                  <option value="image">Hình ảnh (Image Gen)</option>
                  <option value="video">Dựng video (Video Slideshow)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nhà Cung Cấp (Provider Name)</label>
                <select value={providerName} onChange={(e) => setProviderName(e.target.value)} className="glass-input">
                  <option value="gemini">Google Gemini</option>
                  <option value="stability">Stability AI</option>
                  <option value="ffmpeg">FFmpeg Video Engine</option>
                  <option value="openai">OpenAI (Option)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Khóa API (API Key)</label>
                <input
                  type="password"
                  placeholder={editingProvider ? '•••••••••••••••• (Không đổi để giữ nguyên)' : 'Nhập API key thực tế...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model Name (Tên mô hình kỹ thuật)</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="glass-input"
                  placeholder="gemini-2.0-flash"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hạn mức chi tiêu tháng ($ USD)</label>
                <input
                  type="number"
                  step="0.5"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="glass-input"
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Hiệu lực hoạt động (Is Active)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                {editingProvider && (
                  <button type="button" onClick={() => setEditingProvider(null)} className="glass-button glass-button-secondary">Hủy bỏ</button>
                )}
                <button type="submit" className="glass-button">Lưu Cấu Hình</button>
              </div>
            </form>
          </GlassCard>

          {/* Security Alert */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#10b981', fontSize: '0.75rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Mã hóa AES-256 đảm bảo an toàn tuyệt đối. Kể cả khi cơ sở dữ liệu bị truy cập trái phép, khóa API của bạn vẫn được bảo vệ.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

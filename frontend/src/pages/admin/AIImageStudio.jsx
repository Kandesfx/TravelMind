import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Image, Sparkles, Check, Download, Layers, Sliders, Type } from 'lucide-react';

const STYLES = [
  { value: 'photography', label: 'Chụp ảnh thực tế (Photography)' },
  { value: 'digital_art', label: 'Vẽ kỹ thuật số (Digital Art)' },
  { value: 'anime', label: 'Hoạt hình (Anime)' },
  { value: 'watercolor', label: 'Tranh màu nước (Watercolor)' },
  { value: 'cinematic', label: 'Điện ảnh hoành tráng (Cinematic)' }
];

const RATIOS = [
  { value: '16:9', label: 'Ngang (16:9) - Banner' },
  { value: '1:1', label: 'Vuông (1:1) - Combo' },
  { value: '4:3', label: 'Ngang chuẩn (4:3)' }
];

export default function AIImageStudio() {
  const [loading, setLoading] = useState(false);
  const [combos, setCombos] = useState([]);
  const [events, setEvents] = useState([]);
  const [banners, setBanners] = useState([]);

  // Form inputs
  const [prompt, setPrompt] = useState('');
  const [targetType, setTargetType] = useState('banner');
  const [targetId, setTargetId] = useState('');
  const [style, setStyle] = useState('photography');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Result images
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Overlay Editor Settings (Mock text overlay preview)
  const [overlayText, setOverlayText] = useState('KỲ NGHỈ THIÊN ĐƯỜNG');
  const [overlaySub, setOverlaySub] = useState('Giảm ngay 20% khi đăng ký sớm');
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textYPosition, setTextYPosition] = useState(50); // % from top

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const [cRes, eRes, bRes] = await Promise.all([
          axios.get('/api/admin/business/combos'),
          axios.get('/api/admin/business/events'),
          axios.get('/api/admin/business/banners')
        ]);
        setCombos(cRes.data.combos || []);
        setEvents(eRes.data.events || []);
        setBanners(bRes.data.banners || []);
        
        if (bRes.data.banners?.length > 0) {
          setTargetId(bRes.data.banners[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTargets();
  }, []);

  const handleTargetTypeChange = (e) => {
    const type = e.target.value;
    setTargetType(type);
    if (type === 'banner' && banners.length > 0) setTargetId(banners[0].id);
    else if (type === 'combo' && combos.length > 0) setTargetId(combos[0].id);
    else if (type === 'event' && events.length > 0) setTargetId(events[0].id);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert('Vui lòng nhập Prompt mô tả ảnh.');
      return;
    }
    
    setLoading(true);
    setGeneratedImages([]);
    setSelectedImage(null);
    try {
      const res = await axios.post('/api/admin/ai/media/generate-image', {
        prompt,
        target_type: targetType,
        target_id: parseInt(targetId),
        style,
        aspect_ratio: aspectRatio
      });
      setGeneratedImages(res.data.images || []);
      if (res.data.images?.length > 0) {
        setSelectedImage(res.data.images[0]);
      }
      alert('Tạo ảnh thành công! Hình ảnh đã lưu vào thư viện nháp.');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi tạo ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveImage = async () => {
    if (!selectedImage || !selectedImage.id) return;
    try {
      await axios.post(`/api/admin/ai/media/${selectedImage.id}/status`, {
        status: 'approved'
      });
      alert('Đã phê duyệt hình ảnh và áp dụng trực tiếp lên thực thể tương ứng!');
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi phê duyệt ảnh.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🎨 AI Image Studio</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sinh ảnh minh họa cho combo hoặc banner tiếp thị, thiết kế nhãn chữ nghệ thuật đè trực tiếp.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
        {/* Left config form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Cấu Hình Sinh Ảnh AI</h3>
            </div>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mô tả chi tiết ảnh (Prompt)</label>
                <textarea
                  placeholder="Ví dụ: A luxury beach resort in Maldives at sunset, crystal clear water, palm trees, cinematic light, 8k resolution..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="glass-input"
                  rows={4}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Áp dụng cho</label>
                  <select value={targetType} onChange={handleTargetTypeChange} className="glass-input">
                    <option value="banner">Banner Quảng Cáo</option>
                    <option value="combo">Combo Du Lịch</option>
                    <option value="event">Sự Kiện Tiếp Thị</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Thực thể đích</label>
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="glass-input" required>
                    {targetType === 'banner' && banners.map(b => <option key={b.id} value={b.id}>{b.title} (ID: {b.id})</option>)}
                    {targetType === 'combo' && combos.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
                    {targetType === 'event' && events.map(e => <option key={e.id} value={e.id}>{e.name} (ID: {e.id})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phong cách nghệ thuật</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="glass-input">
                    {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tỷ lệ khung hình</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="glass-input">
                    {RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="glass-button" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                {loading ? 'Đang vẽ ảnh AI...' : 'Tạo Ảnh Minh Họa'}
              </button>
            </form>
          </GlassCard>

          {/* Text Overlay Controller */}
          {selectedImage && (
            <GlassCard style={{ padding: '1.5rem' }} hover={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <Type size={16} color="var(--primary)" />
                <h4 style={{ color: 'white', fontSize: '0.95rem' }}>Trình Xem Đè Nhãn Chữ (Preview Overlay)</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Tiêu đề chính</label>
                  <input type="text" value={overlayText} onChange={(e) => setOverlayText(e.target.value)} className="glass-input" style={{ padding: '0.5rem', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mô tả phụ</label>
                  <input type="text" value={overlaySub} onChange={(e) => setOverlaySub(e.target.value)} className="glass-input" style={{ padding: '0.5rem', fontSize: '0.8rem' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cỡ chữ (px)</label>
                    <input type="number" min="10" max="60" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="glass-input" style={{ padding: '0.5rem', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Màu sắc</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="glass-input" style={{ padding: '0.25rem', height: '34px', width: '100%', cursor: 'pointer' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vị trí dọc (%)</label>
                    <input type="range" min="10" max="90" value={textYPosition} onChange={(e) => setTextYPosition(parseInt(e.target.value))} style={{ cursor: 'pointer', height: '34px' }} />
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right preview window */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading && (
            <div style={{ color: 'white', textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Sparkles size={32} color="var(--primary)" className="animate-pulse" style={{ margin: '0 auto 1rem auto' }} />
              <h3>AI Đang Bắt Đầu Vẽ...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Mô phỏng hoặc gọi API tạo hình ảnh nghệ thuật, quá trình sẽ mất vài giây.</p>
            </div>
          )}

          {!loading && !selectedImage && (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Image size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3>Bảng Preview Trống</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Bản vẽ ảnh AI sau khi hoàn thiện sẽ được hiển thị và thiết lập nhãn tại đây.</p>
            </div>
          )}

          {!loading && selectedImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
              <GlassCard style={{ padding: '1.5rem' }} hover={false}>
                <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Hình Ảnh Gốc Đã Sinh</h4>
                
                {/* Visual canvas for text overlay overlaying on selected image URL */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '1:1' ? '1/1' : '4/3'
                }}>
                  <img
                    src={selectedImage.url}
                    alt="AI Generated"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Overlay layers */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: `${textYPosition}%`,
                      transform: 'translateY(-50%)',
                      width: '90%'
                    }}>
                      <h2 style={{
                        color: textColor,
                        fontSize: `${textSize}px`,
                        fontWeight: 900,
                        textShadow: '2px 2px 8px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5)',
                        fontFamily: 'Outfit',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                      }}>
                        {overlayText}
                      </h2>
                      <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: `${textSize * 0.6}px`,
                        fontWeight: 500,
                        textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                        fontFamily: 'Inter'
                      }}>
                        {overlaySub}
                      </p>
                    </div>
                  </div>

                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
                    {selectedImage.dimensions || '1024x1024'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {generatedImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: selectedImage.url === img.url ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <a href={selectedImage.url} download={`ai-banner-${selectedImage.id}.jpg`} target="_blank" rel="noreferrer" className="glass-button glass-button-secondary">
                      <Download size={16} />
                      <span>Tải Ảnh Gốc</span>
                    </a>

                    <button onClick={handleApproveImage} className="glass-button" style={{ background: 'var(--success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}>
                      <Check size={16} />
                      <span>Áp Dụng Thực Tế (Duyệt)</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

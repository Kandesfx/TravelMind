import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Film, Sparkles, Check, Play, Music, Clock, Plus, Trash2, ArrowRight } from 'lucide-react';

const MUSIC_OPTIONS = [
  { value: 'tropical_vibes', label: 'Tropical Vibes (Hè tươi mát)' },
  { value: 'acoustic_guitar', label: 'Acoustic Guitar (Nhẹ nhàng)' },
  { value: 'chillhop', label: 'Chillhop Beats (Thư giãn, năng động)' },
  { value: 'piano_romance', label: 'Piano Romance (Cặp đôi lãng mạn)' }
];

export default function AIVideoStudio() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  
  // Video settings
  const [music, setMusic] = useState('tropical_vibes');
  const [duration, setDuration] = useState(15);
  
  // Slide subtitle inputs
  const [slides, setSlides] = useState([
    { text: 'Chào mừng bạn đến với thiên đường nghỉ dưỡng' },
    { text: 'Trải nghiệm dịch vụ đẳng cấp 5 sao' },
    { text: 'Đặt trọn gói combo ngay hôm nay để nhận ưu đãi 20%' }
  ]);

  // Video Output
  const [videoResult, setVideoResult] = useState(null);

  const fetchImages = async () => {
    try {
      const res = await axios.get('/api/admin/ai/media?media_type=image');
      setImages(res.data.media || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleAddSlide = () => {
    setSlides([...slides, { text: '' }]);
  };

  const handleRemoveSlide = (idx) => {
    setSlides(slides.filter((_, i) => i !== idx));
  };

  const handleSlideTextChange = (idx, val) => {
    const updated = [...slides];
    updated[idx].text = val;
    setSlides(updated);
  };

  const handleImageToggle = (id) => {
    if (selectedImageIds.includes(id)) {
      setSelectedImageIds(selectedImageIds.filter(x => x !== id));
    } else {
      setSelectedImageIds([...selectedImageIds, id]);
    }
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    if (selectedImageIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ảnh để làm slideshow.');
      return;
    }
    
    setLoading(true);
    setVideoResult(null);
    try {
      const res = await axios.post('/api/admin/ai/media/generate-video', {
        image_ids: selectedImageIds,
        texts: slides.map(s => s.text),
        music,
        duration: parseInt(duration)
      });
      setVideoResult(res.data);
      alert('Dựng video thành công! Video đã lưu vào thư mục lưu trữ.');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi dựng video bằng FFmpeg.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVideo = async () => {
    if (!videoResult || !videoResult.video_id) return;
    try {
      await axios.post(`/api/admin/ai/media/${videoResult.video_id}/status`, {
        status: 'approved'
      });
      alert('Đã phê duyệt video và lưu vào Media Library!');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi phê duyệt video.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🎥 AI Video Studio</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Dựng video slideshow từ thư viện hình ảnh, lồng nhạc nền và tạo phụ đề tự động sử dụng công cụ FFmpeg.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
        {/* Settings & Timeline column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              <Film size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Cấu Hình Trình Dựng Video</h3>
            </div>

            <form onSubmit={handleCreateVideo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Select image library */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>
                  Chọn ảnh từ Thư Viện ({selectedImageIds.length} đã chọn)
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.15)',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {images.map(img => {
                    const isSelected = selectedImageIds.includes(img.id);
                    return (
                      <div
                        key={img.id}
                        onClick={() => handleImageToggle(img.id)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid var(--primary)' : '1.5px solid transparent',
                          cursor: 'pointer',
                          position: 'relative',
                          opacity: isSelected ? 1 : 0.6,
                          transition: 'all 0.2s'
                        }}
                      >
                        <img src={img.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'var(--primary)',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Check size={10} color="white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {images.length === 0 && (
                    <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Chưa có ảnh trong Media Library. Hãy sinh ảnh ở AI Image Studio trước.
                    </div>
                  )}
                </div>
              </div>

              {/* Subtitle / Slides text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>Nội dung phân cảnh (Subtitles)</label>
                  <button type="button" onClick={handleAddSlide} className="glass-button glass-button-secondary" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                    <Plus size={12} /> Add slide
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {slides.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '15px' }}>{idx+1}.</span>
                      <input
                        type="text"
                        value={s.text}
                        onChange={(e) => handleSlideTextChange(idx, e.target.value)}
                        placeholder={`Dòng chữ hiển thị trên slide ${idx+1}...`}
                        className="glass-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', flex: 1 }}
                        required
                      />
                      <button type="button" onClick={() => handleRemoveSlide(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soundtrack & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Music size={12} />
                    <span>Nhạc nền (Soundtrack)</span>
                  </div>
                  <select value={music} onChange={(e) => setMusic(e.target.value)} className="glass-input">
                    {MUSIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Clock size={12} />
                    <span>Thời lượng (Giây)</span>
                  </div>
                  <input type="number" min="5" max="60" value={duration} onChange={(e) => setDuration(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="glass-button" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                {loading ? 'Đang dựng video FFmpeg...' : 'Dựng Slideshow Video'}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Right preview column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading && (
            <div style={{ color: 'white', textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Sparkles size={32} color="var(--primary)" className="animate-pulse" style={{ margin: '0 auto 1rem auto' }} />
              <h3>Đang xử lý Video và Phân cảnh...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Tiến trình đang ghép ảnh, chạy hiệu ứng chuyển cảnh, lồng nhạc nền và biên dịch qua FFmpeg.
              </p>
            </div>
          )}

          {!loading && !videoResult && (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Film size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3>Màn Hình Preview Video</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Chọn ảnh, soạn phụ đề bên trái và bấm dựng. Kết quả MP4 sẽ phát tại đây.</p>
            </div>
          )}

          {!loading && videoResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
              <GlassCard style={{ padding: '1.5rem' }} hover={false}>
                <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Sản Phẩm Video Hoàn Thiện</h4>
                
                <div style={{
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'black',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  aspectRatio: '16/9'
                }}>
                  <video
                    src={videoResult.url}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <div><strong>Thời lượng:</strong> {videoResult.duration} giây</div>
                    <div><strong>Dung lượng:</strong> {videoResult.size_mb?.toFixed(2)} MB</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleApproveVideo} className="glass-button" style={{ background: 'var(--success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}>
                      <Check size={16} />
                      <span>Phê Duyệt Video</span>
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

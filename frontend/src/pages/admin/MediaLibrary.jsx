import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Image, Film, Search, Eye, Calendar, Clock, Trash2, CheckCircle } from 'lucide-react';

export default function MediaLibrary() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(''); // '' (all), 'image', 'video'
  const [searchPrompt, setSearchPrompt] = useState('');
  
  // Modals
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/ai/media';
      if (filterType) {
        url += `?media_type=${filterType}`;
      }
      const res = await axios.get(url);
      setMediaList(res.data.media || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.post(`/api/admin/ai/media/${id}/status`, { status: newStatus });
      alert(`Đã cập nhật trạng thái thành ${newStatus}!`);
      fetchMedia();
      if (selectedMedia && selectedMedia.id === id) {
        setSelectedMedia({ ...selectedMedia, status: newStatus });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  const filteredMedia = mediaList.filter(item => 
    item.prompt_used?.toLowerCase().includes(searchPrompt.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📂 Thư Viện Phương Tiện (Media Library)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý và duyệt lại tất cả các hình ảnh và video do AI khởi tạo trên hệ thống.</p>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Tìm theo prompt đã dùng..."
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '220px' }}
            />
          </div>

          <div style={{ display: 'flex', background: 'var(--input-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--section-border)' }}>
            <button
              onClick={() => setFilterType('')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: filterType === '' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: filterType === '' ? '#818cf8' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setFilterType('image')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: filterType === 'image' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: filterType === 'image' ? '#818cf8' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Hình Ảnh
            </button>
            <button
              onClick={() => setFilterType('video')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: filterType === 'video' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: filterType === 'video' ? '#818cf8' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Videos
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '4rem' }}>Đang tải thư viện phương tiện...</div>
      ) : filteredMedia.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '4rem' }}>Không tìm thấy tệp tin phương tiện nào.</div>
      ) : (
        /* Grid Layout */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {filteredMedia.map((item) => {
            const isVideo = item.media_type === 'video';
            return (
              <GlassCard
                key={item.id}
                style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}
                onClick={() => setSelectedMedia(item)}
              >
                {/* Media Thumbnail */}
                <div style={{
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  position: 'relative'
                }}>
                  {isVideo ? (
                    <video src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}

                  {/* Indicator icon */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '6px',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isVideo ? <Film size={14} color="#0ea5e9" /> : <Image size={14} color="#6366f1" />}
                  </div>

                  {/* Status Indicator */}
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: item.status === 'approved' || item.status === 'in_use' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(245, 158, 11, 0.85)',
                    color: 'var(--text-primary)'
                  }}>
                    {item.status?.toUpperCase() || 'DRAFT'}
                  </span>
                </div>

                {/* Meta details */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.prompt_used || 'No prompt specified'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>ID: #{item.id}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal View Details */}
      {selectedMedia && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} className="animate-fade-in">
          <GlassCard style={{ width: '100%', maxWidth: '650px', padding: '2rem' }} hover={false}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
              Chi Tiết Phương Tiện #{selectedMedia.id} ({selectedMedia.media_type === 'video' ? 'Video' : 'Hình Ảnh'})
            </h3>

            {/* Main Player/Viewer */}
            <div style={{
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'black',
              border: '1px solid rgba(255,255,255,0.08)',
              aspectRatio: '16/9',
              marginBottom: '1.5rem'
            }}>
              {selectedMedia.media_type === 'video' ? (
                <video src={selectedMedia.file_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <img src={selectedMedia.file_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>

            {/* Info details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Đường dẫn file:</strong> <a href={selectedMedia.file_url} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'none' }}>Link file</a></div>
                <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Người khởi tạo:</strong> Admin (ID: {selectedMedia.admin_id || 1})</div>
                <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Trạng thái duyệt:</strong> {selectedMedia.status?.toUpperCase() || 'DRAFT'}</div>
              </div>

              <div>
                <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Kích thước:</strong> {selectedMedia.dimensions || 'N/A'}</div>
                {selectedMedia.media_type === 'video' && (
                  <>
                    <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Thời lượng:</strong> {selectedMedia.duration_seconds} giây</div>
                    <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Dung lượng:</strong> {(selectedMedia.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</div>
                  </>
                )}
                <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: 'var(--text-primary)' }}>Ngày tạo:</strong> {new Date(selectedMedia.created_at).toLocaleString()}</div>
              </div>

              <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Prompt đã sử dụng:</strong>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{selectedMedia.prompt_used}</p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedMedia.status !== 'approved' && selectedMedia.status !== 'in_use' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMedia.id, 'approved')}
                    className="glass-button"
                    style={{ background: 'var(--success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}
                  >
                    <CheckCircle size={16} />
                    <span>Duyệt Phương Tiện</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSelectedMedia(null)} className="glass-button glass-button-secondary">Đóng</button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

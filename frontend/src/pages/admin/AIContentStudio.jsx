import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Sparkles, Check, X, FileText, ChevronRight, MessageSquare, Edit3, Settings } from 'lucide-react';

export default function AIContentStudio() {
  const [activeTab, setActiveTab] = useState('generate'); // generate / queue
  const [loading, setLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  
  // Data for the form
  const [templates, setTemplates] = useState([]);
  const [combos, setCombos] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Form state
  const [contentType, setContentType] = useState('combo_desc');
  const [targetType, setTargetType] = useState('combo');
  const [targetId, setTargetId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [tone, setTone] = useState('friendly');
  
  // Generation results
  const [generatedResult, setGeneratedResult] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(1);
  const [editedText, setEditedText] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Queue state
  const [draftQueue, setDraftQueue] = useState([]);
  const [reviewingContent, setReviewingContent] = useState(null);

  // Fetch form data
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [tplRes, comboRes, evtRes] = await Promise.all([
          axios.get('/api/admin/ai/templates'),
          axios.get('/api/admin/business/combos'),
          axios.get('/api/admin/business/events')
        ]);
        setTemplates(tplRes.data.templates || []);
        setCombos(comboRes.data.combos || []);
        setEvents(evtRes.data.events || []);
        
        if (comboRes.data.combos?.length > 0) {
          setTargetId(comboRes.data.combos[0].id);
        }
        if (tplRes.data.templates?.length > 0) {
          setTemplateId(tplRes.data.templates[0].id);
        }
      } catch (e) {
        console.error('Error fetching form dependency data', e);
      }
    };
    fetchFormData();
  }, []);

  // Fetch draft queue
  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const res = await axios.get('/api/admin/ai/content?status=draft');
      setDraftQueue(res.data.contents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
    }
  }, [activeTab]);

  const handleTargetTypeChange = (e) => {
    const val = e.target.value;
    setTargetType(val);
    if (val === 'combo') {
      setContentType('combo_desc');
      if (combos.length > 0) setTargetId(combos[0].id);
    } else {
      setContentType('event_desc');
      if (events.length > 0) setTargetId(events[0].id);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedResult(null);
    try {
      const res = await axios.post('/api/admin/ai/content/generate', {
        content_type: contentType,
        target_type: targetType,
        target_id: parseInt(targetId),
        template_id: templateId ? parseInt(templateId) : null,
        tone: tone
      });
      setGeneratedResult(res.data);
      // Initialize edit box with version 1
      const defaultText = getVersionText(res.data.versions, 1);
      setEditedText(defaultText);
      setSelectedVersion(1);
      setAdminNote('');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi gọi AI sinh nội dung.');
    } finally {
      setLoading(false);
    }
  };

  const getVersionText = (versions, num) => {
    const found = versions.find(v => v.version === num);
    if (!found) return '';
    
    // Check if the output was a JSON string or object
    if (typeof found.text === 'object') {
      return found.text.full_desc || found.text.description || JSON.stringify(found.text, null, 2);
    }
    
    try {
      const parsed = JSON.parse(found.text);
      return parsed.full_desc || parsed.description || found.text;
    } catch (e) {
      return found.text;
    }
  };

  const handleSelectVersion = (vNum) => {
    setSelectedVersion(vNum);
    if (generatedResult) {
      setEditedText(getVersionText(generatedResult.versions, vNum));
    } else if (reviewingContent) {
      setEditedText(getQueueVersionText(reviewingContent.generated_text, vNum));
    }
  };

  const getQueueVersionText = (generatedText, vNum) => {
    const key = `v${vNum}`;
    const data = generatedText[key] || generatedText['v1'];
    if (typeof data === 'object') {
      return data.full_desc || data.description || JSON.stringify(data, null, 2);
    }
    try {
      const parsed = JSON.parse(data);
      return parsed.full_desc || parsed.description || data;
    } catch (e) {
      return data;
    }
  };

  const handleReview = async (id, action) => {
    try {
      await axios.post(`/api/admin/ai/content/${id}/review`, {
        action,
        selected_version: selectedVersion,
        edited_text: editedText,
        admin_note: adminNote
      });
      
      alert(action === 'approve' ? 'Phê duyệt xuất bản thành công!' : 'Đã từ chối bản nháp.');
      
      // Reset state
      setGeneratedResult(null);
      setReviewingContent(null);
      setEditedText('');
      setAdminNote('');
      
      if (activeTab === 'queue') {
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi phê duyệt.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🤖 AI Content Studio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sinh mô tả combo/sự kiện thông qua prompt template, so sánh các phiên bản và kiểm duyệt.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--input-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--section-border)' }}>
          <button
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'generate' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'generate' ? '#818cf8' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Sinh Nội Dung Mới
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'queue' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'queue' ? '#818cf8' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>Hàng Đợi Duyệt</span>
            {draftQueue.length > 0 && (
              <span style={{ background: 'var(--danger)', color: 'var(--text-primary)', borderRadius: '10px', fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                {draftQueue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
          {/* Form */}
          <GlassCard style={{ padding: '1.5rem', height: 'fit-content' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.75rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Cấu Hình AI Generator</h3>
            </div>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mục Tiêu Lập Mô Tả</label>
                  <select value={targetType} onChange={handleTargetTypeChange} className="glass-input">
                    <option value="combo">Combo Du Lịch</option>
                    <option value="event">Sự Kiện Tiếp Thị</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Loại Nội Dung</label>
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="glass-input">
                    {targetType === 'combo' ? (
                      <>
                        <option value="combo_desc">Mô tả Combo Trọn Gói</option>
                        <option value="combo_short">Mô tả ngắn (Tagline)</option>
                      </>
                    ) : (
                      <>
                        <option value="event_desc">Mô tả Sự Kiện</option>
                        <option value="event_slogan">Slogan truyền thông</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Đối Tượng Thực Tế ({targetType === 'combo' ? combos.length : events.length} mục)
                </label>
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="glass-input" required>
                  {targetType === 'combo' ? (
                    combos.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)
                  ) : (
                    events.map(e => <option key={e.id} value={e.id}>{e.name} (ID: {e.id})</option>)
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prompt Template</label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="glass-input">
                  <option value="">Không dùng template (Sử dụng prompt mặc định)</option>
                  {templates.filter(t => t.content_type === contentType).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Giọng điệu (Tone)</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="glass-input">
                  <option value="friendly">Friendly (Thân thiện, truyền cảm)</option>
                  <option value="professional">Professional (Chuyên nghiệp)</option>
                  <option value="luxury">Luxury (Sang trọng, đẳng cấp)</option>
                  <option value="energetic">Energetic (Năng động, hào hứng)</option>
                  <option value="persuasive">Persuasive (Thuyết phục, kêu gọi hành động)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="glass-button" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                {loading ? 'Đang tạo nội dung...' : 'Tạo Nội Dung Bằng AI'}
              </button>
            </form>
          </GlassCard>

          {/* Results Comparison & Moderation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {loading && (
              <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '5rem', background: 'var(--input-bg)', borderRadius: '16px', border: '1px solid var(--badge-border)' }}>
                <Sparkles size={32} color="var(--primary)" className="animate-pulse" style={{ margin: '0 auto 1rem auto' }} />
                <h3>Đang gửi yêu cầu và đợi phản hồi từ Google Gemini...</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Thông thường mất khoảng 2-4 giây.</p>
              </div>
            )}

            {!loading && !generatedResult && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '5rem', background: 'var(--input-bg)', borderRadius: '16px', border: '1px solid var(--badge-border)' }}>
                <FileText size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3>Studio Sẵn Sàng</h3>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Chọn đối tượng bên trái và bấm nút để bắt đầu sinh văn bản nháp.</p>
              </div>
            )}

            {!loading && generatedResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
                {/* 3 Versions Tabs */}
                <GlassCard hover={false} style={{ padding: '1.5rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '1rem' }}>Bản Phác Thảo AI Tạo Ra (3 Phiên Bản)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleSelectVersion(num)}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          border: selectedVersion === num ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                          background: selectedVersion === num ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.15)',
                          color: selectedVersion === num ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Phiên bản #{num}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {getVersionText(generatedResult.versions, num)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Edit Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Edit3 size={14} />
                        <span>Biên Tập Lại Nội Dung Của Bản #{selectedVersion}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cập nhật trực tiếp trước khi duyệt</span>
                    </div>

                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="glass-input"
                      rows={8}
                      style={{ resize: 'vertical', fontSize: '0.85rem', width: '100%', lineHeight: 1.6 }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ghi chú duyệt (Note)</label>
                      <input
                        type="text"
                        placeholder="Lý do chỉnh sửa hoặc ghi chú tiếp thị..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleReview(generatedResult.content_id, 'reject')}
                        className="glass-button glass-button-secondary"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                      >
                        <X size={16} />
                        <span>Từ Chối Duyệt</span>
                      </button>

                      <button
                        onClick={() => handleReview(generatedResult.content_id, 'approve')}
                        className="glass-button"
                        style={{ background: 'var(--success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}
                      >
                        <Check size={16} />
                        <span>Phê Duyệt & Xuất Bản</span>
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Moderator Queue view */
        <div style={{ display: 'grid', gridTemplateColumns: reviewingContent ? '1.2fr 2fr' : '1fr', gap: '2rem' }}>
          {/* List of drafts */}
          <GlassCard style={{ padding: '1.5rem', height: 'fit-content' }} hover={false}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--primary)" />
              <span>Danh Sách Bản Nháp Đang Chờ Duyệt ({draftQueue.length})</span>
            </h3>

            {queueLoading ? (
              <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '2rem' }}>Đang tải hàng đợi...</div>
            ) : draftQueue.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Hàng đợi duyệt trống.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {draftQueue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setReviewingContent(item);
                      setSelectedVersion(1);
                      setEditedText(getQueueVersionText(item.generated_text, 1));
                      setAdminNote('');
                    }}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: reviewingContent?.id === item.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                      background: reviewingContent?.id === item.id ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {item.target_type === 'combo' ? `Combo ID: ${item.combo_id}` : `Event ID: ${item.event_id}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        Tạo lúc: {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Details & editing of the draft in queue */}
          {reviewingContent && (
            <GlassCard hover={false} style={{ padding: '1.5rem' }} className="animate-fade-in">
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                Chi Tiết Bản Nháp #{reviewingContent.id}
              </h4>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>Prompt Used:</strong> {reviewingContent.prompt_used}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Đối Tượng:</strong> {reviewingContent.target_type} (#{reviewingContent.target_id})</div>
              </div>

              {/* 3 Version Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSelectVersion(num)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: selectedVersion === num ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                      background: selectedVersion === num ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.15)',
                      color: selectedVersion === num ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      textAlign: 'left'
                    }}
                  >
                    <strong>Bản #{num}</strong>
                  </button>
                ))}
              </div>

              {/* Edit textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Biên Tập Bản Nháp #{reviewingContent.id} (Version {selectedVersion})</div>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="glass-input"
                  rows={8}
                  style={{ resize: 'vertical', fontSize: '0.85rem', width: '100%', lineHeight: 1.6 }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ý Kiến Kiểm Duyệt</label>
                  <input
                    type="text"
                    placeholder="Ghi chú tại sao duyệt/từ chối..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="glass-input"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => handleReview(reviewingContent.id, 'reject')}
                    className="glass-button glass-button-secondary"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                  >
                    <X size={16} />
                    <span>Từ Chối</span>
                  </button>

                  <button
                    onClick={() => handleReview(reviewingContent.id, 'approve')}
                    className="glass-button"
                    style={{ background: 'var(--success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}
                  >
                    <Check size={16} />
                    <span>Duyệt & Đăng</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

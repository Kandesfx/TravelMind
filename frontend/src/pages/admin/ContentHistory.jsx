import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { History, Search, FileText, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';

export default function ContentHistory() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' (all), 'approved', 'rejected'
  const [expandedId, setExpandedId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/ai/history');
      setHistoryList(res.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredHistory = historyList.filter(item => {
    const promptMatch = item.prompt_used?.toLowerCase().includes(search.toLowerCase());
    const textMatch = item.edited_text?.toLowerCase().includes(search.toLowerCase());
    const noteMatch = item.admin_note?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = promptMatch || textMatch || noteMatch;
    
    if (statusFilter === '') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📜 Nhật Ký Kiểm Duyệt (Content History)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nhật ký kiểm toán ghi lại tất cả các quyết định kiểm duyệt nội dung AI của ban quản trị.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung, ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '220px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input"
            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="approved">Đã phê duyệt (Approved)</option>
            <option value="rejected">Đã từ chối (Rejected)</option>
          </select>
        </div>
      </div>

      <GlassCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)' }}>
          <History size={18} color="var(--primary)" />
          <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>Nhật Ký Kiểm Duyệt Hệ Thống ({filteredHistory.length} mục)</h3>
        </div>

        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Đang tải nhật ký kiểm duyệt...</div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>Không tìm thấy lịch sử kiểm duyệt nào.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                  <th style={{ padding: '1rem' }}>Mã Duyệt</th>
                  <th style={{ padding: '1rem' }}>Loại Nội Dung</th>
                  <th style={{ padding: '1rem' }}>Đối Tượng Đích</th>
                  <th style={{ padding: '1rem' }}>Thời Gian</th>
                  <th style={{ padding: '1rem' }}>Trạng Thái</th>
                  <th style={{ padding: '1rem' }}>Ghi Chú Admin</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Văn Bản</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const isApproved = item.status === 'approved';
                  const isExpanded = expandedId === item.id;
                  
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.03)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleToggleExpand(item.id)}
                      >
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'white' }}>#{item.id}</td>
                        <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{item.content_type?.replace('_', ' ')}</td>
                        <td style={{ padding: '1rem' }}>
                          {item.target_type} (#{item.target_id})
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isApproved ? '#10b981' : '#ef4444',
                            border: isApproved ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            {isApproved ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            <span>{item.status?.toUpperCase()}</span>
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.admin_note || '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)' }}>
                          <span style={{ fontSize: '0.8rem', textDecoration: 'underline' }}>
                            {isExpanded ? 'Đóng' : 'Xem'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td colSpan={7} style={{ padding: '1rem 1.5rem 1.5rem 1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <div><strong style={{ color: 'white' }}>Người duyệt:</strong> Admin (ID: {item.reviewed_by || 1})</div>
                                  <div><strong style={{ color: 'white' }}>Phiên bản đã chọn:</strong> Bản #{item.selected_version || 1}</div>
                                  <div><strong style={{ color: 'white' }}>Prompt đã chạy:</strong></div>
                                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', fontStyle: 'monospace', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    {item.prompt_used}
                                  </div>
                                </div>
                                
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                  <strong style={{ color: 'white', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Văn bản xuất bản cuối cùng:</strong>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                    {item.edited_text || 'Không có văn bản xuất bản (Đã bị Từ chối).'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

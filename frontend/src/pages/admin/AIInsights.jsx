import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Brain, Lightbulb, Sparkles, Send, Check, AlertCircle, RefreshCw, MessageSquare, Tag, ArrowRight, HelpCircle } from 'lucide-react';

export default function AIInsights() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  
  // AI Insights State
  const [summary, setSummary] = useState('');
  const [strategies, setStrategies] = useState([]);
  
  // Promotion Suggestions State
  const [promotions, setPromotions] = useState([]);
  const [createdVouchers, setCreatedVouchers] = useState({}); // voucher_code -> boolean
  const [creatingVoucherCode, setCreatingVoucherCode] = useState('');

  // Business Q&A State
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const fetchData = async (configId = '') => {
    setLoading(true);
    try {
      // First, get rule configs from the rules lab so the user can select which run to analyze
      const rulesRes = await axios.get('/api/admin/rules');
      const allConfigs = rulesRes.data.configs || [];
      setConfigs(allConfigs);

      let targetConfigId = configId;
      if (!targetConfigId && allConfigs.length > 0) {
        targetConfigId = allConfigs[0].id;
      }
      setSelectedConfigId(targetConfigId);

      if (targetConfigId) {
        // Fetch AI Insight Summary
        const insightRes = await axios.get(`/api/admin/rules/insights?config_id=${targetConfigId}`);
        setSummary(insightRes.data.summary || '');
        setStrategies(insightRes.data.strategies || []);

        // Fetch AI Promotion suggestions
        const promoRes = await axios.get(`/api/admin/rules/promotions?config_id=${targetConfigId}`);
        setPromotions(promoRes.data.promotions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfigChange = (e) => {
    const cid = e.target.value;
    setSelectedConfigId(cid);
    fetchData(cid);
  };

  const handleCreateVoucher = async (promo) => {
    const code = promo.suggested_voucher_code || `AI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setCreatingVoucherCode(code);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90); // 3 months expiry
      const expiryStr = expiry.toISOString().split('T')[0];

      await axios.post('/api/admin/business/vouchers', {
        code: code,
        description: promo.description,
        discount_type: promo.discount_type === 'fixed' ? 'fixed' : 'percent',
        discount_value: parseFloat(promo.discount_value),
        min_booking_value: promo.discount_type === 'fixed' ? 100.0 : 0.0,
        expiry_date: expiryStr,
        total_quantity: 150,
        is_active: true
      });

      setCreatedVouchers(prev => ({ ...prev, [code]: true }));
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể tạo Voucher.');
    } finally {
      setCreatingVoucherCode('');
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question;
    setQuestion('');
    setQaLoading(true);

    // Add to chat history immediately
    setChatHistory(prev => [...prev, { role: 'user', content: userQ }]);

    try {
      const res = await axios.post('/api/admin/rules/qa', { question: userQ });
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        metrics: res.data.metrics_referenced,
        advice: res.data.business_advice
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.'
      }]);
    } finally {
      setQaLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} className="spin" style={{ marginBottom: '1rem' }} />
        <div>AI đang phân tích các luật kết hợp và lập báo cáo insight...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} color="#8b5cf6" /> Trợ Lý Quản Trị AI Insights
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Khai thác tri thức từ các luật kết hợp để hỗ trợ quyết định kinh doanh
          </p>
        </div>

        {/* Config selector */}
        {configs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phiên khai phá:</span>
            <select
              value={selectedConfigId}
              onChange={handleConfigChange}
              className="glass-input"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: '220px' }}
            >
              {configs.map(c => (
                <option key={c.id} value={c.id}>
                  Run #{c.id} ({c.algorithm}) — {new Date(c.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid: AI Summary & Promotion Suggestion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        
        {/* Left: AI Summary / Strategies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
              <Brain size={18} color="var(--primary)" /> Tóm Tắt Xu Hướng & Hành Vi (AI)
            </h2>
            
            {/* Summary Text Render (Markdown replacement helper) */}
            <div style={{
              fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7,
              whiteSpace: 'pre-line'
            }}>
              {summary}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
              <Lightbulb size={18} color="var(--warning)" /> Chiến Lược Đề Xuất
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {strategies.map((strat, i) => (
                <div key={i} style={{
                  padding: '1rem', background: 'var(--input-bg)', border: '1px solid var(--section-border)',
                  borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{strat.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                    Dựa trên: {strat.basis_rule}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {strat.action_plan}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem' }}>
                    🚀 Lợi ích dự kiến: {strat.expected_benefit}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right: Suggested Promotions & Business Q&A */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Promotion Generator */}
          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
              <Tag size={18} color="var(--success)" /> Đề Xuất Mã Khuyến Mãi (AI)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {promotions.map((promo, idx) => {
                const code = promo.suggested_voucher_code;
                const isCreated = createdVouchers[code];

                return (
                  <div key={idx} style={{
                    padding: '0.9rem', border: '1px solid var(--section-border)', borderRadius: '10px',
                    background: isCreated ? 'rgba(16,185,129,0.04)' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: '0.35rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{promo.name}</span>
                      <span style={{
                        background: 'var(--badge-bg)', border: '1px solid var(--badge-border)',
                        padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600
                      }}>
                        {promo.discount_type === 'percent' ? `Giảm ${promo.discount_value}%` : `Giảm €${promo.discount_value}`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {promo.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.7rem' }}>
                      <span>Nhóm đích: <strong>{promo.target_group}</strong></span>
                      <span>•</span>
                      <span>Mùa: <strong>{promo.target_season}</strong></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--section-border)', paddingTop: '0.5rem', marginTop: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{code}</span>
                      {isCreated ? (
                        <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Đã kích hoạt
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateVoucher(promo)}
                          disabled={creatingVoucherCode === code}
                          className="glass-button"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem', borderRadius: '4px' }}
                        >
                          {creatingVoucherCode === code ? 'Đang tạo...' : 'Kích hoạt ngay'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Business Q&A Chat */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} hover={false}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem', margin: 0 }}>
              <MessageSquare size={18} color="#0ea5e9" /> Hỏi Đáp Kinh Doanh
            </h2>
            
            {/* Chat Messages */}
            <div style={{
              height: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem',
              padding: '0.5rem', background: 'var(--input-bg)', borderRadius: '10px', border: '1px solid var(--section-border)'
            }}>
              {chatHistory.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.5rem' }}>
                  <HelpCircle size={32} opacity={0.3} />
                  <span style={{ fontSize: '0.75rem', textAlign: 'center', padding: '0 1rem' }}>
                    Hỏi AI về hoạt động kinh doanh (Ví dụ: "Hạng phòng nào mang lại doanh thu tốt nhất trong mùa hè?")
                  </span>
                </div>
              )}

              {chatHistory.map((chat, idx) => (
                <div key={idx} style={{
                  alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: chat.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                  border: chat.role === 'user' ? 'none' : '1px solid var(--section-border)',
                  color: chat.role === 'user' ? 'white' : 'var(--text-primary)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  lineHeight: 1.5
                }}>
                  <div style={{ whiteSpace: 'pre-line' }}>{chat.content}</div>
                  
                  {/* Additional Metrics / Advice */}
                  {chat.metrics && chat.metrics.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                      {chat.metrics.map((m, k) => (
                        <span key={k} style={{
                          background: 'rgba(255,255,255,0.1)', color: chat.role === 'user' ? 'white' : 'var(--primary)',
                          padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem'
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {chat.advice && (
                    <div style={{
                      marginTop: '0.5rem', padding: '0.4rem', borderRadius: '6px',
                      background: 'rgba(16,185,129,0.06)', borderLeft: '3px solid var(--success)',
                      color: 'var(--text-secondary)', fontSize: '0.75rem'
                    }}>
                      💡 Gợi ý AI: {chat.advice}
                    </div>
                  )}
                </div>
              ))}

              {qaLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  AI đang suy nghĩ và tính toán...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Hỏi trợ lý kinh doanh..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={qaLoading}
                className="glass-input"
                style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={qaLoading || !question.trim()}
                className="glass-button"
                style={{ padding: '0.5rem' }}
              >
                <Send size={16} />
              </button>
            </form>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}

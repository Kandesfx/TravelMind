import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import Plotly from 'plotly.js-dist-min';
import { Settings, Play, Table, BarChart3, AlertTriangle, Filter, RefreshCw } from 'lucide-react';

const ALL_FEATURES = [
  { id: 'Hotel_Type', label: 'Hotel Type (Resort / City)' },
  { id: 'Meal_Type', label: 'Meal Type (BB, HB, FB, SC)' },
  { id: 'Room_Type', label: 'Room Type (A, B, C, etc.)' },
  { id: 'Customer_Type', label: 'Customer Type' },
  { id: 'Channel', label: 'Distribution Channel' },
  { id: 'Deposit', label: 'Deposit Type' },
  { id: 'Group_Size', label: 'Group Size (Solo, Couple, Family)' },
  { id: 'Season', label: 'Season (Spring, Summer, etc.)' },
  { id: 'Price_Range', label: 'Price Range (Budget, Mid, Premium)' },
  { id: 'Lead_Time', label: 'Lead Time' },
  { id: 'Weekend_Stay', label: 'Weekend Stay nights' },
  { id: 'Weekday_Stay', label: 'Weekday Stay nights' },
  { id: 'Special_Requests', label: 'Special Requests' },
  { id: 'Parking', label: 'Parking Space Requirements' },
  { id: 'Repeat_Guest', label: 'Repeat Guest Status' }
];

export default function RulesLab() {
  const [configs, setConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Settings
  const [algorithm, setAlgorithm] = useState('fpgrowth');
  const [minSupport, setMinSupport] = useState(0.05);
  const [minConfidence, setMinConfidence] = useState(0.50);
  const [minLift, setMinLift] = useState(1.20);
  const [selectedFeatures, setSelectedFeatures] = useState(ALL_FEATURES.map(f => f.id));
  
  // Results view options
  const [minConfidenceFilter, setMinConfidenceFilter] = useState(0.50);
  const [sortBy, setSortBy] = useState('lift');
  const [limit, setLimit] = useState(50);
  const [searchRule, setSearchRule] = useState('');

  const fetchConfigsAndRules = async (configId = null) => {
    setLoading(true);
    try {
      let url = `/api/admin/rules?sort=${sortBy}&limit=${limit}&min_confidence=${minConfidenceFilter}`;
      if (configId) {
        url += `&config_id=${configId}`;
      }
      const res = await axios.get(url);
      setRules(res.data.rules || []);
      setConfigs(res.data.configs || []);
      if (res.data.selected_config_id) {
        setSelectedConfigId(res.data.selected_config_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigsAndRules();
  }, [minConfidenceFilter, sortBy, limit]);

  const handleSelectConfig = (e) => {
    const cid = e.target.value;
    setSelectedConfigId(cid);
    fetchConfigsAndRules(cid);
  };

  const handleFeatureToggle = (fid) => {
    if (selectedFeatures.includes(fid)) {
      setSelectedFeatures(selectedFeatures.filter(id => id !== fid));
    } else {
      setSelectedFeatures([...selectedFeatures, fid]);
    }
  };

  const handleRunMining = async (e) => {
    e.preventDefault();
    if (selectedFeatures.length < 2) {
      alert('Vui lòng chọn ít nhất 2 thuộc tính để khai phá luật.');
      return;
    }
    
    if (algorithm === 'apriori' && minSupport < 0.05) {
      const confirmRun = window.confirm(
        'CẢNH BÁO: Thuật toán Apriori chạy với ngưỡng Support thấp (< 5%) trên tập dữ liệu lớn có thể gây đơ server hoặc mất nhiều phút. Bạn có muốn chuyển sang FP-Growth hoặc tiếp tục?'
      );
      if (!confirmRun) return;
    }

    setRunning(true);
    try {
      const res = await axios.post('/api/admin/rules/run', {
        algorithm,
        min_support: parseFloat(minSupport),
        min_confidence: parseFloat(minConfidence),
        min_lift: parseFloat(minLift),
        features: selectedFeatures,
        only_successful: true
      });
      alert(`Chạy thành công! Đã tạo ra ${res.data.total_rules} luật trong ${res.data.execution_time_seconds}s.`);
      fetchConfigsAndRules(res.data.config_id);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra trong quá trình chạy khai phá.');
    } finally {
      setRunning(false);
    }
  };

  // Render scatter plot using Plotly
  useEffect(() => {
    if (loading || rules.length === 0) return;

    const xData = rules.map(r => r.support);
    const yData = rules.map(r => r.confidence);
    const zData = rules.map(r => r.lift);
    const textData = rules.map(r => `${(r.antecedent || []).join(', ')} -> ${(r.consequent || []).join(', ')}<br>Lift: ${r.lift.toFixed(3)}`);

    const scatterData = [{
      x: xData,
      y: yData,
      mode: 'markers',
      marker: {
        size: 10,
        color: zData,
        colorscale: 'Portland',
        showscale: true,
        colorbar: {
          title: 'Lift',
          tickfont: { color: '#94a3b8' },
          titlefont: { color: 'var(--text-primary)' }
        }
      },
      text: textData,
      type: 'scatter'
    }];

    const scatterLayout = {
      title: {
        text: 'Phân Bố Luật Kết Hợp (Support vs Confidence vs Lift)',
        font: { color: 'var(--text-primary)', family: 'Outfit', size: 16 }
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#94a3b8' },
      xaxis: {
        title: 'Support (Độ Phổ Biến)',
        gridcolor: 'rgba(255,255,255,0.05)',
        tickfont: { color: '#94a3b8' },
        titlefont: { color: '#94a3b8' }
      },
      yaxis: {
        title: 'Confidence (Độ Tin Cậy)',
        gridcolor: 'rgba(255,255,255,0.05)',
        tickfont: { color: '#94a3b8' },
        titlefont: { color: '#94a3b8' }
      },
      margin: { l: 60, r: 20, t: 50, b: 50 }
    };

    Plotly.newPlot('rules-scatter-plot', scatterData, scatterLayout, { responsive: true, displayModeBar: false });
  }, [loading, rules]);

  const filteredRules = rules.filter(r => {
    const textStr = `${(r.antecedent || []).join(' ')} ${(r.consequent || []).join(' ')}`.toLowerCase();
    return textStr.includes(searchRule.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Phòng Thí Nghiệm Luật (Rules Lab)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Chạy các cấu hình thuật toán khác nhau, quản lý các tập luật kết hợp và chọn dữ liệu gợi ý.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Settings panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--section-border)', paddingBottom: '0.75rem' }}>
              <Settings size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Cấu Hình Thuật Toán</h3>
            </div>

            <form onSubmit={handleRunMining} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Thuật toán</label>
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="glass-input">
                  <option value="fpgrowth">FP-Growth (Được khuyên dùng)</option>
                  <option value="apriori">Apriori</option>
                </select>
              </div>

              {algorithm === 'apriori' && (
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#f59e0b', fontSize: '0.75rem' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>Apriori quét dữ liệu nhiều lần và có thể chạy rất chậm với support nhỏ. Hãy thận trọng.</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min Support</label>
                  <input type="number" step="0.001" min="0.001" max="1" value={minSupport} onChange={(e) => setMinSupport(e.target.value)} className="glass-input" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min Confidence</label>
                  <input type="number" step="0.01" min="0.01" max="1" value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)} className="glass-input" required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min Lift (Ngưỡng tương quan)</label>
                <input type="number" step="0.05" min="0.5" max="10" value={minLift} onChange={(e) => setMinLift(e.target.value)} className="glass-input" required />
              </div>

              {/* Feature selections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Chọn Thuộc Tính Khai Phá ({selectedFeatures.length}/15)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  {ALL_FEATURES.map((f) => (
                    <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedFeatures.includes(f.id)} onChange={() => handleFeatureToggle(f.id)} />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={running} className="glass-button" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                {running ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                <span>{running ? 'Đang Khai Phá...' : 'Bắt Đầu Chạy (Mine)'}</span>
              </button>
            </form>
          </GlassCard>

          {/* Config selection */}
          <GlassCard style={{ padding: '1.25rem' }} hover={false}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Lịch Sử Lượt Chạy</label>
            <select value={selectedConfigId} onChange={handleSelectConfig} className="glass-input" style={{ width: '100%' }}>
              {configs.map(c => (
                <option key={c.id} value={c.id}>
                  Lượt #{c.id} - {c.algorithm} ({new Date(c.created_at).toLocaleString()})
                </option>
              ))}
            </select>
          </GlassCard>
        </div>

        {/* Scatter Plot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ padding: '1.5rem' }} hover={false}>
            {loading ? (
              <div style={{ color: 'var(--text-primary)', textAlign: 'center', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : rules.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Chưa có luật nào được sinh ra ở lượt chạy này hoặc chưa chạy cấu hình nào.
              </div>
            ) : (
              <div id="rules-scatter-plot" style={{ height: '350px', width: '100%' }} />
            )}
          </GlassCard>
        </div>
      </div>

      {/* Rules list tabular view */}
      <GlassCard hover={false} style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Danh Sách Luật Kết Hợp Đã Khai Phá ({filteredRules.length})</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                placeholder="Tìm kiếm vế trước/sau..."
                value={searchRule}
                onChange={(e) => setSearchRule(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '220px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min Conf:</span>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1"
                value={minConfidenceFilter}
                onChange={(e) => setMinConfidenceFilter(parseFloat(e.target.value))}
                className="glass-input"
                style={{ width: '70px', padding: '0.4rem', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sắp xếp:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="glass-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                <option value="lift">Lift giảm dần</option>
                <option value="confidence">Confidence giảm dần</option>
                <option value="support">Support giảm dần</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '2rem' }}>Đang tải danh sách luật kết hợp...</div>
        ) : filteredRules.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Không tìm thấy luật nào phù hợp.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
                  <th style={{ padding: '1rem' }}>Vế trước (Antecedents)</th>
                  <th style={{ padding: '1rem' }}>Vế sau (Consequents)</th>
                  <th style={{ padding: '1rem' }}>Support</th>
                  <th style={{ padding: '1rem' }}>Confidence</th>
                  <th style={{ padding: '1rem' }}>Lift</th>
                  <th style={{ padding: '1rem' }}>Count (Số dòng khớp)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(r.antecedent || []).map((item, idx) => (
                          <span key={idx} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', color: '#818cf8' }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(r.consequent || []).map((item, idx) => (
                          <span key={idx} style={{ background: 'rgba(217, 70, 239, 0.1)', border: '1px solid rgba(217, 70, 239, 0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', color: '#f472b6' }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{(r.support * 100).toFixed(2)}%</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{(r.confidence * 100).toFixed(1)}%</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: r.lift > 1.5 ? '#10b981' : 'white' }}>{r.lift.toFixed(3)}</td>
                    <td style={{ padding: '1rem' }}>{r.count?.toLocaleString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

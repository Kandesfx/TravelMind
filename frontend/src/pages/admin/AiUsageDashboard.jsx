import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { BarChart3, Database, DollarSign, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AiUsageDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await axios.get('/api/admin/settings/ai-usage');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang tải báo cáo thống kê sử dụng AI...</div>;
  }

  const { summary, total_cost_usd, usage_trend } = data;

  // Calculate totals
  const totalCalls = summary.reduce((acc, curr) => acc + curr.requests_count, 0);
  const totalTokens = summary.reduce((acc, curr) => acc + curr.total_tokens, 0);

  // Chart 1: Cost breakdown by provider (Doughnut)
  const doughnutData = {
    labels: summary.map(s => s.provider_name.toUpperCase()),
    datasets: [{
      data: summary.map(s => s.total_cost_usd),
      backgroundColor: ['#6366f1', '#0ea5e9', '#d946ef', '#10b981'],
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)'
    }]
  };

  // Chart 2: Cost trend (Line)
  const lineData = {
    labels: usage_trend.map(t => t.date),
    datasets: [{
      label: 'Chi Phí AI Hàng Ngày ($)',
      data: usage_trend.map(t => t.cost),
      borderColor: '#d946ef',
      backgroundColor: 'rgba(217, 70, 239, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }]
  };

  // Chart 3: Requests count by provider (Bar)
  const barData = {
    labels: summary.map(s => s.provider_name.toUpperCase()),
    datasets: [{
      label: 'Số Lượt Gọi API (Requests)',
      data: summary.map(s => s.requests_count),
      backgroundColor: 'rgba(14, 165, 233, 0.6)',
      borderColor: '#0ea5e9',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📊 Báo Cáo & Phân Tích Chi Phí AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Theo dõi telemetry hoạt động, mức sử dụng token, số lượt gọi và ngân sách chi tiêu của các dịch vụ AI.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <GlassCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }} hover={false}>
          <div style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--section-border)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <DollarSign size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tổng Chi Phí Thực Tế (Tháng)</div>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.15rem' }}>
              ${total_cost_usd.toFixed(4)}
            </h3>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }} hover={false}>
          <div style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--section-border)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Activity size={22} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tổng Số Lượt Gọi Dịch Vụ</div>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.15rem' }}>
              {totalCalls.toLocaleString()} calls
            </h3>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }} hover={false}>
          <div style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--section-border)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Database size={22} color="#0ea5e9" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tổng Số Token Tiêu Thụ</div>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.15rem' }}>
              {totalTokens.toLocaleString()} tokens
            </h3>
          </div>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Xu Hướng Chi Phí Theo Ngày</h4>
          <div style={{ height: '300px' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Phân Bổ Chi Phí Theo Nhà Cung Cấp</h4>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ ...chartOptions, scales: {} }} />
          </div>
        </GlassCard>
      </div>

      {/* Provider Details Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <GlassCard hover={false} style={{ padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="var(--primary)" />
            <span>Chi Tiết Mức Tiêu Thụ Theo Nhà Cung Cấp</span>
          </h4>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
                <th style={{ padding: '0.75rem' }}>Nhà Cung Cấp</th>
                <th style={{ padding: '0.75rem' }}>Số Requests</th>
                <th style={{ padding: '0.75rem' }}>Số Tokens</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tổng Chi Phí</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{s.provider_name}</td>
                  <td style={{ padding: '0.75rem' }}>{s.requests_count.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>{s.total_tokens > 0 ? s.total_tokens.toLocaleString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    ${s.total_cost_usd.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Tải Lượng Requests Hệ Thống</h4>
          <div style={{ height: '220px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

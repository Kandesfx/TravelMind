import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Compass, Users, Percent, ShieldCheck } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardKPI() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/admin/data/dashboard');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang tải Dashboard KPI quản trị...</div>;
  }

  const { kpis, charts } = data;

  // Chart 1: Monthly Revenue (Line)
  const lineData = {
    labels: charts.monthly_revenue.map(r => r.month),
    datasets: [{
      label: 'Doanh Thu ($)',
      data: charts.monthly_revenue.map(r => r.revenue),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }]
  };

  // Chart 2: Channel Distribution (Doughnut)
  const doughnutData = {
    labels: charts.channel_distribution.map(c => c.channel),
    datasets: [{
      data: charts.channel_distribution.map(c => c.value),
      backgroundColor: ['#6366f1', '#0ea5e9', '#d946ef', '#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)'
    }]
  };

  // Chart 3: Seasonal Occupancy (Bar)
  const barData = {
    labels: charts.seasonal_occupancy.map(s => s.season),
    datasets: [{
      label: 'Bookings',
      data: charts.seasonal_occupancy.map(s => s.bookings),
      backgroundColor: 'rgba(14, 165, 233, 0.6)',
      borderColor: '#0ea5e9',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8' } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Tổng Bookings', value: kpis.total_bookings?.toLocaleString(), icon: Compass, color: '#6366f1' },
          { label: 'Tỷ Lệ Hủy Phòng', value: `${kpis.cancel_rate}%`, icon: Percent, color: '#ef4444' },
          { label: 'Giá TB / Đêm (ADR)', value: `$${kpis.avg_adr}`, icon: ShieldCheck, color: '#10b981' },
          { label: 'Số Quốc Gia', value: kpis.total_countries, icon: Users, color: '#0ea5e9' }
        ].map((kpi, idx) => (
          <GlassCard key={idx} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }} hover={false}>
            <div style={{
              background: `rgba(255,255,255,0.02)`,
              border: `1px solid rgba(255,255,255,0.05)`,
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <kpi.icon size={22} color={kpi.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{kpi.label}</div>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.15rem' }}>{kpi.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Doanh thu */}
        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Xu Hướng Doanh Thu Theo Tháng</h4>
          <div style={{ height: '300px' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </GlassCard>

        {/* Kênh đặt phòng */}
        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Phân Bố Kênh Đặt Phòng</h4>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ ...chartOptions, scales: {} }} />
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Lấp đầy theo mùa */}
        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Lượng Khách Đặt Theo Mùa</h4>
          <div style={{ height: '300px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </GlassCard>

        {/* Top quốc gia */}
        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Top 10 Quốc Gia Gửi Khách</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {charts.top_countries.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '20px' }}>{i+1}.</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', width: '50px' }}>{c.country}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(c.count / charts.top_countries[0].count) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(to right, #6366f1, #0ea5e9)',
                    borderRadius: '4px'
                  }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{c.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

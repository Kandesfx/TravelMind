import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Users, Clock, Compass, DollarSign, Heart } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function CustomerAnalysis() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await axios.get('/api/admin/rules/segments');
        setSegments(res.data.segments);
        if (res.data.segments.length > 0) {
          setSelectedSegment(res.data.segments[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang tải báo cáo phân tích khách hàng...</div>;
  }

  // Chart data for Segment Distribution (Doughnut)
  const distributionData = {
    labels: segments.map(s => s.name.split(' (')[0]),
    datasets: [{
      data: segments.map(s => s.percentage),
      backgroundColor: ['#6366f1', '#0ea5e9', '#d946ef', '#10b981', '#f59e0b'],
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)'
    }]
  };

  // Chart data for Lead Time comparison (Bar)
  const leadTimeData = {
    labels: segments.map(s => s.name.split(' (')[0]),
    datasets: [{
      label: 'Số ngày đặt trước (Lead Time trung bình)',
      data: segments.map(s => s.characteristics.lead_time_avg),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: '#6366f1',
      borderWidth: 1
    }]
  };

  // Chart data for ADR comparison (Bar)
  const adrData = {
    labels: segments.map(s => s.name.split(' (')[0]),
    datasets: [{
      label: 'Giá phòng TB / Đêm (ADR - $)',
      data: segments.map(s => s.characteristics.avg_adr),
      backgroundColor: 'rgba(217, 70, 239, 0.6)',
      borderColor: '#d946ef',
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

  const getPersonaIcon = (type) => {
    switch (type) {
      case 'planner': return Compass;
      case 'last_minute': return Clock;
      case 'business': return Users;
      case 'romantic': return Heart;
      case 'family': return Users;
      default: return Compass;
    }
  };

  const getPersonaColor = (type) => {
    switch (type) {
      case 'planner': return '#6366f1';
      case 'last_minute': return '#0ea5e9';
      case 'business': return '#10b981';
      case 'romantic': return '#d946ef';
      case 'family': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Phân Tích Phân Khúc Khách Hàng (Personas)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Báo cáo chi tiết về 5 nhóm chân dung du khách chính dựa trên khai phá dữ liệu đặt phòng.</p>
      </div>

      {/* Grid of Segments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {segments.map((seg) => {
          const Icon = getPersonaIcon(seg.type);
          const color = getPersonaColor(seg.type);
          const isSelected = selectedSegment?.type === seg.type;
          
          return (
            <GlassCard
              key={seg.type}
              style={{
                padding: '1.25rem',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.06)',
                background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'center'
              }}
              onClick={() => setSelectedSegment(seg)}
            >
              <div style={{
                background: `rgba(255,255,255,0.02)`,
                border: `1px solid rgba(255,255,255,0.05)`,
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, height: '2.4rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {seg.name.split(' (')[0]}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: color, marginTop: '0.25rem' }}>
                  {seg.percentage}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {seg.count.toLocaleString()} bookings
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Detailed Selected Segment view */}
      {selectedSegment && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
          <GlassCard style={{ padding: '2rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--section-border)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {React.createElement(getPersonaIcon(selectedSegment.type), { size: 24, color: getPersonaColor(selectedSegment.type) })}
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 700 }}>{selectedSegment.name}</h3>
                <span style={{ fontSize: '0.8rem', color: getPersonaColor(selectedSegment.type), fontWeight: 600 }}>Chi tiết phân khúc du khách</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Loại Khách Sạn Ưu Thích</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {selectedSegment.characteristics.hotel_preference}
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mùa Du Lịch Ưu Thích</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {selectedSegment.characteristics.season_preference}
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gói Ăn Uống Ưu Thích</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {selectedSegment.characteristics.meal_preference}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lead Time Trung Bình</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {selectedSegment.characteristics.lead_time_avg} ngày đặt trước
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Giá Phòng TB / Đêm (ADR)</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    ${selectedSegment.characteristics.avg_adr} / đêm
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--section-border)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tỷ Lệ Chiếm Lĩnh Phân Khúc</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {selectedSegment.percentage}% tổng bookings ({selectedSegment.count.toLocaleString()} dòng)
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} hover={false}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>Tỷ Lệ Đóng Góp Các Nhóm</h4>
            <div style={{ height: '220px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={distributionData} options={{ ...chartOptions, cutout: '70%', scales: {} }} />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Comparisons Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>So Sánh Lead Time Đặt Phòng</h4>
          <div style={{ height: '280px' }}>
            <Bar data={leadTimeData} options={chartOptions} />
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }} hover={false}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>So Sánh Đơn Giá Phòng Trung Bình (ADR)</h4>
          <div style={{ height: '280px' }}>
            <Bar data={adrData} options={chartOptions} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

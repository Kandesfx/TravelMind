import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { BarChart3, TrendingUp, DollarSign, Percent } from 'lucide-react';

export default function PerformanceReports() {
  const [comboReports, setComboReports] = useState([]);
  const [voucherReports, setVoucherReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [cRes, vRes] = await Promise.all([
          axios.get('/api/admin/business/reports/combos'),
          axios.get('/api/admin/business/reports/vouchers')
        ]);
        setComboReports(cRes.data.combos);
        setVoucherReports(vRes.data.vouchers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang tải báo cáo hiệu suất...</div>;
  }

  // Summary indicators
  const totalRevenue = comboReports.reduce((sum, r) => sum + r.revenue, 0);
  const totalBookings = comboReports.reduce((sum, r) => sum + r.bookings, 0);
  const avgConversion = comboReports.reduce((sum, r) => sum + r.conversion_rate, 0) / (comboReports.length || 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Báo Cáo Hiệu Quả Kinh Doanh</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Theo dõi doanh thu, tỷ lệ chuyển đổi của combo du lịch và mức độ sử dụng mã vouchers.</p>
      </div>

      {/* Mini KPI indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        <GlassCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }} hover={false}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <DollarSign size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doanh Thu Combo Tích Lũy</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</h3>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }} hover={false}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tổng Combo Đã Đặt</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>{totalBookings} lượt đặt</h3>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }} hover={false}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Percent size={20} color="var(--secondary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tỷ Lệ Chuyển Đổi TB</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>{avgConversion.toFixed(1)}%</h3>
          </div>
        </GlassCard>
      </div>

      {/* Table 1: Combo Performance */}
      <GlassCard style={{ padding: '1.5rem' }} hover={false}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BarChart3 size={18} color="var(--primary)" />
          <span>Hiệu quả chuyển đổi Combo đề xuất</span>
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Tên Combo</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Số Lượt Xem (Views)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Số Lượt Đặt (Bookings)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tỷ Lệ Chuyển Đổi (%)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Doanh Thu Mang Lại</th>
            </tr>
          </thead>
          <tbody>
            {comboReports.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{c.views.toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{c.bookings.toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{c.conversion_rate}%</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>${c.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Table 2: Voucher Performance */}
      <GlassCard style={{ padding: '1.5rem' }} hover={false}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BarChart3 size={18} color="var(--success)" />
          <span>Báo cáo sử dụng Voucher sự kiện</span>
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--section-border)', color: 'var(--text-primary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Mã Voucher</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tổng Phát Hành</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Đã Sử Dụng</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tỷ Lệ Lấp Đầy (%)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Tổng Giá Trị Đã Giảm</th>
            </tr>
          </thead>
          <tbody>
            {voucherReports.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{v.code}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{v.total_quantity}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{v.used_count}</td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{v.use_percentage}%</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>-${v.revenue_saved?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

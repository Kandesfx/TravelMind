import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import Plotly from 'plotly.js-dist-min';
import { TrendingUp, Globe, BarChart2, Calendar } from 'lucide-react';

export default function TravelInsights() {
  const [trends, setTrends] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, countriesRes] = await Promise.all([
          axios.get('/api/public/insights/trends'),
          axios.get('/api/public/insights/countries')
        ]);
        setTrends(trendsRes.data.monthly_bookings);
        setCountries(countriesRes.data.countries);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Render Plotly charts
  useEffect(() => {
    if (loading || countries.length === 0 || trends.length === 0) return;

    // --- Chart 1: Choropleth Map (World Guest Distribution) ---
    const mapData = [{
      type: 'choropleth',
      locations: countries.map(c => c.code),
      z: countries.map(c => c.count),
      text: countries.map(c => c.name),
      colorscale: 'Viridis',
      autocolorscale: false,
      reversescale: true,
      marker: {
        line: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 0.5
        }
      },
      colorbar: {
        title: 'Bookings',
        thickness: 15,
        tickfont: { color: '#94a3b8' }
      }
    }];

    const mapLayout = {
      title: {
        text: 'Bản Đồ Phân Bố Du Khách Toàn Cầu',
        font: { color: 'var(--text-primary)', family: 'Outfit', size: 18 }
      },
      geo: {
        showframe: false,
        showcoastlines: true,
        projection: { type: 'mercator' },
        bgcolor: 'rgba(0,0,0,0)',
        lakecolor: '#090d16',
        landcolor: 'rgba(255, 255, 255, 0.04)',
        subunitcolor: 'rgba(255, 255, 255, 0.05)',
        coastlinecolor: 'rgba(255, 255, 255, 0.15)'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 0, r: 0, t: 40, b: 0 }
    };

    Plotly.newPlot('choropleth-map', mapData, mapLayout, { responsive: true, displayModeBar: false });

    // --- Chart 2: Seasonality Heatmap (Month vs Bookings Count vs Pricing) ---
    const months = trends.map(t => t.month);
    const resortCounts = trends.map(t => t.resort);
    const cityCounts = trends.map(t => t.city);
    const avgAdrs = trends.map(t => t.avg_adr);

    const heatmapData = [{
      x: ['Đặt phòng Resort', 'Đặt phòng City Hotel', 'Giá phòng TB ($)'],
      y: months,
      z: trends.map(t => [t.resort, t.city, t.avg_adr]),
      type: 'heatmap',
      colorscale: 'Hot',
      colorbar: {
        tickfont: { color: '#94a3b8' }
      }
    }];

    const heatmapLayout = {
      title: {
        text: 'Heatmap Mùa Vụ & Biến Động Giá',
        font: { color: 'var(--text-primary)', family: 'Outfit', size: 18 }
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#94a3b8' },
      xaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
      yaxis: { gridcolor: 'rgba(255,255,255,0.05)', autorange: 'reversed' },
      margin: { l: 80, r: 20, t: 50, b: 40 }
    };

    Plotly.newPlot('season-heatmap', heatmapData, heatmapLayout, { responsive: true, displayModeBar: false });

  }, [loading, countries, trends]);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang chuẩn bị nội dung...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }} className="animate-fade-in">
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Khám Phá Xu Hướng Du Lịch</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          Những xu hướng du lịch mới nhất giúp bạn lên kế hoạch kỳ nghỉ hoàn hảo — thời điểm nào giá tốt nhất, du khách đến từ đâu.
        </p>
      </div>

      {/* Grid containing map */}
      <GlassCard style={{ padding: '2rem' }} hover={false}>
        <div id="choropleth-map" style={{ height: '450px', width: '100%' }} />
      </GlassCard>

      {/* Grid containing heatmap and stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <GlassCard style={{ padding: '2rem' }} hover={false}>
          <div id="season-heatmap" style={{ height: '400px', width: '100%' }} />
        </GlassCard>

        {/* Insight sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
              <Calendar size={20} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Đặc Điểm Mùa Vụ</h3>
            </div>
            <ul style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              paddingLeft: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              lineHeight: 1.6
            }}>
              <li>
                **Cao điểm Mùa Hè (Tháng 7 - Tháng 8)**: Ghi nhận lượng đặt phòng Resort cao nhất cùng giá phòng (ADR) đạt đỉnh. Khách hàng đi theo nhóm gia đình có tỷ lệ cao nhất trong năm.
              </li>
              <li>
                **Thấp điểm Mùa Đông (Tháng 11 - Tháng 2)**: Lượng khách Resort giảm đáng kể, tuy nhiên City Hotel vẫn duy trì ổn định nhờ luồng khách công tác. Mức giá phòng trung bình giảm tới 40% so với mùa hè.
              </li>
              <li>
                **Cơ hội tốt nhất (Tháng 3 - Tháng 5)**: Thời tiết chuyển xuân, lượng đặt phòng chưa quá tải, mức giá phòng rất cân bằng. Đây là thời điểm lý tưởng để đẩy mạnh các gói voucher tích hợp.
              </li>
            </ul>
          </GlassCard>

          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
              <Globe size={20} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Mật Độ Địa Lý</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Khách du lịch nội địa Bồ Đào Nha (PRT) chiếm tỷ trọng lớn nhất với hơn **40%** tổng lượng đặt phòng. 
              Các quốc gia Tây Âu lân cận bao gồm Anh Quốc (GBR), Pháp (FRA), Đức (DEU) và Tây Ban Nha (ESP) lần lượt đóng góp từ 8% đến 12% lượng khách, 
              cho thấy nhu cầu du lịch nghỉ dưỡng xuyên biên giới cực kỳ mạnh mẽ tại khu vực này.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

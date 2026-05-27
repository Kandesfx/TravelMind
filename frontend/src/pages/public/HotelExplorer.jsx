import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { ShieldAlert, Compass, Calendar, Percent, Landmark, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HotelExplorer() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await axios.get('/api/public/hotels');
        setHotels(res.data.hotels);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang tải thông tin khách sạn...</div>;
  }

  // Fallback default hotels if database has no records
  const hotelsData = hotels.length > 0 ? hotels : [
    {
      "type": "Resort Hotel",
      "total_bookings": 40060,
      "percentage": 33.6,
      "avg_adr": 95.0,
      "cancel_rate": 27.8,
      "top_meal": "BB (Bữa sáng)",
      "top_room": "Phòng A",
      "peak_months": ["Tháng 7", "Tháng 8"],
      "top_countries": ["PRT (Bồ Đào Nha)", "GBR (Anh Quốc)", "ESP (Tây Ban Nha)"]
    },
    {
      "type": "City Hotel",
      "total_bookings": 79330,
      "percentage": 66.4,
      "avg_adr": 105.3,
      "cancel_rate": 41.7,
      "top_meal": "BB (Bữa sáng)",
      "top_room": "Phòng A",
      "peak_months": ["Tháng 5", "Tháng 10"],
      "top_countries": ["PRT (Bồ Đào Nha)", "FRA (Pháp)", "DEU (Đức)"]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }} className="animate-fade-in">
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Khám Phá & So Sánh Khách Sạn</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          Tìm hiểu khách sạn phù hợp với phong cách du lịch của bạn — so sánh Resort ven biển và Khách sạn thành phố.
        </p>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {hotelsData.map((h, idx) => {
          const isResort = h.type.toLowerCase().includes('resort');
          return (
            <GlassCard key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              borderColor: isResort ? 'rgba(14, 165, 233, 0.2)' : 'rgba(99, 102, 241, 0.2)',
              background: isResort ? 'rgba(14, 165, 233, 0.02)' : 'rgba(99, 102, 241, 0.02)'
            }} className="glass-panel-hover">
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isResort ? 'var(--secondary)' : 'var(--primary)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>{isResort ? 'Nghỉ dưỡng ven biển' : 'Lưu trú đô thị'}</div>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>{h.type}</h3>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  opacity: 0.15,
                  fontFamily: 'var(--font-display)'
                }}>0{idx+1}</div>
              </div>

              {/* Booking count bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Lượng đặt phòng</span>
                  <span style={{ fontWeight: 'bold' }}>{h.total_bookings.toLocaleString()} ({h.percentage}%)</span>
                </div>
                <div style={{
                  height: '6px',
                  background: 'var(--icon-circle-bg)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${h.percentage}%`,
                    height: '100%',
                    background: isResort ? 'var(--secondary)' : 'var(--primary)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>

              {/* Stats detail list */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
                padding: '1.25rem 0',
                borderTop: '1px solid var(--section-border)',
                borderBottom: '1px solid var(--section-border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Giá trung bình / đêm</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>${h.avg_adr}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tỷ lệ hủy đặt phòng</div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    color: h.cancel_rate > 35 ? 'var(--danger)' : 'var(--success)', 
                    marginTop: '0.15rem' 
                  }}>{h.cancel_rate}%</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gói ăn phổ biến nhất</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{h.top_meal}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loại phòng ưa thích</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{h.top_room}</div>
                </div>
              </div>

              {/* Peak months & country details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Calendar size={18} color="var(--text-muted)" style={{ marginTop: '0.1rem' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mùa cao điểm đặt phòng</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.15rem', display: 'flex', gap: '0.5rem' }}>
                      {h.peak_months.map((m, i) => (
                        <span key={i} style={{ background: 'var(--badge-bg)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--section-border)' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Compass size={18} color="var(--text-muted)" style={{ marginTop: '0.1rem' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Top 3 Quốc gia gửi khách nhiều nhất</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.15rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {h.top_countries.map((c, i) => (
                        <span key={i} style={{ background: 'var(--badge-bg)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--section-border)' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link to={`/combo-builder?hotel_type=${isResort ? 'Resort' : 'City'}`} className="glass-button glass-button-secondary" style={{
                marginTop: 'auto',
                justifyContent: 'center',
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}>
                <span>Xem các combo liên quan</span>
                <ArrowRight size={14} />
              </Link>

            </GlassCard>
          );
        })}
      </div>

      {/* Interactive Explanation Box */}
      <GlassCard style={{
        background: 'rgba(14, 165, 233, 0.02)',
        borderColor: 'rgba(14, 165, 233, 0.1)',
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'flex-start'
      }} hover={false}>
        <ShieldAlert size={24} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>💡 Mẹo Đặt Phòng Thông Minh</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Resort ven biển thường có chính sách giữ phòng ổn định hơn và nhiều ưu đãi trọn gói (ăn uống, spa, đỗ xe). 
            Trong khi đó, khách sạn thành phố phù hợp cho những chuyến đi ngắn ngày — bạn nên đặt sớm để có giá tốt nhất 
            và tận dụng các gói combo tiết kiệm thay vì đặt từng dịch vụ riêng lẻ.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

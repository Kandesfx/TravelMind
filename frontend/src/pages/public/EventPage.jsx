import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Calendar, Ticket, Flame, ArrowRight, Clock } from 'lucide-react';

export default function EventPage() {
  const { slug } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/public/events/${slug}`);
        setEventData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  // Countdown timer logic
  useEffect(() => {
    if (!eventData) return;

    const interval = setInterval(() => {
      const difference = +new Date(eventData.end_date) - +new Date();
      
      let tempTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      
      if (difference > 0) {
        tempTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      
      setTimeLeft(tempTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [eventData]);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Đang tải chiến dịch khuyến mãi...</div>;
  }

  if (!eventData) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Không tìm thấy sự kiện khuyến mãi.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }} className="animate-fade-in">
      {/* 1. Header Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        padding: '3rem',
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '2rem',
        alignItems: 'center',
        borderRadius: '24px'
      }} hover={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(217, 70, 239, 0.1)',
            border: '1px solid rgba(217, 70, 239, 0.2)',
            padding: '0.35rem 0.75rem',
            borderRadius: '12px',
            color: '#f472b6',
            fontSize: '0.75rem',
            fontWeight: 600,
            width: 'fit-content'
          }}>
            <Flame size={12} />
            <span>Chiến dịch đang diễn ra</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{eventData.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {eventData.description}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Calendar size={14} />
            <span>Thời gian áp dụng: {eventData.start_date} đến {eventData.end_date}</span>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(9, 13, 22, 0.6)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Clock size={16} />
            <span>THỜI GIAN CÒN LẠI</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { label: 'Ngày', value: timeLeft.days },
              { label: 'Giờ', value: timeLeft.hours },
              { label: 'Phút', value: timeLeft.minutes },
              { label: 'Giây', value: timeLeft.seconds }
            ].map((t, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: 'white',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  width: '54px',
                  height: '54px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>{t.value.toString().padStart(2, '0')}</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 2. Vouchers Section */}
      {eventData.vouchers?.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white' }}>Mã Voucher Sự Kiện Độc Quyền</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {eventData.vouchers.map((v) => (
              <GlassCard key={v.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(16, 185, 129, 0.02)',
                borderColor: 'rgba(16, 185, 129, 0.1)'
              }} hover={false}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ticket size={22} color="var(--success)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'white', letterSpacing: '0.02em', fontWeight: 800 }}>{v.code}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{v.description}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ưu đãi</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                    {v.discount_type === 'percent' ? `Giảm ${v.discount_value}%` : `Giảm $${v.discount_value}`}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* 3. Combos Grid */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white' }}>Gói Combo Khuyến Mãi Gắn Kèm</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {eventData.combos?.map((combo) => (
            <GlassCard key={combo.id} style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }} className="glass-panel-hover">
              <div style={{
                height: '160px',
                background: `url(${combo.image_url}) center/cover no-repeat`,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(9, 13, 22, 0.8)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#f97316'
                }}>
                  🔥 Hot
                </div>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{combo.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', height: '38px', overflow: 'hidden' }}>
                  {combo.short_description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mức giá từ</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 850, color: 'white' }}>${combo.price_estimate?.toFixed(0)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/ đêm</span></div>
                  </div>
                  <Link to={`/combos/${combo.id}`} className="glass-button" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                    Chi tiết
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}

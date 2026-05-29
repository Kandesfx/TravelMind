import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight, Sparkles, TrendingUp, Compass,
  Search, Star, Zap, MapPin, Waves,
  ChevronRight, Globe, Award, ChevronDown
} from 'lucide-react';

/* ── Tropical gradient palette per index ── */
const DEST_GRADIENTS = [
  'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #0ea5e9 100%)',
];

/* ── Service label map ── */
const SERVICE_MAP = {
  'Hotel_Resort': '🏖️ Resort', 'Hotel_City': '🏢 City Hotel',
  'Meal_BB': '🥐 Bữa sáng', 'Meal_HB': '🍽️ Nửa ăn', 'Meal_FB': '🍴 Toàn ăn', 'Meal_SC': '🧺 Tự túc',
  'Room_A': 'Standard', 'Room_B': 'Superior', 'Room_C': 'Deluxe', 'Room_D': 'Suite',
  'Room_E': 'Cao cấp', 'Room_F': 'Gia đình', 'Room_G': 'VIP', 'Room_H': 'Penthouse',
  'Dep_NoDeposit': '✅ Không cọc', 'Dep_Refundable': '🔄 Hoàn tiền',
  'Parking_Yes': '🅿️ Đỗ xe', 'Parking_No': '',
};
const friendlyService = (s) => SERVICE_MAP[s] || s.replace(/_/g, ' ');

const getComboLabel = (combo) => {
  if (combo.match_lift >= 2.0) return { text: '🔥 Phổ biến nhất', color: '#f97316' };
  if (combo.match_confidence >= 0.7) return { text: '⭐ Được yêu thích', color: '#f59e0b' };
  return { text: '✨ Khuyên dùng', color: '#0ea5a0' };
};

/* ── Animated counter hook ── */
function useCountUp(target, duration, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    const num = parseInt(String(target).replace(/\D/g, '')) || 0;
    let t0 = null;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);
  return val;
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [data, setData] = useState({ combos: [], stats: {}, banners: [], featured_hotels: [] });
  const [loading, setLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  const [hotelType, setHotelType] = useState('Resort');
  const [group, setGroup] = useState('Couple');
  const [season, setSeason] = useState('Summer');

  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/public/landing')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/combo-builder?hotel_type=${hotelType}&group=${group}&season=${season}`);
  };

  const banner = data.banners?.[0] || {
    title: 'Khám Phá Thiên Đường Nghỉ Dưỡng',
    subtitle: 'AI phân tích hàng trăm nghìn lượt đặt phòng thực tế để tìm combo hoàn hảo — cá nhân hóa cho riêng bạn.',
    cta_link: '/combo-builder',
  };

  const STATS = [
    { label: 'Lượt đặt phòng', value: data.stats.total_bookings || 119390, suffix: '+', icon: Globe, color: '#0ea5a0', desc: 'dữ liệu thực tế' },
    { label: 'Quốc gia', value: data.stats.total_countries || 178, suffix: '', icon: Compass, color: '#f97316', desc: 'du khách toàn cầu' },
    { label: 'Loại phòng', value: data.stats.total_room_types || 24, suffix: '', icon: Award, color: '#f59e0b', desc: 'hệ thống thực tế' },
    { label: 'Combo dịch vụ', value: data.stats.total_combos || 15, suffix: '+', icon: Sparkles, color: '#a855f7', desc: 'tùy theo bạn' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '1rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          border: '3px solid rgba(14,165,160,0.15)',
          borderTopColor: '#0ea5a0',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang tải...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">

      {/* ══════════════════════════════════════════════════
          1. HERO
          ══════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '82vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2.5rem',
        alignItems: 'center',
        paddingTop: '3rem',
        paddingBottom: '4rem',
        overflow: 'hidden',
      }}>
        {/* Ambient orbs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,160,0.25) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'pulse 7s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '5%',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
          animation: 'pulse 9s ease-in-out infinite 2s',
        }} />
        <div style={{
          position: 'absolute', top: '35%', left: '38%',
          width: '220px', height: '220px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
          animation: 'pulse 11s ease-in-out infinite 4s',
        }} />
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.12);opacity:1} }`}</style>

        {/* Dot grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'radial-gradient(rgba(14,165,160,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/* ── Left: Copy ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(14,165,160,0.1)', border: '1px solid rgba(14,165,160,0.25)',
              color: '#0ea5a0', padding: '0.3rem 0.8rem', borderRadius: '99px',
              fontSize: '0.78rem', fontWeight: 600,
            }}>
              <Sparkles size={13} /> Gợi ý thông minh từ AI
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
              color: '#f97316', padding: '0.3rem 0.8rem', borderRadius: '99px',
              fontSize: '0.78rem', fontWeight: 600,
            }}>
              <Globe size={13} /> 178 quốc gia
            </span>
          </div>

          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.12, marginBottom: '1rem' }}>
              {banner.title.includes('\n') ? banner.title.split('\n').map((line, i) => (
                <span key={i} style={{ display: 'block' }}>
                  {i === 0
                    ? line
                    : <span style={{ background: 'linear-gradient(135deg, #0ea5a0, #38d9d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{line}</span>}
                </span>
              )) : (
                <>
                  <span>{banner.title.split(' ').slice(0, 3).join(' ')} </span>
                  <span style={{ background: 'linear-gradient(135deg, #0ea5a0, #38d9d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {banner.title.split(' ').slice(3).join(' ')}
                  </span>
                </>
              )}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.75, maxWidth: '460px' }}>
              {banner.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
            <Link to={banner.cta_link} className="glass-button" style={{ padding: '0.85rem 1.8rem', fontSize: '0.95rem', borderRadius: '12px', textDecoration: 'none' }}>
              <Search size={16} /> Tìm Combo Ngay <ArrowRight size={16} />
            </Link>
            <Link to="/quiz" className="glass-button glass-button-secondary" style={{ padding: '0.85rem 1.4rem', fontSize: '0.9rem', borderRadius: '12px', textDecoration: 'none' }}>
              🎯 Quiz Du Lịch
            </Link>
          </div>

          {/* Trust bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              {['#0ea5a0', '#f97316', '#f59e0b', '#a855f7', '#ec4899'].map((c, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, marginLeft: i ? '-7px' : 0,
                  border: '2px solid var(--bg-base, #060d14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {['A', 'B', 'C', 'D', 'E'][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>119,390+ khách tin tưởng</span>
            </div>
          </div>
        </div>

        {/* ── Right: Search widget ── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '22px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5a0, #0c8f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Compass size={15} color="white" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Tìm gói phù hợp</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Cho chúng tôi biết sở thích — AI sẽ lo phần còn lại.
            </p>

            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Hotel type toggles */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--label-color)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.5rem' }}>
                  Loại khách sạn
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[{ val: 'Resort', label: '🏖️ Resort', sub: 'Ven biển' }, { val: 'City', label: '🏢 City', sub: 'Trung tâm' }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => setHotelType(opt.val)} style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '10px',
                      border: `1px solid ${hotelType === opt.val ? '#0ea5a0' : 'var(--panel-border)'}`,
                      background: hotelType === opt.val ? 'rgba(14,165,160,0.12)' : 'var(--input-bg)',
                      color: hotelType === opt.val ? '#0ea5a0' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.2s ease',
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{opt.label}</span>
                      <span style={{ fontSize: '0.68rem', opacity: 0.65 }}>{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--label-color)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>Đi cùng ai?</label>
                  <select value={group} onChange={e => setGroup(e.target.value)} className="glass-input" style={{ fontSize: '0.85rem' }}>
                    <option value="Solo">🧑 Một mình</option>
                    <option value="Couple">💑 Cặp đôi</option>
                    <option value="Family">👨‍👩‍👧 Gia đình</option>
                    <option value="Large">👥 Nhóm đông</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--label-color)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>Mùa du lịch</label>
                  <select value={season} onChange={e => setSeason(e.target.value)} className="glass-input" style={{ fontSize: '0.85rem' }}>
                    <option value="Spring">🌸 Mùa Xuân</option>
                    <option value="Summer">☀️ Mùa Hạ</option>
                    <option value="Autumn">🍂 Mùa Thu</option>
                    <option value="Winter">❄️ Mùa Đông</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="glass-button" style={{
                justifyContent: 'center', padding: '0.85rem',
                borderRadius: '12px', fontSize: '0.9rem', marginTop: '0.25rem',
                background: 'linear-gradient(135deg, #0ea5a0, #0c8f8a 50%, #f97316)',
              }}>
                <Search size={16} /> Tìm Combo Phù Hợp <ArrowRight size={16} />
              </button>
            </form>

            {/* Quick tags */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--section-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['☀️ Mùa hè hot', '🏖️ Resort deal', '💑 Honeymoon'].map((tag, i) => (
                <button key={i} type="button" onClick={() => navigate('/combo-builder')} style={{
                  fontSize: '0.7rem', padding: '0.25rem 0.65rem', borderRadius: '99px',
                  background: 'rgba(14,165,160,0.07)', border: '1px solid rgba(14,165,160,0.18)',
                  color: '#0ea5a0', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s ease',
                }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
          color: 'var(--text-muted)', fontSize: '0.68rem', zIndex: 2,
          animation: 'floatY 2.5s ease-in-out infinite',
        }}>
          <span>Cuộn xuống</span>
          <ChevronDown size={15} />
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingTop: '3rem' }}>

        {/* ══════════════════════════════════════════════════
            2. STATS
            ══════════════════════════════════════════════════ */}
        <section ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {STATS.map((item, idx) => <StatCard key={idx} item={item} visible={statsVisible} delay={idx * 100} />)}
        </section>

        {/* ══════════════════════════════════════════════════
            3. FEATURED HOTELS
            ══════════════════════════════════════════════════ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <SectionHeader
            badge="🗺️ Điểm đến"
            title="Khách Sạn"
            highlight="Được Yêu Thích"
            desc="Danh sách khách sạn thực tế với phòng và giá từ dữ liệu Hotel Bookings."
            linkTo="/hotels" linkLabel="Xem tất cả" linkColor="#0ea5a0"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {data.featured_hotels && data.featured_hotels.length > 0
              ? data.featured_hotels.map((hotel, idx) => <HotelCard key={hotel.id} hotel={hotel} idx={idx} navigate={navigate} />)
              : PLACEHOLDER_HOTELS.map((ph, idx) => <PlaceholderHotelCard key={idx} ph={ph} idx={idx} navigate={navigate} />)
            }
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            4. HOW IT WORKS
            ══════════════════════════════════════════════════ */}
        <section style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          borderRadius: '24px',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,160,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '1rem' }}>
              <Zap size={13} /> Cách hoạt động
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Chỉ <span style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>3 Bước</span> Đơn Giản
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Từ sở thích đến combo hoàn hảo — nhanh hơn bạn nghĩ.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '34px', left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, rgba(14,165,160,0.3), rgba(249,115,22,0.3), rgba(245,158,11,0.3))' }} />
            {[
              { step: '01', icon: Search, title: 'Cho biết sở thích', desc: 'Chọn loại khách sạn, nhóm đi cùng, mùa và ngân sách.', color: '#0ea5a0' },
              { step: '02', icon: Zap, title: 'AI phân tích', desc: 'Thuật toán khai phá dữ liệu từ hàng trăm nghìn lượt đặt phòng.', color: '#f97316' },
              { step: '03', icon: Star, title: 'Nhận gợi ý', desc: 'Top 3 combo dịch vụ phù hợp nhất, sẵn sàng đặt ngay.', color: '#f59e0b' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: `${item.color}15`, border: `2px solid ${item.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: `0 0 20px ${item.color}20`, flexShrink: 0 }}>
                    <Icon size={26} color={item.color} />
                    <div style={{ position: 'absolute', top: '-7px', right: '-7px', width: '22px', height: '22px', borderRadius: '50%', background: item.color, color: 'white', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.step}
                    </div>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            5. HOT COMBOS
            ══════════════════════════════════════════════════ */}
        {data.combos.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <SectionHeader
              badge="🔥 Xu hướng"
              title="Combo"
              highlight="Được Yêu Thích Nhất"
              desc="Tổ hợp dịch vụ được đa số du khách lựa chọn & đánh giá cao."
              linkTo="/combo-builder" linkLabel="Xem tất cả" linkColor="#f97316"
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '1.4rem' }}>
              {data.combos.slice(0, 6).map((combo, idx) => (
                <ComboCard key={combo.id} combo={combo} idx={idx} />
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            6. FEATURE HIGHLIGHTS
            ══════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {[
            { emoji: '🌏', title: 'Dữ liệu thực tế toàn cầu', desc: 'Gợi ý từ 119,390 du khách thực tế tại 178 quốc gia.', color: '#0ea5a0' },
            { emoji: '🎯', title: 'Cá nhân hóa hoàn toàn', desc: 'Mỗi gợi ý được thiết kế riêng theo phong cách và ngân sách của bạn.', color: '#f97316' },
            { emoji: '⚡', title: 'Kết quả tức thì', desc: 'Top 3 combo phù hợp nhất trong vài giây — không cần chờ.', color: '#f59e0b' },
          ].map((item, idx) => (
            <div key={idx} className="glass-panel-hover" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.6rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}12`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {item.emoji}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{item.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════════
            7. QUIZ CTA
            ══════════════════════════════════════════════════ */}
        <section style={{
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(14,165,160,0.1) 0%, rgba(249,115,22,0.07) 50%, rgba(245,158,11,0.09) 100%)',
          border: '1px solid rgba(14,165,160,0.18)',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,160,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <span style={{ fontSize: '2.8rem' }}>🎯</span>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.6rem' }}>
              Bạn Thuộc Nhóm Du Khách{' '}
              <span style={{ background: 'linear-gradient(135deg, #0ea5a0, #38d9d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Nào?</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.93rem', lineHeight: 1.7 }}>
              Trả lời 5 câu hỏi nhanh để khám phá phong cách du lịch và nhận combo cá nhân hóa hoàn toàn.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/quiz" className="glass-button glass-button-accent" style={{ padding: '0.85rem 2.2rem', fontSize: '0.95rem', borderRadius: '12px', textDecoration: 'none' }}>
              🎯 Làm Quiz Ngay
            </Link>
            <Link to="/combo-builder" className="glass-button glass-button-secondary" style={{ padding: '0.85rem 1.8rem', fontSize: '0.9rem', borderRadius: '12px', textDecoration: 'none' }}>
              Tìm combo trực tiếp
            </Link>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>✅ Miễn phí · ⚡ Chỉ 2 phút · 🔒 Không cần đăng ký</p>
        </section>

        {/* ══════════════════════════════════════════════════
            8. FOOTER
            ══════════════════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid var(--section-border)', paddingTop: '2.5rem', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #0ea5a0, #0c8f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Waves size={14} color="white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800 }}>TravelMind</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Hệ thống gợi ý combo du lịch thông minh</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>© 2026 TravelMind — Đồ án môn học KPDL</span>
          </div>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            <FooterLinks title="Khám phá" links={[{ to: '/hotels', label: 'Khách Sạn' }, { to: '/combo-builder', label: 'Tìm Combo' }, { to: '/quiz', label: 'Quiz Du Lịch' }, { to: '/insights', label: 'Xu Hướng' }]} />
            <FooterLinks title="Tài khoản" links={[{ to: '/login', label: 'Đăng nhập' }, { to: '/register', label: 'Đăng ký' }]} />
          </div>
        </footer>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

function StatCard({ item, visible, delay }) {
  const Icon = item.icon;
  const count = useCountUp(item.value, 1400, visible);
  const display = visible ? `${count.toLocaleString()}${item.suffix}` : '—';
  return (
    <div className="glass-panel-hover" style={{
      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: '16px', padding: '1.5rem', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem',
      backdropFilter: 'blur(12px)', transition: 'all 0.3s ease',
      animation: visible ? `fadeInUp 0.5s ease ${delay}ms both` : 'none',
    }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${item.color}12`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={item.color} />
      </div>
      <div style={{ fontSize: '1.85rem', fontWeight: 900, background: `linear-gradient(135deg, ${item.color}, ${item.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
        {display}
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</div>
      <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>{item.desc}</div>
    </div>
  );
}

function SectionHeader({ badge, title, highlight, desc, linkTo, linkLabel, linkColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: `${linkColor}10`, border: `1px solid ${linkColor}28`, color: linkColor, padding: '0.28rem 0.75rem', borderRadius: '99px', fontSize: '0.76rem', fontWeight: 600, marginBottom: '0.65rem' }}>
          {badge}
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, lineHeight: 1.15 }}>
          {title}{' '}
          <span style={{ background: `linear-gradient(135deg, ${linkColor}, ${linkColor}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{highlight}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginTop: '0.4rem' }}>{desc}</p>
      </div>
      <Link to={linkTo} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        color: linkColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
        padding: '0.45rem 1rem', borderRadius: '8px',
        border: `1px solid ${linkColor}28`, background: `${linkColor}08`,
        transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {linkLabel} <ChevronRight size={14} />
      </Link>
    </div>
  );
}

const PLACEHOLDER_HOTELS = [
  { name: 'Grand Ocean Resort', city: 'Đà Nẵng', type: 'Resort', emoji: '🏖️', stars: 5, rooms: 24, price: 89 },
  { name: 'City Center Suites', city: 'Hà Nội', type: 'City Hotel', emoji: '🏙️', stars: 4, rooms: 18, price: 65 },
  { name: 'Palm Paradise Hotel', city: 'Phú Quốc', type: 'Resort', emoji: '🌴', stars: 5, rooms: 32, price: 120 },
  { name: 'Summit Luxury Lodge', city: 'Sapa', type: 'Resort', emoji: '🏔️', stars: 4, rooms: 16, price: 145 },
];

function HotelCard({ hotel, idx, navigate }) {
  const grad = DEST_GRADIENTS[idx % DEST_GRADIENTS.length];
  const isResort = hotel.hotel_type?.toLowerCase().includes('resort');
  return (
    <div className="glass-panel-hover" onClick={() => navigate(`/hotels/${hotel.id}`)} style={{
      borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
      border: '1px solid var(--card-border)', background: 'var(--card-bg)',
      backdropFilter: 'blur(12px)', transition: 'all 0.3s ease',
    }}>
      <div style={{ height: '155px', position: 'relative', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2.2rem', opacity: 0.45 }}>{isResort ? '🏖️' : '🏙️'}</span>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,13,20,0.6) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '99px', padding: '0.18rem 0.55rem', fontSize: '0.62rem', color: 'white', fontWeight: 600 }}>
          {hotel.hotel_type}
        </div>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '0.35rem' }}>
          {Array.from({ length: hotel.star_rating || 4 }, (_, i) => <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />)}
        </div>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{hotel.name}</h4>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <MapPin size={10} /> {hotel.city}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{hotel.total_rooms} phòng</span>
          {hotel.min_price && <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0ea5a0' }}>€{hotel.min_price}<span style={{ fontSize: '0.62rem', fontWeight: 400, color: 'var(--text-muted)' }}>/đêm</span></span>}
        </div>
      </div>
    </div>
  );
}

function PlaceholderHotelCard({ ph, idx, navigate }) {
  const grad = DEST_GRADIENTS[idx % DEST_GRADIENTS.length];
  return (
    <div className="glass-panel-hover" onClick={() => navigate('/hotels')} style={{
      borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
      border: '1px solid var(--card-border)', background: 'var(--card-bg)',
      backdropFilter: 'blur(12px)', transition: 'all 0.3s ease',
    }}>
      <div style={{ height: '155px', position: 'relative', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2.2rem', opacity: 0.45 }}>{ph.emoji}</span>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,13,20,0.6) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '99px', padding: '0.18rem 0.55rem', fontSize: '0.62rem', color: 'white', fontWeight: 600 }}>
          {ph.type}
        </div>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '0.35rem' }}>
          {Array.from({ length: ph.stars }, (_, i) => <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />)}
        </div>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{ph.name}</h4>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <MapPin size={10} /> {ph.city}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ph.rooms} loại phòng</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0ea5a0' }}>từ €{ph.price}<span style={{ fontSize: '0.62rem', fontWeight: 400, color: 'var(--text-muted)' }}>/đêm</span></span>
        </div>
      </div>
    </div>
  );
}

function ComboCard({ combo, idx }) {
  const badge = getComboLabel(combo);
  const grad = DEST_GRADIENTS[idx % DEST_GRADIENTS.length];
  return (
    <div className="glass-panel-hover" style={{
      borderRadius: '16px', overflow: 'hidden',
      border: '1px solid var(--card-border)', background: 'var(--card-bg)',
      backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ height: '160px', position: 'relative', background: combo.image_url ? `url(${combo.image_url}) center/cover no-repeat` : grad }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,13,20,0.75) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(6,13,20,0.75)', backdropFilter: 'blur(8px)', padding: '0.28rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, color: badge.color, border: `1px solid ${badge.color}40` }}>
          {badge.text}
        </div>
        <div style={{ position: 'absolute', bottom: '12px', left: '14px' }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.55)', marginBottom: '2px' }}>Từ</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            ${combo.price_estimate?.toFixed(0) || '--'}<span style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.65 }}>/đêm</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{combo.name}</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {combo.short_description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {combo.services?.filter(s => friendlyService(s)).slice(0, 5).map((svc, i) => (
            <span key={i} style={{ fontSize: '0.66rem', padding: '0.18rem 0.48rem', borderRadius: '99px', background: 'rgba(14,165,160,0.08)', border: '1px solid rgba(14,165,160,0.2)', color: '#0ea5a0' }}>
              {friendlyService(svc)}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--section-border)' }}>
          <Link to={`/combos/${combo.id}`} className="glass-button" style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.82rem', borderRadius: '9px', textDecoration: 'none' }}>
            Xem chi tiết <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.83rem', marginBottom: '0.2rem' }}>{title}</span>
      {links.map(l => (
        <Link key={l.to} to={l.to} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.78rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0ea5a0'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >{l.label}</Link>
      ))}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { ArrowRight, Sparkles, TrendingUp, Users, Compass, ShieldCheck, Search, Star, Zap, Heart, MapPin, Coffee, Sun, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const [data, setData] = useState({ combos: [], stats: {}, banners: [] });
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [hotelType, setHotelType] = useState('Resort');
  const [group, setGroup] = useState('Couple');
  const [season, setSeason] = useState('Summer');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const res = await axios.get('/api/public/landing');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLanding();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/combo-builder?hotel_type=${hotelType}&group=${group}&season=${season}`);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '5rem' }}>Đang tải trang chủ...</div>;
  }

  const banner = data.banners[0] || {
    title: "Tìm Gói Nghỉ Dưỡng Hoàn Hảo Cho Riêng Bạn",
    subtitle: "Hệ thống phân tích hàng trăm nghìn lượt đặt phòng thực tế để gợi ý gói dịch vụ phù hợp nhất với phong cách du lịch của bạn.",
    cta_text: "Bắt Đầu Tìm Kiếm",
    cta_link: "/combo-builder"
  };

  // Helper: convert lift/confidence into friendly badge
  const getComboLabel = (combo) => {
    if (combo.match_lift >= 2.0) return { text: '🔥 Phổ biến nhất', color: '#f97316' };
    if (combo.match_confidence >= 0.7) return { text: '⭐ Được yêu thích', color: '#eab308' };
    return { text: '✨ Khuyên dùng', color: '#818cf8' };
  };

  // Helper: make service tags human-readable
  const friendlyService = (svc) => {
    const map = {
      'Hotel_Resort': '🏖️ Resort', 'Hotel_City': '🏢 City Hotel',
      'Meal_BB': '🥐 Bữa sáng', 'Meal_HB': '🍽️ Bữa sáng + tối', 'Meal_FB': '🍴 Trọn gói ăn uống', 'Meal_SC': '🚫 Tự túc ăn uống',
      'Room_A': 'Phòng Standard', 'Room_B': 'Phòng Superior', 'Room_C': 'Phòng Deluxe', 'Room_D': 'Phòng Suite', 'Room_E': 'Phòng Cao cấp', 'Room_F': 'Phòng Gia đình', 'Room_G': 'Phòng VIP', 'Room_H': 'Phòng Penthouse',
      'Dep_NoDeposit': '✅ Không cần đặt cọc', 'Dep_NonRefund': '💳 Đặt cọc không hoàn', 'Dep_Refundable': '🔄 Đặt cọc hoàn tiền',
      'Parking_Yes': '🅿️ Có đỗ xe', 'Parking_No': '',
      'Group_Solo': '🧑 Đi một mình', 'Group_Couple': '💑 Cặp đôi', 'Group_Family': '👨‍👩‍👧 Gia đình', 'Group_Large': '👥 Nhóm lớn',
      'Season_Spring': '🌸 Mùa xuân', 'Season_Summer': '☀️ Mùa hè', 'Season_Autumn': '🍂 Mùa thu', 'Season_Winter': '❄️ Mùa đông',
      'Price_Budget': '💵 Tiết kiệm', 'Price_Mid': '💳 Tầm trung', 'Price_Premium': '💎 Cao cấp',
    };
    return map[svc] || svc.replace(/_/g, ' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }} className="animate-fade-in">
      {/* 1. Hero section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2.5rem',
        alignItems: 'center',
        marginTop: '1.5rem',
        minHeight: '420px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            color: '#818cf8',
            fontSize: '0.8rem',
            fontWeight: 600,
            width: 'fit-content'
          }}>
            <Sparkles size={14} />
            <span>Gợi ý thông minh từ dữ liệu thực</span>
          </div>
          
          <h1 style={{ fontSize: '3rem', lineHeight: 1.15, fontWeight: 800 }}>
            {banner.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px' }}>
            {banner.subtitle}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <Link to={banner.cta_link} className="glass-button" style={{ textDecoration: 'none' }}>
              <Search size={16} />
              <span>{banner.cta_text}</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/quiz" className="glass-button glass-button-secondary" style={{ textDecoration: 'none' }}>
              Quiz Du Lịch
            </Link>
          </div>
        </div>

        {/* 2. Hero search widget */}
        <GlassCard style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem' }}>Bạn muốn đi đâu?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cho chúng tôi biết sở thích, hệ thống sẽ tìm gói dịch vụ phù hợp nhất.</p>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>Loại khách sạn mong muốn</label>
              <select 
                value={hotelType} 
                onChange={(e) => setHotelType(e.target.value)} 
                className="glass-input"
                style={{ width: '100%', WebkitAppearance: 'none' }}
              >
                <option value="Resort">Resort Hotel (Nghỉ dưỡng ven biển)</option>
                <option value="City">City Hotel (Khách sạn trung tâm thành phố)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>Bạn đi cùng ai?</label>
                <select value={group} onChange={(e) => setGroup(e.target.value)} className="glass-input">
                  <option value="Solo">Đi một mình</option>
                  <option value="Couple">Cặp đôi</option>
                  <option value="Family">Gia đình có trẻ em</option>
                  <option value="Large">Nhóm đông người</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>Mùa dự kiến</label>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="glass-input">
                  <option value="Spring">Mùa Xuân (Th3 - Th5)</option>
                  <option value="Summer">Mùa Hạ (Th6 - Th8)</option>
                  <option value="Autumn">Mùa Thu (Th9 - Th11)</option>
                  <option value="Winter">Mùa Đông (Th12 - Th2)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="glass-button" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
              <Search size={16} />
              <span>Tìm combo phù hợp</span>
            </button>
          </form>
        </GlassCard>
      </section>

      {/* 3. Stats Counter — user-friendly language */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem'
      }}>
        {[
          { label: 'Lượt đặt phòng phân tích', value: data.stats.total_bookings?.toLocaleString() || '119,390', desc: 'Dữ liệu thực từ khách sạn quốc tế', icon: Compass },
          { label: 'Quốc gia du khách', value: data.stats.total_countries || '178', desc: 'Khách hàng từ khắp nơi trên thế giới', icon: Users },
          { label: 'Sự hài lòng', value: `${data.stats.match_percentage || 95}%`, desc: 'Dựa trên đánh giá thực tế', icon: ShieldCheck },
          { label: 'Gói dịch vụ đa dạng', value: data.stats.total_combos || '15+', desc: 'Tùy chỉnh theo nhu cầu của bạn', icon: TrendingUp }
        ].map((item, idx) => (
          <GlassCard key={idx} style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} hover={false}>
            <div style={{
              alignSelf: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--icon-circle-bg)',
              border: '1px solid var(--icon-circle-border)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <item.icon size={18} color="var(--primary)" />
            </div>
            <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</h4>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
          </GlassCard>
        ))}
      </section>

      {/* 4. How It Works — NEW section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Cách Hoạt Động</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Chỉ với 3 bước đơn giản, bạn sẽ nhận được gợi ý hoàn hảo</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', width: '100%' }}>
          {[
            { step: '01', icon: Search, title: 'Cho biết sở thích', desc: 'Chọn loại khách sạn, nhóm đi cùng, mùa du lịch và ngân sách mong muốn.', color: '#6366f1' },
            { step: '02', icon: Zap, title: 'Hệ thống phân tích', desc: 'Thuật toán thông minh phân tích dữ liệu từ hàng trăm nghìn lượt đặt phòng để tìm ra xu hướng.', color: '#0ea5e9' },
            { step: '03', icon: Star, title: 'Nhận gợi ý tối ưu', desc: 'Bạn nhận được Top 3 combo dịch vụ phù hợp nhất, sẵn sàng đặt phòng ngay.', color: '#d946ef' }
          ].map((item, idx) => (
            <GlassCard key={idx} style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative' }} hover={false}>
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: item.color, color: 'var(--text-primary)', width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '0.75rem', fontWeight: 800
              }}>{item.step}</div>
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px',
                background: 'var(--icon-circle-bg)', border: '1px solid var(--icon-circle-border)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem'
              }}>
                <item.icon size={24} color={item.color} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>{item.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 5. Hot Combos Section — NO algorithm terms */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>Gói Combo Được Yêu Thích Nhất</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Các tổ hợp dịch vụ được đa số du khách lựa chọn và đánh giá cao.</p>
          </div>
          <Link to="/combo-builder" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <span>Xem tất cả</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {data.combos.map((combo) => {
            const badge = getComboLabel(combo);
            return (
              <GlassCard key={combo.id} style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }} className="glass-panel-hover">
                {/* Image banner */}
                <div style={{
                  height: '160px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(217,70,239,0.2))',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    background: `url(${combo.image_url}) center/cover no-repeat`
                  }} />
                  
                  {/* Friendly badge instead of Lift */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(9, 13, 22, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: badge.color,
                    border: '1px solid var(--section-border)'
                  }}>
                    {badge.text}
                  </div>
                </div>

                {/* Body details */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{combo.name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '38px' }}>
                    {combo.short_description}
                  </p>
                  
                  {/* Services tags — human readable */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {combo.services.filter(s => friendlyService(s)).map((svc, i) => (
                      <span key={i} style={{
                        fontSize: '0.7rem',
                        background: 'var(--badge-bg)',
                        border: '1px solid var(--badge-border)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)'
                      }}>{friendlyService(svc)}</span>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--section-border)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mức giá từ</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)' }}>${combo.price_estimate?.toFixed(0)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/ đêm</span></div>
                    </div>
                    <Link to={`/combos/${combo.id}`} className="glass-button" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* 6. Feature Highlights — NEW section */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {[
          { icon: MapPin, title: 'Dữ liệu thực tế', desc: 'Gợi ý dựa trên phân tích hành vi đặt phòng thực tế từ hàng trăm nghìn du khách toàn cầu.', color: '#10b981' },
          { icon: Heart, title: 'Cá nhân hóa', desc: 'Mỗi gợi ý được thiết kế riêng cho phong cách du lịch, ngân sách và nhóm đi cùng của bạn.', color: '#f43f5e' },
          { icon: Coffee, title: 'Trọn gói tiện lợi', desc: 'Từ phòng nghỉ, bữa ăn, đỗ xe đến dịch vụ đặc biệt — tất cả trong một gói ưu đãi.', color: '#f59e0b' }
        ].map((item, idx) => (
          <GlassCard key={idx} style={{ padding: '1.75rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }} hover={false}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'var(--icon-circle-bg)', border: '1px solid var(--icon-circle-border)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0
            }}>
              <item.icon size={20} color={item.color} />
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>{item.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, marginTop: '0.3rem' }}>{item.desc}</p>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* 7. Quiz CTA — simplified single CTA */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(217, 70, 239, 0.08) 100%)',
        borderColor: 'rgba(99, 102, 241, 0.15)',
        padding: '3rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        borderRadius: '24px'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Bạn Thuộc Nhóm Du Khách Nào?</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', fontSize: '0.95rem' }}>
          Trả lời 5 câu hỏi nhanh để khám phá phong cách du lịch của bạn và nhận gợi ý combo được cá nhân hóa.
        </p>
        <Link to="/quiz" className="glass-button" style={{
          padding: '0.8rem 2rem',
          fontSize: '1rem',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #d946ef)'
        }}>
          Làm Quiz Ngay
        </Link>
      </GlassCard>

      {/* 8. Footer */}
      <footer style={{
        borderTop: '1px solid var(--section-border)',
        padding: '2.5rem 0 1.5rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>TravelMind</span>
          <span>Hệ thống gợi ý combo du lịch thông minh</span>
          <span>© 2026 TravelMind — Đồ án môn học KPDL</span>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Khám phá</span>
            <Link to="/combo-builder" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Tìm Combo</Link>
            <Link to="/quiz" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Quiz Du Lịch</Link>
            <Link to="/insights" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Xu Hướng</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Tài khoản</span>
            <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Đăng nhập</Link>
            <Link to="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Đăng ký</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

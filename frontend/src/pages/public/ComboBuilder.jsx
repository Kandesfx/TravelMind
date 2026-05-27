import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { ArrowRight, ArrowLeft, Sliders, CheckCircle, Flame, Percent, Star, ThumbsUp, Coffee, Car, Utensils, BedDouble, CreditCard, Sun, Snowflake, Leaf, Flower2 } from 'lucide-react';

// Service tag → human readable mapping
const SERVICE_MAP = {
  'Hotel_Resort': { label: 'Resort ven biển', icon: '🏖️' },
  'Hotel_City': { label: 'Khách sạn thành phố', icon: '🏢' },
  'Meal_BB': { label: 'Bao gồm bữa sáng', icon: '🥐' },
  'Meal_HB': { label: 'Bữa sáng + bữa tối', icon: '🍽️' },
  'Meal_FB': { label: 'Trọn gói ăn uống', icon: '🍴' },
  'Meal_SC': { label: 'Tự túc ăn uống', icon: '🍳' },
  'Room_A': { label: 'Phòng Standard', icon: '🛏️' },
  'Room_B': { label: 'Phòng Superior', icon: '🛏️' },
  'Room_C': { label: 'Phòng Deluxe', icon: '✨' },
  'Room_D': { label: 'Phòng Suite', icon: '👑' },
  'Room_E': { label: 'Phòng Cao cấp', icon: '💎' },
  'Room_F': { label: 'Phòng Gia đình', icon: '👨‍👩‍👧' },
  'Room_G': { label: 'Phòng VIP', icon: '⭐' },
  'Room_H': { label: 'Phòng Penthouse', icon: '🏛️' },
  'Dep_NoDeposit': { label: 'Không cần đặt cọc', icon: '✅' },
  'Dep_NonRefund': { label: 'Đặt cọc không hoàn', icon: '💳' },
  'Dep_Refundable': { label: 'Đặt cọc hoàn tiền', icon: '🔄' },
  'Parking_Yes': { label: 'Có chỗ đỗ xe', icon: '🅿️' },
  'Parking_No': null,
  'Group_Solo': { label: 'Phù hợp đi một mình', icon: '🧑' },
  'Group_Couple': { label: 'Phù hợp cặp đôi', icon: '💑' },
  'Group_Family': { label: 'Phù hợp gia đình', icon: '👨‍👩‍👧' },
  'Group_Large': { label: 'Phù hợp nhóm lớn', icon: '👥' },
  'Season_Spring': { label: 'Mùa xuân', icon: '🌸' },
  'Season_Summer': { label: 'Mùa hè', icon: '☀️' },
  'Season_Autumn': { label: 'Mùa thu', icon: '🍂' },
  'Season_Winter': { label: 'Mùa đông', icon: '❄️' },
  'Price_Budget': { label: 'Giá tiết kiệm', icon: '💵' },
  'Price_Mid': { label: 'Giá tầm trung', icon: '💳' },
  'Price_Premium': { label: 'Giá cao cấp', icon: '💎' },
  'SpecReq_None': null,
  'SpecReq_Few': { label: 'Hỗ trợ yêu cầu đặc biệt', icon: '📋' },
  'SpecReq_Many': { label: 'Nhiều dịch vụ đặc biệt', icon: '📋' },
  'Lead_LastMinute': { label: 'Đặt phút chót', icon: '⚡' },
  'Lead_Short': { label: 'Đặt trước ngắn hạn', icon: '📅' },
  'Lead_Medium': { label: 'Đặt trước 1-3 tháng', icon: '📅' },
  'Lead_Long': { label: 'Đặt trước dài hạn', icon: '📆' },
  'Weekend_None': null,
  'Weekend_Short': { label: 'Nghỉ cuối tuần ngắn', icon: '🌅' },
  'Weekend_Long': { label: 'Nghỉ cuối tuần dài', icon: '🌅' },
  'Weekday_Short': { label: 'Lưu trú 1-2 đêm', icon: '🌙' },
  'Weekday_Medium': { label: 'Lưu trú 3-5 đêm', icon: '🌙' },
  'Weekday_Long': { label: 'Lưu trú dài ngày', icon: '🌙' },
  'Repeat_Yes': { label: 'Khách quen', icon: '🔁' },
  'Repeat_No': null,
  'Cust_Transient': null,
  'Cust_Contract': { label: 'Khách hợp đồng', icon: '📝' },
  'Cust_TransientParty': null,
  'Cust_Group': { label: 'Đoàn khách', icon: '👥' },
  'Ch_OnlineTA': null,
  'Ch_OfflineTA': null,
  'Ch_Direct': { label: 'Đặt trực tiếp', icon: '🖥️' },
  'Ch_Corporate': { label: 'Khách doanh nghiệp', icon: '💼' },
  'Ch_Groups': null,
};

const friendlyService = (svc) => {
  return SERVICE_MAP[svc] || { label: svc.replace(/_/g, ' '), icon: '📌' };
};

export default function ComboBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [hotelType, setHotelType] = useState('Resort');
  const [group, setGroup] = useState('Couple');
  const [season, setSeason] = useState('Summer');
  const [budget, setBudget] = useState('Mid');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlHotel = searchParams.get('hotel_type');
    const urlGroup = searchParams.get('group');
    const urlSeason = searchParams.get('season');
    if (urlHotel && urlGroup && urlSeason) {
      setHotelType(urlHotel);
      setGroup(urlGroup);
      setSeason(urlSeason);
      setStep(4);
    }
  }, [searchParams]);

  const handleGetRecommendations = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStep(5);
    try {
      const res = await axios.post('/api/public/combos/recommend', {
        hotel_type: hotelType, group, season, budget
      });
      setRecommendations(res.data.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (rec) => {
    const year = new Date().getFullYear() + 1;
    let checkIn = `${year}-07-15`, checkOut = `${year}-07-20`;
    if (season === 'Spring') { checkIn = `${year}-04-15`; checkOut = `${year}-04-20`; }
    else if (season === 'Autumn') { checkIn = `${year}-10-15`; checkOut = `${year}-10-20`; }
    else if (season === 'Winter') { checkIn = `${year}-01-15`; checkOut = `${year}-01-20`; }
    let adults = 2, children = 0;
    if (group === 'Solo') adults = 1;
    else if (group === 'Family') { adults = 2; children = 1; }
    else if (group === 'Large') adults = 4;
    const meal = rec.combo.services.find(s => ['BB', 'HB', 'FB', 'SC'].includes(s)) || 'BB';
    const room = rec.combo.services.find(s => s.startsWith('Room_'))?.replace('Room_', '') || 'A';
    navigate(`/booking?combo_id=${rec.combo.id || 1}&hotel_type=${hotelType === 'Resort' ? 'Resort Hotel' : 'City Hotel'}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}&meal=${meal}&room_type=${room}`);
  };

  // Labels for user's selections summary
  const groupLabels = { Solo: 'Đi một mình', Couple: 'Cặp đôi', Family: 'Gia đình', Large: 'Nhóm lớn' };
  const seasonLabels = { Spring: 'Mùa Xuân', Summer: 'Mùa Hạ', Autumn: 'Mùa Thu', Winter: 'Mùa Đông' };
  const budgetLabels = { Budget: 'Tiết kiệm', Mid: 'Tầm trung', Premium: 'Cao cấp' };

  const stepTitles = [
    'Chọn loại hình khách sạn',
    'Bạn đi cùng ai?',
    'Bạn muốn đi mùa nào?',
    'Ngân sách lưu trú của bạn',
    'Gợi ý dành riêng cho bạn'
  ];

  // Match score as friendly percentage
  const getMatchScore = (confidence) => Math.min(Math.round(confidence * 100), 99);
  const getMatchLabel = (rank) => {
    if (rank === 1) return { text: '⭐ Phù hợp nhất', color: '#d946ef' };
    if (rank === 2) return { text: '👍 Rất phù hợp', color: '#0ea5e9' };
    return { text: '✨ Phù hợp', color: '#818cf8' };
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Tìm Combo Phù Hợp</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          Bước {step}/5: {stepTitles[step - 1]}
        </p>
        {step < 5 && (
          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px',
            maxWidth: '300px', margin: '1.25rem auto 0 auto', overflow: 'hidden'
          }}>
            <div style={{
              width: `${(step / 4) * 100}%`, height: '100%',
              background: 'var(--primary)', transition: 'var(--transition-smooth)'
            }} />
          </div>
        )}
      </div>

      {/* Step 1: Hotel Type */}
      {step === 1 && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[
              { id: 'Resort', label: 'Resort Hotel', emoji: '🏖️', desc: 'Nghỉ dưỡng ven biển, dịch vụ trọn gói, không khí thư giãn.' },
              { id: 'City', label: 'City Hotel', emoji: '🏢', desc: 'Trung tâm thành phố, di chuyển thuận tiện, phù hợp công tác.' }
            ].map(item => (
              <div key={item.id} onClick={() => setHotelType(item.id)} style={{
                border: hotelType === item.id ? '2px solid var(--primary)' : '1px solid var(--panel-border)',
                background: hotelType === item.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderRadius: '16px', padding: '2rem 1.5rem', cursor: 'pointer',
                textAlign: 'center', transition: 'var(--transition-smooth)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.emoji}</div>
                <h4 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>{item.label}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="glass-button" style={{ alignSelf: 'flex-end' }}>
            <span>Tiếp tục</span><ArrowRight size={16} />
          </button>
        </GlassCard>
      )}

      {/* Step 2: Group */}
      {step === 2 && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { id: 'Solo', label: 'Đi một mình', emoji: '🧑', desc: 'Du lịch solo' },
              { id: 'Couple', label: 'Cặp đôi', emoji: '💑', desc: 'Đi hai người' },
              { id: 'Family', label: 'Gia đình', emoji: '👨‍👩‍👧‍👦', desc: 'Có trẻ em đi cùng' },
              { id: 'Large', label: 'Nhóm lớn', emoji: '👥', desc: 'Từ 3 người lớn' }
            ].map(item => (
              <div key={item.id} onClick={() => setGroup(item.id)} style={{
                border: group === item.id ? '2px solid var(--primary)' : '1px solid var(--panel-border)',
                background: group === item.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderRadius: '12px', padding: '1.5rem 1rem', cursor: 'pointer',
                textAlign: 'center', transition: 'var(--transition-smooth)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} className="glass-button glass-button-secondary"><ArrowLeft size={16} /><span>Quay lại</span></button>
            <button onClick={() => setStep(3)} className="glass-button"><span>Tiếp tục</span><ArrowRight size={16} /></button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Season */}
      {step === 3 && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { id: 'Spring', label: 'Mùa Xuân', emoji: '🌸', desc: 'Tháng 3 - Tháng 5' },
              { id: 'Summer', label: 'Mùa Hạ', emoji: '☀️', desc: 'Tháng 6 - Tháng 8' },
              { id: 'Autumn', label: 'Mùa Thu', emoji: '🍂', desc: 'Tháng 9 - Tháng 11' },
              { id: 'Winter', label: 'Mùa Đông', emoji: '❄️', desc: 'Tháng 12 - Tháng 2' }
            ].map(item => (
              <div key={item.id} onClick={() => setSeason(item.id)} style={{
                border: season === item.id ? '2px solid var(--primary)' : '1px solid var(--panel-border)',
                background: season === item.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderRadius: '12px', padding: '1.5rem 1rem', cursor: 'pointer',
                textAlign: 'center', transition: 'var(--transition-smooth)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="glass-button glass-button-secondary"><ArrowLeft size={16} /><span>Quay lại</span></button>
            <button onClick={() => setStep(4)} className="glass-button"><span>Tiếp tục</span><ArrowRight size={16} /></button>
          </div>
        </GlassCard>
      )}

      {/* Step 4: Budget */}
      {step === 4 && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            {[
              { id: 'Budget', label: 'Tiết Kiệm', emoji: '💵', desc: 'Dưới $50/đêm' },
              { id: 'Mid', label: 'Tầm Trung', emoji: '💳', desc: '$50 - $150/đêm' },
              { id: 'Premium', label: 'Cao Cấp', emoji: '💎', desc: 'Trên $150/đêm' }
            ].map(item => (
              <div key={item.id} onClick={() => setBudget(item.id)} style={{
                border: budget === item.id ? '2px solid var(--primary)' : '1px solid var(--panel-border)',
                background: budget === item.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderRadius: '12px', padding: '1.75rem 1rem', cursor: 'pointer',
                textAlign: 'center', transition: 'var(--transition-smooth)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} className="glass-button glass-button-secondary"><ArrowLeft size={16} /><span>Quay lại</span></button>
            <button onClick={handleGetRecommendations} className="glass-button" style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}>
              <span>Tìm combo phù hợp</span><ArrowRight size={16} />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 5: Results — NO algorithm terms */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {loading ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
              Đang tìm combo phù hợp nhất cho bạn...
            </div>
          ) : (
            <>
              {/* Summary of user's choices */}
              <GlassCard style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }} hover={false}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tiêu chí của bạn:</span>
                {[
                  { label: hotelType === 'Resort' ? '🏖️ Resort' : '🏢 City Hotel' },
                  { label: `${['🧑','💑','👨‍👩‍👧','👥'][['Solo','Couple','Family','Large'].indexOf(group)]} ${groupLabels[group]}` },
                  { label: `${['🌸','☀️','🍂','❄️'][['Spring','Summer','Autumn','Winter'].indexOf(season)]} ${seasonLabels[season]}` },
                  { label: `${['💵','💳','💎'][['Budget','Mid','Premium'].indexOf(budget)]} ${budgetLabels[budget]}` }
                ].map((tag, i) => (
                  <span key={i} style={{
                    fontSize: '0.78rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                    padding: '0.25rem 0.6rem', borderRadius: '8px', color: '#818cf8', fontWeight: 600
                  }}>{tag.label}</span>
                ))}
              </GlassCard>

              {recommendations.map((rec) => {
                const matchScore = getMatchScore(rec.confidence);
                const matchLabel = getMatchLabel(rec.rank);
                const visibleServices = rec.combo.services.filter(s => SERVICE_MAP[s] !== null && SERVICE_MAP[s] !== undefined);

                return (
                  <GlassCard key={rec.rank} style={{
                    display: 'flex', gap: '2rem',
                    border: rec.rank === 1 ? '1px solid rgba(217, 70, 239, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                    background: rec.rank === 1 ? 'rgba(217, 70, 239, 0.02)' : 'rgba(255,255,255,0.03)'
                  }} className="glass-panel-hover animate-fade-in">
                    
                    {/* Left: rank & match score */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px', width: '130px', padding: '1rem', flexShrink: 0
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                        background: rec.rank === 1 ? '#d946ef' : 'rgba(255,255,255,0.06)',
                        color: rec.rank === 1 ? 'white' : matchLabel.color,
                        padding: '0.2rem 0.6rem', borderRadius: '10px',
                        fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.75rem'
                      }}>
                        <span>{matchLabel.text}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mức độ phù hợp</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'white', marginTop: '0.15rem' }}>{matchScore}%</div>
                      
                      {/* Progress bar instead of raw Lift */}
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                        <div style={{
                          width: `${matchScore}%`, height: '100%',
                          background: `linear-gradient(to right, ${matchLabel.color}, #d946ef)`,
                          borderRadius: '2px', transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>

                    {/* Middle: combo info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      <h3 style={{ fontSize: '1.3rem', color: 'white' }}>{rec.combo.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {rec.combo.short_description}
                      </p>
                      
                      {/* Services — human readable with icons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                        {visibleServices.map((svc, i) => {
                          const friendly = friendlyService(svc);
                          return (
                            <span key={i} style={{
                              fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              padding: '0.2rem 0.6rem', borderRadius: '6px', color: 'var(--text-secondary)'
                            }}>{friendly.icon} {friendly.label}</span>
                          );
                        })}
                      </div>

                      {/* Reason */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        💡 Phù hợp với bạn vì: {hotelType === 'Resort' ? 'Resort' : 'City Hotel'} • {groupLabels[group]} • {seasonLabels[season]} • {budgetLabels[budget]}
                      </div>
                    </div>

                    {/* Right: pricing & book */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
                      gap: '1rem', width: '180px', borderLeft: '1px solid rgba(255,255,255,0.05)',
                      paddingLeft: '2rem', flexShrink: 0
                    }}>
                      <div style={{ textAlign: 'right' }}>
                        {rec.combo.discount_percent > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>Tiết kiệm {rec.combo.discount_percent}%</div>
                        )}
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>${rec.combo.price_estimate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ đêm lưu trú</div>
                      </div>
                      <button onClick={() => handleBook(rec)} className="glass-button" style={{ width: '100%', justifyContent: 'center' }}>
                        <span>Đặt phòng</span><ArrowRight size={14} />
                      </button>
                    </div>
                  </GlassCard>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button onClick={() => setStep(4)} className="glass-button glass-button-secondary">
                  <ArrowLeft size={16} /><span>Chọn lại tiêu chí</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

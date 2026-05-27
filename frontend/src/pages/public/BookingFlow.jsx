import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { CheckCircle, ShieldCheck, Ticket, AlertCircle, PlusCircle, BedDouble, MapPin, Star, ChevronRight } from 'lucide-react';

export default function BookingFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Room & Hotel from URL
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Booking fields
  const [comboId, setComboId] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [meal, setMeal] = useState('BB');
  const [country, setCountry] = useState('VNM');
  const [depositType, setDepositType] = useState('No Deposit');
  const [parking, setParking] = useState(0);
  const [specialRequests, setSpecialRequests] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Voucher & pricing
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherValid, setVoucherValid] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0.0);

  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingRes, setBookingRes] = useState(null);

  // Load room details from URL params
  useEffect(() => {
    const roomId = searchParams.get('room_id');
    const cId = searchParams.get('combo_id');
    const cin = searchParams.get('check_in');
    const cout = searchParams.get('check_out');
    const ads = searchParams.get('adults');
    const chs = searchParams.get('children');
    const ml = searchParams.get('meal');

    if (cId) setComboId(parseInt(cId));
    if (cin) setCheckIn(cin);
    if (cout) setCheckOut(cout);
    if (ads) setAdults(parseInt(ads));
    if (chs) setChildren(parseInt(chs));
    if (ml) setMeal(ml);

    if (roomId) {
      setLoadingRoom(true);
      axios.get(`/api/public/rooms/${roomId}`)
        .then(res => {
          setRoom(res.data);
          if (res.data.hotel) setHotel(res.data.hotel);
        })
        .catch(console.error)
        .finally(() => setLoadingRoom(false));
    }
  }, [searchParams]);

  // Fetch dynamic pricing when dates or meal change
  useEffect(() => {
    if (!room || !checkIn || !checkOut) { setPricing(null); return; }
    axios.get(`/api/public/rooms/${room.id}?check_in=${checkIn}&check_out=${checkOut}&meal=${meal}`)
      .then(res => setPricing(res.data.pricing || null))
      .catch(() => setPricing(null));
  }, [room, checkIn, checkOut, meal]);

  const [recommendations, setRecommendations] = useState(null);

  // Fetch recommendations based on current selection
  useEffect(() => {
    if (!room) return;
    const params = new URLSearchParams({
      adults: adults.toString(),
      children: children.toString()
    });
    if (checkIn) params.append('check_in', checkIn);
    axios.get(`/api/public/rooms/${room.id}/recommendations?${params}`)
      .then(res => setRecommendations(res.data))
      .catch(console.error);
  }, [room, checkIn, adults, children]);

  const totalPrice = pricing ? pricing.total_price : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  // Validate Voucher
  const handleValidateVoucher = async () => {
    if (!voucherCode) return;
    try {
      const res = await axios.post('/api/public/vouchers/validate', {
        code: voucherCode, combo_id: comboId, total_price: totalPrice
      });
      setVoucherValid(res.data.valid);
      setVoucherMessage(res.data.message);
      setDiscountAmount(res.data.valid ? res.data.discount_amount : 0);
    } catch {
      setVoucherValid(false);
      setVoucherMessage('Lỗi validate voucher.');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) { alert('Vui lòng chọn ngày check-in và check-out'); return; }
    setSubmitting(true);

    try {
      const res = await axios.post('/api/public/bookings', {
        room_id: room?.id || null,
        combo_id: comboId,
        hotel_type: hotel?.hotel_type || 'Resort Hotel',
        check_in: checkIn,
        check_out: checkOut,
        adults, children, babies, meal, country,
        deposit_type: depositType,
        required_car_parking_spaces: parking,
        total_of_special_requests: specialRequests,
        voucher_code: voucherValid ? voucherCode : null,
        guest_name: guestName, guest_email: guestEmail,
        guest_phone: guestPhone, notes,
      });
      setBookingRes(res.data);
      setBooked(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi đặt phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Upsell logic
  const displayUpsellMeal = meal === 'HB';
  const displayUpsellParking = parking === 0 && hotel?.hotel_type?.includes('Resort') && (children > 0 || adults > 2);

  // ===== SUCCESS SCREEN =====
  if (booked) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }} className="animate-fade-in">
        <GlassCard style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }} hover={false}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ShieldCheck size={36} color="var(--success)" />
          </div>

          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Đặt Phòng Thành Công!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Cảm ơn bạn đã lựa chọn TravelMind. Mã đặt phòng: <strong style={{ color: 'var(--primary)' }}>{bookingRes?.booking_code}</strong>
          </p>

          <div style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--section-border)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            {bookingRes?.hotel_name && <InfoRow label="Khách sạn" value={bookingRes.hotel_name} />}
            {bookingRes?.room_name && <InfoRow label="Phòng" value={bookingRes.room_name} />}
            <InfoRow label="Thời gian" value={`${checkIn} → ${checkOut}`} />
            <InfoRow label="Tổng thanh toán" value={`€${bookingRes?.total_price}`} bold />
            {bookingRes?.discount_applied > 0 && (
              <InfoRow label="Đã giảm" value={`-€${bookingRes.discount_applied}`} color="var(--success)" />
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            ⚡ Đơn đặt phòng này đã được đồng bộ vào hệ thống phân tích luật kết hợp.
          </div>

          <button onClick={() => navigate('/')} className="glass-button" style={{ marginTop: '1rem' }}>
            Về Trang Chủ
          </button>
        </GlassCard>
      </div>
    );
  }

  // ===== BOOKING FORM =====
  return (
    <div className="animate-fade-in">
      {/* Room selected header */}
      {room && hotel && (
        <GlassCard hover={false} style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '12px',
            background: `linear-gradient(135deg, hsl(${(room.display_order || 1) * 40 + 200}, 70%, 45%), hsl(${(room.display_order || 1) * 40 + 260}, 70%, 55%))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
          }}>🏨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hotel.name} • {hotel.hotel_type}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{room.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
              <span>{room.bed_type}</span>•<span>{room.area_sqm}m²</span>•<span>{room.view_type}</span>•<span>Tối đa {room.max_adults}+{room.max_children}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>€{room.base_price_per_night}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/đêm (giá cơ bản)</div>
          </div>
        </GlassCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
        {/* Left Form */}
        <GlassCard style={{ padding: '2rem' }} hover={false}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Chi Tiết Đặt Phòng</h2>

          <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Guest Info */}
            <fieldset style={{ border: '1px solid var(--section-border)', borderRadius: '12px', padding: '1rem', margin: 0 }}>
              <legend style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, padding: '0 0.5rem' }}>Thông tin khách hàng</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormField label="Họ tên" value={guestName} onChange={setGuestName} placeholder="Nguyễn Văn A" />
                <FormField label="Email" value={guestEmail} onChange={setGuestEmail} type="email" placeholder="email@example.com" />
                <FormField label="Số điện thoại" value={guestPhone} onChange={setGuestPhone} placeholder="+84 xxx" />
                <FormField label="Quốc tịch (ISO)" value={country} onChange={v => setCountry(v.toUpperCase())} maxLength={3} />
              </div>
            </fieldset>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Ngày check-in" value={checkIn} onChange={setCheckIn} type="date" required />
              <FormField label="Ngày check-out" value={checkOut} onChange={setCheckOut} type="date" required />
            </div>

            {/* Guests */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <FormField label="Người lớn" value={adults} onChange={v => setAdults(parseInt(v))} type="number" min={1} max={10} />
              <FormField label="Trẻ em" value={children} onChange={v => setChildren(parseInt(v))} type="number" min={0} max={10} />
              <FormField label="Em bé" value={babies} onChange={v => setBabies(parseInt(v))} type="number" min={0} max={5} />
            </div>

            {/* Service options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>Loại bữa ăn</label>
                <select value={meal} onChange={(e) => setMeal(e.target.value)} className="glass-input">
                  {(room?.meal_options || [
                    { type: 'SC', name: 'Tự phục vụ', price: 0 },
                    { type: 'BB', name: 'Bed & Breakfast', price: 0 },
                    { type: 'HB', name: 'Half Board', price: 0 },
                    { type: 'FB', name: 'Full Board', price: 0 },
                  ]).map(opt => (
                    <option key={opt.type} value={opt.type}>
                      {opt.type} — {opt.name} {opt.price > 0 ? `(+€${opt.price}/đêm)` : '(miễn phí)'}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>Đặt cọc</label>
                <select value={depositType} onChange={(e) => setDepositType(e.target.value)} className="glass-input">
                  <option value="No Deposit">Không đặt cọc</option>
                  <option value="Non Refund">Không hoàn hủy</option>
                  <option value="Refundable">Có hoàn lại</option>
                </select>
              </div>
            </div>

            {/* Extra */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Chỗ đỗ xe (số xe)" value={parking} onChange={v => setParking(parseInt(v))} type="number" min={0} max={4} />
              <FormField label="Yêu cầu đặc biệt" value={specialRequests} onChange={v => setSpecialRequests(parseInt(v))} type="number" min={0} max={5} />
            </div>

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>Ghi chú</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="glass-input"
                rows={2} placeholder="Yêu cầu đặc biệt, giờ đến dự kiến..." style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="glass-button" style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.85rem' }} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : `Xác Nhận Đặt Phòng — €${finalPrice.toFixed(2)}`}
            </button>
          </form>
        </GlassCard>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ===== AI CONTEXT BANNER ===== */}
          {recommendations?.context && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '14px', padding: '1rem 1.2rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', flexShrink: 0
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gợi Ý Thông Minh — AI Insights</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Dựa trên phân tích luật kết hợp từ dữ liệu khách hàng thực tế</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {[
                  { label: 'Hồ sơ', value: recommendations.context.group },
                  { label: 'Loại KS', value: recommendations.context.hotel_type },
                  { label: 'Mùa', value: recommendations.context.season },
                  { label: 'Phân khúc', value: recommendations.context.budget },
                ].map((tag, i) => (
                  <span key={i} style={{
                    fontSize: '0.65rem', padding: '0.2rem 0.5rem',
                    borderRadius: '6px', background: 'rgba(99,102,241,0.15)',
                    color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.02em'
                  }}>{tag.label}: {tag.value}</span>
                ))}
              </div>
            </div>
          )}

          {/* ===== UPSELL SUGGESTIONS ===== */}
          {recommendations?.upsell_suggestions && recommendations.upsell_suggestions.length > 0 && (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderColor: 'rgba(251, 191, 36, 0.25)', background: 'rgba(251, 191, 36, 0.04)' }} hover={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24' }}>
                <Star size={16} /> Đề Xuất Nâng Cấp
              </div>
              {recommendations.upsell_suggestions.map((sug, i) => {
                if (sug.type === 'meal' && meal === sug.target_value) return null;
                if (sug.type === 'parking' && parking === sug.target_value) return null;
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.15)',
                    borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <PlusCircle size={14} color="#818cf8" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sug.title}</span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24',
                        padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(251,191,36,0.12)'
                      }}>+€{sug.price_delta}/đêm</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {sug.description}
                    </p>
                    <div style={{
                      fontSize: '0.68rem', color: '#a78bfa', fontWeight: 500,
                      background: 'rgba(167,139,250,0.08)', borderRadius: '6px', padding: '0.35rem 0.5rem',
                      borderLeft: '3px solid #a78bfa'
                    }}>
                      💡 {sug.reason}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (sug.type === 'meal') setMeal(sug.target_value);
                        else if (sug.type === 'parking') setParking(sug.target_value);
                        else if (sug.type === 'room_upgrade') {
                          navigate(`/booking?room_id=${sug.target_value}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}&meal=${meal}`);
                        }
                      }}
                      className="glass-button"
                      style={{
                        padding: '0.4rem 0.85rem', fontSize: '0.72rem', alignSelf: 'flex-start',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
                        borderColor: 'rgba(99,102,241,0.3)'
                      }}
                    >
                      {sug.type === 'room_upgrade' ? '⬆ Nâng cấp phòng' : '✓ Áp dụng ngay'}
                    </button>
                  </div>
                );
              })}
            </GlassCard>
          )}

          {/* ===== SMART ROOM ALTERNATIVES ===== */}
          {recommendations?.smart_rooms && recommendations.smart_rooms.length > 0 && (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.25)', background: 'rgba(16, 185, 129, 0.04)' }} hover={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                <BedDouble size={16} /> Phòng Thay Thế Phù Hợp
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '-0.3rem' }}>
                Dựa trên hành vi đặt phòng của du khách có hồ sơ tương tự bạn
              </div>
              {recommendations.smart_rooms.map((sr, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.15)',
                  borderRadius: '10px', padding: '0.75rem', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                  onClick={() => navigate(`/booking?room_id=${sr.room.id}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}&meal=${meal}`)}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'; }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: `linear-gradient(135deg, hsl(${160 + i * 30}, 60%, 40%), hsl(${180 + i * 30}, 70%, 50%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                  }}>🛏</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sr.room.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span>{sr.room.bed_type}</span>•<span>{sr.room.area_sqm}m²</span>•<span>{sr.room.view_type}</span>
                    </div>
                    <div style={{
                      fontSize: '0.65rem', color: '#10b981', fontWeight: 500, marginTop: '0.25rem',
                      lineHeight: 1.4
                    }}>
                      {sr.reason}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>€{sr.room.base_price_per_night}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>/đêm</div>
                    <div style={{
                      fontSize: '0.6rem', marginTop: '0.2rem', padding: '0.1rem 0.35rem',
                      borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#34d399',
                      fontWeight: 600, textAlign: 'center'
                    }}>
                      {Math.round(sr.confidence * 100)}% match
                    </div>
                  </div>
                </div>
              ))}
            </GlassCard>
          )}

          {/* ===== SIMILAR GUESTS BEHAVIOR ===== */}
          {recommendations?.similar_behaviors && recommendations.similar_behaviors.length > 0 && (
            <GlassCard style={{
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              borderColor: 'rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.03)'
            }} hover={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#818cf8' }}>
                👥 Hành Vi Khách Tương Tự
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-0.2rem' }}>
                Phân tích từ {recommendations.context?.group || 'khách'} đi vào mùa {recommendations.context?.season || ''} tại {recommendations.context?.hotel_type || ''} Hotel
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {recommendations.similar_behaviors.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    padding: '0.45rem 0.6rem', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.06)', fontSize: '0.72rem',
                    color: 'var(--text-secondary)', lineHeight: 1.45
                  }}>
                    <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                      {i === 0 ? '📊' : i === 1 ? '🎯' : '💎'}
                    </span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* ===== BILLING BOX ===== */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} hover={false}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Chi Tiết Thanh Toán</h3>

            {pricing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <InfoRow label={`Giá phòng (${pricing.total_nights} đêm)`} value={`€${pricing.room_cost}`} />
                <InfoRow label={`Mùa: ${pricing.season}`} value={`×${pricing.seasonal_multiplier}`} small />
                {pricing.weekend_nights > 0 && <InfoRow label={`Cuối tuần (${pricing.weekend_nights} đêm)`} value={`+€${(pricing.weekend_surcharge * pricing.weekend_nights).toFixed(2)}`} small />}
                {pricing.total_meal_cost > 0 && <InfoRow label={`Bữa ăn ${pricing.meal_type} (${pricing.total_nights} đêm)`} value={`€${pricing.total_meal_cost}`} />}
                {discountAmount > 0 && <InfoRow label="Khuyến mãi" value={`-€${discountAmount.toFixed(2)}`} color="var(--success)" />}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--section-border)', paddingTop: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Tổng cộng</span>
                  <span style={{ color: 'var(--primary)' }}>€{finalPrice.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ADR trung bình: €{pricing.adr}/đêm</div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Chọn ngày check-in/out để xem giá
              </div>
            )}

            {/* Voucher input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mã giảm giá (Voucher)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Nhập mã..." value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)}
                  className="glass-input" style={{ flex: 1, padding: '0.5rem' }}
                />
                <button type="button" onClick={handleValidateVoucher} className="glass-button glass-button-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Áp dụng</button>
              </div>
              {voucherValid === true && <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{voucherMessage}</div>}
              {voucherValid === false && <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{voucherMessage}</div>}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', required, placeholder, min, max, maxLength }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--label-color)' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        className="glass-input" required={required} placeholder={placeholder}
        min={min} max={max} maxLength={maxLength}
      />
    </div>
  );
}

function InfoRow({ label, value, bold, color, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: small ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: small ? '0.75rem' : undefined }}>{label}</span>
      <span style={{ color: color || 'var(--text-primary)', fontWeight: bold ? 700 : 'normal' }}>{value}</span>
    </div>
  );
}

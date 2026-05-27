import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { CheckCircle, ShieldCheck, Ticket, AlertCircle, ShoppingBag, PlusCircle } from 'lucide-react';

export default function BookingFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Booking fields
  const [comboId, setComboId] = useState(null);
  const [hotelType, setHotelType] = useState('Resort Hotel');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [meal, setMeal] = useState('BB');
  const [roomType, setRoomType] = useState('A');
  const [country, setCountry] = useState('VNM');
  const [depositType, setDepositType] = useState('No Deposit');
  const [parking, setParking] = useState(0);
  const [specialRequests, setSpecialRequests] = useState(0);
  
  // Voucher & pricing
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherValid, setVoucherValid] = useState(null); // null, true, false
  const [voucherMessage, setVoucherMessage] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0.0);
  const [finalPrice, setFinalPrice] = useState(0.0);
  
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingRes, setBookingRes] = useState(null);

  // Auto-fill from URL params
  useEffect(() => {
    const cId = searchParams.get('combo_id');
    const hotel = searchParams.get('hotel_type');
    const cin = searchParams.get('check_in');
    const cout = searchParams.get('check_out');
    const ads = searchParams.get('adults');
    const chs = searchParams.get('children');
    const ml = searchParams.get('meal');
    const rm = searchParams.get('room_type');

    if (cId) setComboId(parseInt(cId));
    if (hotel) setHotelType(hotel);
    if (cin) setCheckIn(cin);
    if (cout) setCheckOut(cout);
    if (ads) setAdults(parseInt(ads));
    if (chs) setChildren(parseInt(chs));
    if (ml) setMeal(ml);
    if (rm) setRoomType(rm);
  }, [searchParams]);

  // Calculate nights and base price
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const cin = new Date(checkIn);
    const cout = new Date(checkOut);
    const diff = (cout - cin) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };

  const calculateBasePrice = () => {
    const nights = calculateNights();
    if (nights <= 0) return 0;
    
    let baseAdr = hotelType.toLowerCase().includes('resort') ? 120.0 : 90.0;
    if (['D', 'E', 'F'].includes(roomType)) baseAdr += 30.0;
    if (meal === 'HB') baseAdr += 20.0;
    else if (meal === 'FB') baseAdr += 45.0;
    
    return baseAdr * nights;
  };

  const basePrice = calculateBasePrice();
  const calculatedNights = calculateNights();

  // Validate Voucher
  const handleValidateVoucher = async () => {
    if (!voucherCode) return;
    try {
      const res = await axios.post('/api/public/vouchers/validate', {
        code: voucherCode,
        combo_id: comboId,
        total_price: basePrice
      });
      setVoucherValid(res.data.valid);
      setVoucherMessage(res.data.message);
      if (res.data.valid) {
        setDiscountAmount(res.data.discount_amount);
      } else {
        setDiscountAmount(0.0);
      }
    } catch (e) {
      setVoucherValid(false);
      setVoucherMessage('Lỗi validate voucher.');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await axios.post('/api/bookings', {
        combo_id: comboId,
        hotel_type: hotelType,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        babies,
        meal,
        room_type: roomType,
        country,
        deposit_type: depositType,
        required_car_parking_spaces: parking,
        total_of_special_requests: specialRequests,
        voucher_code: voucherValid ? voucherCode : null
      });
      setBookingRes(res.data);
      setBooked(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi đặt phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Upsell logic based on association rules
  // If guest selected HB, suggest FB
  // If guest is family resort summer and selected parking=0, suggest parking
  const displayUpsellMeal = meal === 'HB';
  const displayUpsellParking = parking === 0 && hotelType === 'Resort Hotel' && (children > 0 || adults > 2);

  if (booked) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }} className="animate-fade-in">
        <GlassCard style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ShieldCheck size={36} color="var(--success)" />
          </div>
          
          <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Đặt Phòng Thành Công!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Cảm ơn bạn đã lựa chọn dịch vụ của TravelMind. Mã đơn hàng của bạn là **#{bookingRes?.booking_id}**.
            Hành trình của bạn đã được xác nhận.
          </p>

          <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Loại khách sạn:</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{hotelType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Thời gian:</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{checkIn} đến {checkOut} ({calculatedNights} đêm)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
              <span style={{ color: 'white', fontWeight: 700 }}>${bookingRes?.total_price}</span>
            </div>
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            ⚡ Thông tin đặt phòng này đã được đồng bộ hóa thành công vào database để phân tích luật kết hợp cho các combo du lịch tiếp theo.
          </div>

          <button onClick={() => navigate('/')} className="glass-button" style={{ marginTop: '1rem' }}>
            Về Trang Chủ
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }} className="animate-fade-in">
      {/* Left Form */}
      <GlassCard style={{ padding: '2rem' }} hover={false}>
        <h2 style={{ fontSize: '1.6rem', color: 'white', marginBottom: '1.5rem' }}>Chi Tiết Đặt Phòng</h2>
        
        <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Hotel type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Loại khách sạn</label>
            <select value={hotelType} onChange={(e) => setHotelType(e.target.value)} className="glass-input">
              <option value="Resort Hotel">Resort Hotel</option>
              <option value="City Hotel">City Hotel</option>
            </select>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Ngày check-in</label>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="glass-input" required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Ngày check-out</label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="glass-input" required />
            </div>
          </div>

          {/* Guests */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Người lớn</label>
              <input type="number" min="1" max="10" value={adults} onChange={(e) => setAdults(parseInt(e.target.value))} className="glass-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Trẻ em</label>
              <input type="number" min="0" max="10" value={children} onChange={(e) => setChildren(parseInt(e.target.value))} className="glass-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Em bé</label>
              <input type="number" min="0" max="10" value={babies} onChange={(e) => setBabies(parseInt(e.target.value))} className="glass-input" />
            </div>
          </div>

          {/* Service options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Loại bữa ăn</label>
              <select value={meal} onChange={(e) => setMeal(e.target.value)} className="glass-input">
                <option value="BB">BB (Bed & Breakfast)</option>
                <option value="HB">HB (Half Board - Sáng + Tối)</option>
                <option value="FB">FB (Full Board - Trọn gói 3 bữa)</option>
                <option value="SC">SC (Tự phục vụ)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Loại phòng</label>
              <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="glass-input">
                <option value="A">Phòng Loại A (Standard)</option>
                <option value="D">Phòng Loại D (Double Suite)</option>
                <option value="E">Phòng Loại E (Executive)</option>
                <option value="F">Phòng Loại F (Family Suite)</option>
              </select>
            </div>
          </div>

          {/* Additional features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Chỗ đỗ xe ô tô (số xe)</label>
              <input type="number" min="0" max="4" value={parking} onChange={(e) => setParking(parseInt(e.target.value))} className="glass-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Số yêu cầu đặc biệt</label>
              <input type="number" min="0" max="5" value={specialRequests} onChange={(e) => setSpecialRequests(parseInt(e.target.value))} className="glass-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Quốc tịch (Mã ISO)</label>
              <input type="text" maxLength="3" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} className="glass-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Loại đặt cọc</label>
              <select value={depositType} onChange={(e) => setDepositType(e.target.value)} className="glass-input">
                <option value="No Deposit">No Deposit (Không cọc)</option>
                <option value="Non Refund">Non Refund (Không hoàn hủy)</option>
                <option value="Refundable">Refundable (Có hoàn lại)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="glass-button" style={{ marginTop: '1rem', justifyContent: 'center' }} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : `Xác Nhận Đặt Phòng — $${(basePrice - discountAmount).toFixed(2)}`}
          </button>
        </form>
      </GlassCard>

      {/* Right side billing detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Upsell Panels */}
        {displayUpsellMeal && (
          <GlassCard style={{
            background: 'rgba(99, 102, 241, 0.05)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <PlusCircle size={16} />
              <span>Gợi ý nâng cấp dịch vụ (Upsell)</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Du khách chọn Half Board thường nâng cấp lên gói trọn gói **Full Board (FB)** để được phục vụ 3 bữa ăn đầy đủ với giá tiết kiệm hơn 15%.
            </p>
            <button onClick={() => setMeal('FB')} className="glass-button" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', marginTop: '0.25rem', alignSelf: 'flex-start' }}>
              Nâng cấp lên FB
            </button>
          </GlassCard>
        )}

        {displayUpsellParking && (
          <GlassCard style={{
            background: 'rgba(99, 102, 241, 0.05)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }} hover={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <PlusCircle size={16} />
              <span>Thêm chỗ đỗ xe?</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              71% các gia đình nghỉ dưỡng tại Resort vào mùa hè lựa chọn thêm chỗ đỗ xe ô tô. Đăng ký đỗ xe miễn phí ngay bây giờ.
            </p>
            <button onClick={() => setParking(1)} className="glass-button" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', marginTop: '0.25rem', alignSelf: 'flex-start' }}>
              Thêm 1 chỗ đỗ xe
            </button>
          </GlassCard>
        )}

        {/* Billing box */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} hover={false}>
          <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Chi Chi Tiết Thanh Toán</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Giá phòng gốc:</span>
              <span style={{ color: 'white' }}>${basePrice.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Khuyến mãi áp dụng:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span style={{ color: 'white' }}>Tổng cộng:</span>
              <span style={{ color: 'white' }}>${(basePrice - discountAmount).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Voucher input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mã giảm giá (Voucher)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Nhập mã..." 
                value={voucherCode} 
                onChange={(e) => setVoucherCode(e.target.value)} 
                className="glass-input"
                style={{ flex: 1, padding: '0.5rem' }}
              />
              <button 
                type="button" 
                onClick={handleValidateVoucher} 
                className="glass-button glass-button-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                Áp dụng
              </button>
            </div>
            {voucherValid === true && <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{voucherMessage}</div>}
            {voucherValid === false && <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{voucherMessage}</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

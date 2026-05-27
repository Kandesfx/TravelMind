import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { MapPin, Star, Phone, Mail, Clock, ChevronRight, BedDouble, Users, Maximize, Eye, Coffee } from 'lucide-react';

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/public/hotels/${id}`)
      .then(res => setHotel(res.data))
      .catch(() => navigate('/hotels'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>Đang tải...</div>;
  }

  if (!hotel) return null;

  const amenities = typeof hotel.amenities === 'string' ? hotel.amenities.split(' ') : (hotel.amenities || []);
  const starArray = Array.from({ length: hotel.star_rating }, (_, i) => i);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link to="/hotels" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Khách sạn</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-secondary)' }}>{hotel.name}</span>
      </div>

      {/* Hero Banner */}
      <div style={{
        height: '260px', borderRadius: '16px', overflow: 'hidden', position: 'relative',
        background: hotel.hotel_type.includes('Resort')
          ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #d946ef 100%)'
          : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #0ea5e9 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.15rem', marginBottom: '0.5rem' }}>
            {starArray.map(i => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>{hotel.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
            <MapPin size={16} />
            <span>{hotel.location}, {hotel.city}, {hotel.country}</span>
          </div>
        </div>
        <div style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
          padding: '0.4rem 1rem', borderRadius: '20px', color: 'white', fontWeight: 600, fontSize: '0.85rem'
        }}>
          {hotel.hotel_type}
        </div>
      </div>

      {/* Info Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <GlassCard hover={false} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check-in / Check-out</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{hotel.check_in_time} — {hotel.check_out_time}</div>
          </div>
        </GlassCard>
        <GlassCard hover={false} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BedDouble size={18} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng phòng</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{hotel.total_rooms} phòng • {(hotel.rooms || []).length} loại</div>
          </div>
        </GlassCard>
        <GlassCard hover={false} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={18} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Liên hệ</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{hotel.contact_phone}</div>
          </div>
        </GlassCard>
      </div>

      {/* Description + Amenities */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <GlassCard hover={false}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Giới thiệu</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem' }}>{hotel.description}</p>
          {hotel.cancellation_policy && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.25rem' }}>Chính sách hủy</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{hotel.cancellation_policy}</div>
            </div>
          )}
        </GlassCard>
        <GlassCard hover={false}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Tiện nghi</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {amenities.map((a, i) => (
              <span key={i} style={{
                background: 'var(--badge-bg)', border: '1px solid var(--badge-border)',
                padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem',
                color: 'var(--text-secondary)', textTransform: 'capitalize'
              }}>
                {a.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Rooms Section */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Phòng có sẵn ({(hotel.rooms || []).length} loại)</h2>

        {/* AI Recommendation Tip */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
              Gợi ý từ hệ thống AI
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {hotel.hotel_type?.includes('Resort')
                ? '📊 Theo phân tích từ dữ liệu thực tế: 72% gia đình nghỉ resort ưu tiên phòng Suite (loại D, E) kèm gói Half Board. Hệ thống sẽ gợi ý tối ưu khi bạn chọn phòng và tiến hành đặt.'
                : '📊 Theo phân tích từ dữ liệu thực tế: 88% khách công tác City Hotel chọn phòng Standard/Superior (loại A, B) kèm gói Bed & Breakfast. Hệ thống sẽ đề xuất tối ưu khi bạn chọn phòng.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(hotel.rooms || []).map(room => (
            <RoomRow key={room.id} room={room} hotelId={hotel.id} navigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoomRow({ room, hotelId, navigate }) {
  const amenities = room.amenities || [];

  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', minHeight: '150px' }}>
        {/* Room thumbnail/gradient */}
        <div style={{
          background: `linear-gradient(135deg, hsl(${(room.display_order || 1) * 40 + 200}, 70%, 45%), hsl(${(room.display_order || 1) * 40 + 260}, 70%, 55%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', color: 'rgba(255,255,255,0.5)'
        }}>
          {room.room_type === 'A' ? '🛏️' : room.room_type === 'D' ? '🛋️' : room.room_type === 'E' ? '👔' :
           room.room_type === 'F' ? '👨‍👩‍👧' : room.room_type === 'G' ? '👑' : '🏨'}
        </div>

        {/* Room info */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
              padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700
            }}>
              {room.room_type}
            </span>
            <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{room.name}</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
            {room.short_description}
          </p>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BedDouble size={13} /> {room.bed_type}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Maximize size={13} /> {room.area_sqm}m²</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={13} /> {room.max_adults}+{room.max_children}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Eye size={13} /> {room.view_type}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
            {amenities.slice(0, 5).map((a, i) => (
              <span key={i} style={{
                background: 'var(--badge-bg)', border: '1px solid var(--badge-border)',
                padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', color: 'var(--text-muted)'
              }}>
                {a.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Price + CTA */}
        <div style={{
          padding: '1.25rem', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem',
          borderLeft: '1px solid var(--section-border)', minWidth: '160px'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>€{room.base_price_per_night}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/đêm (giá cơ bản)</div>
          </div>
          <div style={{ fontSize: '0.7rem', color: room.available_count > 3 ? 'var(--success)' : 'var(--warning)' }}>
            Còn {room.available_count || room.total_inventory} phòng
          </div>
          <button
            onClick={() => navigate(`/booking?room_id=${room.id}&hotel_id=${hotelId}`)}
            className="glass-button"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            Đặt ngay <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

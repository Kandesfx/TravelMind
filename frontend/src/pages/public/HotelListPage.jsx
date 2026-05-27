import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { MapPin, Star, Wifi, Car, UtensilsCrossed, Waves, Dumbbell, Building, Search, ChevronRight, Users, BedDouble } from 'lucide-react';

const AMENITY_ICONS = {
  wifi: Wifi, parking: Car, restaurant: UtensilsCrossed, pool: Waves,
  gym: Dumbbell, spa: Waves, beach: Waves, bar: UtensilsCrossed,
  business_center: Building,
};

export default function HotelListPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/public/hotels').then(res => {
      setHotels(res.data.hotels || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filterType
    ? hotels.filter(h => h.hotel_type === filterType)
    : hotels;

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Đang tải danh sách khách sạn...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero section */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #6366f1, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Khách Sạn Của Chúng Tôi
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Khám phá bộ sưu tập khách sạn và resort cao cấp tại Bồ Đào Nha — được phân tích từ 119,390 lượt đặt phòng thực tế.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { value: '', label: 'Tất cả' },
          { value: 'Resort Hotel', label: '🏖️ Resort Hotel' },
          { value: 'City Hotel', label: '🏙️ City Hotel' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={filterType === f.value ? 'glass-button' : 'glass-button glass-button-secondary'}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '20px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Hotels Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: '1.5rem' }}>
        {filtered.map(hotel => (
          <HotelCard key={hotel.id} hotel={hotel} onNavigate={() => navigate(`/hotels/${hotel.id}`)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Không tìm thấy khách sạn phù hợp.
        </div>
      )}
    </div>
  );
}

function HotelCard({ hotel, onNavigate }) {
  const starArray = Array.from({ length: hotel.star_rating }, (_, i) => i);
  const amenities = typeof hotel.amenities === 'string'
    ? hotel.amenities.split(' ')
    : (hotel.amenities || []);

  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} hover={true}>
      <div onClick={onNavigate} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Image placeholder with gradient */}
        <div style={{
          height: '180px',
          background: hotel.hotel_type.includes('Resort')
            ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1.25rem',
          position: 'relative',
        }}>
          {/* Type badge */}
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
            padding: '0.3rem 0.75rem', borderRadius: '20px',
            fontSize: '0.75rem', color: 'white', fontWeight: 600
          }}>
            {hotel.hotel_type}
          </div>

          {/* Hotel icon */}
          <div style={{ 
            fontSize: '2.5rem', position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -60%)', opacity: 0.3 
          }}>
            {hotel.hotel_type.includes('Resort') ? '🏝️' : '🏢'}
          </div>

          <h3 style={{ color: 'white', fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem', zIndex: 1 }}>
            {hotel.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', zIndex: 1 }}>
            <MapPin size={14} />
            <span>{hotel.location}, {hotel.city}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Stars + Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.15rem' }}>
              {starArray.map(i => (
                <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{hotel.star_rating} sao</span>
          </div>

          {/* Short description */}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
            {hotel.short_description}
          </p>

          {/* Amenities pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {amenities.slice(0, 6).map((a, i) => (
              <span key={i} style={{
                background: 'var(--badge-bg)', border: '1px solid var(--badge-border)',
                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem',
                color: 'var(--text-muted)', textTransform: 'capitalize'
              }}>
                {a.replace(/_/g, ' ')}
              </span>
            ))}
            {amenities.length > 6 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem' }}>
                +{amenities.length - 6}
              </span>
            )}
          </div>

          {/* Bottom row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid var(--section-border)', paddingTop: '0.75rem', marginTop: '0.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <BedDouble size={14} />
                <span>{hotel.total_rooms} phòng</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {hotel.min_price && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Từ</span>
              )}
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                {hotel.min_price ? `€${hotel.min_price}` : '—'}
              </span>
              {hotel.min_price && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/đêm</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

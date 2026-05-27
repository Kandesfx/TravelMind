import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Building, BedDouble, Plus, Edit, Trash2, Star, MapPin, ChevronDown, ChevronUp, Save, X } from 'lucide-react';

export default function HotelManager() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHotel, setExpandedHotel] = useState(null);
  const [occupancy, setOccupancy] = useState([]);

  const fetchHotels = () => {
    setLoading(true);
    axios.get('/api/admin/inventory/hotels')
      .then(res => setHotels(res.data.hotels || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchOccupancy = () => {
    axios.get('/api/admin/inventory/occupancy')
      .then(res => setOccupancy(res.data.occupancy || []))
      .catch(console.error);
  };

  useEffect(() => { fetchHotels(); fetchOccupancy(); }, []);

  const getOccupancyForHotel = (hotelId) => occupancy.find(o => o.hotel_id === hotelId) || {};

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Đang tải...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Quản Lý Khách Sạn & Phòng</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Quản lý {hotels.length} khách sạn trong hệ thống</p>
        </div>
      </div>

      {/* Occupancy Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {occupancy.map(o => (
          <GlassCard key={o.hotel_id} hover={false} style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{o.hotel_name}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: o.occupancy_rate > 70 ? 'var(--success)' : o.occupancy_rate > 40 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {o.occupancy_rate}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {o.active_bookings}/{o.total_inventory} phòng • €{o.total_revenue.toLocaleString()}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Hotel List */}
      {hotels.map(hotel => {
        const isExpanded = expandedHotel === hotel.id;
        const occ = getOccupancyForHotel(hotel.id);
        const rooms = hotel.rooms || [];

        return (
          <GlassCard key={hotel.id} hover={false} style={{ padding: 0, overflow: 'hidden' }}>
            {/* Hotel Header */}
            <div
              onClick={() => setExpandedHotel(isExpanded ? null : hotel.id)}
              style={{
                padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: isExpanded ? '1px solid var(--section-border)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: hotel.hotel_type.includes('Resort') ? 'rgba(14,165,233,0.1)' : 'rgba(139,92,246,0.1)',
                  fontSize: '1.5rem'
                }}>
                  {hotel.hotel_type.includes('Resort') ? '🏖️' : '🏙️'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{hotel.name}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--badge-bg)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      {hotel.hotel_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                    <MapPin size={12} /> {hotel.city} • {rooms.length} loại phòng • {hotel.total_rooms} phòng tổng
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {occ.occupancy_rate !== undefined && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{occ.occupancy_rate}%</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Công suất</div>
                  </div>
                )}
                {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </div>
            </div>

            {/* Expanded room list */}
            {isExpanded && (
              <div style={{ padding: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--section-border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loại</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tên phòng</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Giường</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Diện tích</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sức chứa</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Giá/đêm</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kho</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.id} style={{ borderBottom: '1px solid var(--section-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {room.room_type}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{room.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{room.view_type}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{room.bed_type}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{room.area_sqm}m²</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{room.max_adults}+{room.max_children}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>€{room.base_price_per_night}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ color: room.available_count > 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {room.available_count}/{room.total_inventory}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span style={{
                            background: room.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: room.is_active ? 'var(--success)' : 'var(--danger)',
                            padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem'
                          }}>
                            {room.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

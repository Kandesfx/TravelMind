import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { User, Mail, KeyRound, CheckSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../App';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        username,
        email,
        full_name: fullName,
        password,
        confirm_password: confirmPassword
      });
      await checkAuth();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký tài khoản lỗi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '1rem'
    }} className="animate-fade-in">
      <GlassCard style={{ width: '100%', maxWidth: '550px', padding: '2rem' }} hover={false}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Sparkles size={22} color="white" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800 }}>Đăng Ký Tài Khoản</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tạo tài khoản để đặt phòng và lưu lịch sử</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '0.6rem',
            color: '#f87171',
            fontSize: '0.8rem',
            marginBottom: '1rem'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--label-color)' }}>Tên đăng nhập</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="glass-input" required />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--label-color)' }}>Họ và tên</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass-input" required />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--label-color)' }}>Địa chỉ Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--label-color)' }}>Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input" required />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--label-color)' }}>Nhập lại mật khẩu</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="glass-input" required />
            </div>
          </div>

          <button type="submit" className="glass-button" style={{ justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập</Link>
        </div>
      </GlassCard>
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import ThemeProvider from './components/ThemeProvider';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

// Central Axios configuration for HTTPOnly Session cookies
axios.defaults.withCredentials = true;

// Create Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Import public pages
import LandingPage from './pages/public/LandingPage';
import HotelExplorer from './pages/public/HotelExplorer';
import HotelListPage from './pages/public/HotelListPage';
import HotelDetailPage from './pages/public/HotelDetailPage';
import ComboBuilder from './pages/public/ComboBuilder';
import TravelerQuiz from './pages/public/TravelerQuiz';
import BookingFlow from './pages/public/BookingFlow';
import TravelInsights from './pages/public/TravelInsights';
import EventPage from './pages/public/EventPage';
import UserProfile from './pages/public/UserProfile';

// Import admin pages
import DashboardKPI from './pages/admin/DashboardKPI';
import ComboManager from './pages/admin/ComboManager';
import PromotionManager from './pages/admin/PromotionManager';
import EventManager from './pages/admin/EventManager';
import BannerManager from './pages/admin/BannerManager';
import VoucherManager from './pages/admin/VoucherManager';
import PerformanceReports from './pages/admin/PerformanceReports';
import CustomerAnalysis from './pages/admin/CustomerAnalysis';
import RulesLab from './pages/admin/RulesLab';
import DataManager from './pages/admin/DataManager';
import AIContentStudio from './pages/admin/AIContentStudio';
import AIImageStudio from './pages/admin/AIImageStudio';
import AIVideoStudio from './pages/admin/AIVideoStudio';
import MediaLibrary from './pages/admin/MediaLibrary';
import TemplateManager from './pages/admin/TemplateManager';
import ContentHistory from './pages/admin/ContentHistory';
import ApiKeySettings from './pages/admin/ApiKeySettings';
import AiUsageDashboard from './pages/admin/AiUsageDashboard';
import HotelManager from './pages/admin/HotelManager';
import BookingManager from './pages/admin/BookingManager';
import AIInsights from './pages/admin/AIInsights';

// Import auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Import Shared Layout components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Protected Route wrappers
const RequireAuth = ({ children, role }) => {
  const { auth, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Đang tải...</div>;
  }
  
  if (!auth.logged_in) {
    return <Navigate to="/login" replace />;
  }
  
  if (role && auth.user.role !== role) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default function App() {
  const [auth, setAuth] = useState({ logged_in: false, user: null });
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.logged_in) {
        setAuth({ logged_in: true, user: res.data.user });
      } else {
        setAuth({ logged_in: false, user: null });
      }
    } catch (e) {
      setAuth({ logged_in: false, user: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password, rememberMe) => {
    const res = await axios.post('/api/auth/login', { username, password, remember_me: rememberMe });
    await checkAuth();
    return res.data;
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setAuth({ logged_in: false, user: null });
  };

  return (
    <ThemeProvider>
    <AuthContext.Provider value={{ auth, loading, login, logout, checkAuth }}>
      <BrowserRouter>
        <Routes>
          {/* Public Pages with Navbar Layout */}
          <Route path="/" element={<Layout><LandingPage /></Layout>} />
          <Route path="/hotels" element={<Layout><HotelListPage /></Layout>} />
          <Route path="/hotels/:id" element={<Layout><HotelDetailPage /></Layout>} />
          <Route path="/explorer" element={<Layout><HotelExplorer /></Layout>} />
          <Route path="/combo-builder" element={<Layout><ComboBuilder /></Layout>} />
          <Route path="/quiz" element={<Layout><TravelerQuiz /></Layout>} />
          <Route path="/booking" element={<RequireAuth><Layout><BookingFlow /></Layout></RequireAuth>} />
          <Route path="/insights" element={<Layout><TravelInsights /></Layout>} />
          <Route path="/events/:slug" element={<Layout><EventPage /></Layout>} />
          <Route path="/profile" element={<RequireAuth><Layout><UserProfile /></Layout></RequireAuth>} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Protected Pages with Sidebar Layout */}
          <Route path="/admin" element={
            <RequireAuth role="admin">
              <AdminLayout><DashboardKPI /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/combos" element={
            <RequireAuth role="admin">
              <AdminLayout><ComboManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/promotions" element={
            <RequireAuth role="admin">
              <AdminLayout><PromotionManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/events" element={
            <RequireAuth role="admin">
              <AdminLayout><EventManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/banners" element={
            <RequireAuth role="admin">
              <AdminLayout><BannerManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/vouchers" element={
            <RequireAuth role="admin">
              <AdminLayout><VoucherManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/reports" element={
            <RequireAuth role="admin">
              <AdminLayout><PerformanceReports /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/customers" element={
            <RequireAuth role="admin">
              <AdminLayout><CustomerAnalysis /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/rules" element={
            <RequireAuth role="admin">
              <AdminLayout><RulesLab /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/data" element={
            <RequireAuth role="admin">
              <AdminLayout><DataManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai/content" element={
            <RequireAuth role="admin">
              <AdminLayout><AIContentStudio /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai/images" element={
            <RequireAuth role="admin">
              <AdminLayout><AIImageStudio /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai/videos" element={
            <RequireAuth role="admin">
              <AdminLayout><AIVideoStudio /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai/media" element={
            <RequireAuth role="admin">
              <AdminLayout><MediaLibrary /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai/templates" element={
            <RequireAuth role="admin">
              <AdminLayout><TemplateManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai/history" element={
            <RequireAuth role="admin">
              <AdminLayout><ContentHistory /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/settings/api-keys" element={
            <RequireAuth role="admin">
              <AdminLayout><ApiKeySettings /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/settings/ai-usage" element={
            <RequireAuth role="admin">
              <AdminLayout><AiUsageDashboard /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/hotels" element={
            <RequireAuth role="admin">
              <AdminLayout><HotelManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/bookings" element={
            <RequireAuth role="admin">
              <AdminLayout><BookingManager /></AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/ai-insights" element={
            <RequireAuth role="admin">
              <AdminLayout><AIInsights /></AdminLayout>
            </RequireAuth>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
    </ThemeProvider>
  );
}

// Layout component for public pages
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 1rem 4rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </>
  );
}

// Layout component for admin pages
function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '70px',
          borderBottom: '1px solid var(--navbar-border)',
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0 2rem',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quản trị hệ thống</span>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            color: 'white'
          }}>A</div>
        </header>
        <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

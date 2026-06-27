import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Book from './pages/Book';
import MyBookings from './pages/MyBookings';
import OpenPlay from './pages/OpenPlay';
import Profile from './pages/Profile';
import PopUpStore from './pages/PopUpStore';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminSlots from './pages/admin/AdminSlots';
import AdminOpenPlay from './pages/admin/AdminOpenPlay';
import AdminUsers from './pages/admin/AdminUsers';

// Route Guards
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding enforcement
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Admin enforcement
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AnonymousRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030712]">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Routes>
          {/* Public / Anonymous Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AnonymousRoute><Login /></AnonymousRoute>} />
          <Route path="/popup" element={<PopUpStore />} />
          
          {/* Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Player Protected Routes */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="/book" element={
            <ProtectedRoute>
              <Book />
            </ProtectedRoute>
          } />
          
          <Route path="/bookings" element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          } />
          
          <Route path="/openplay" element={
            <ProtectedRoute>
              <OpenPlay />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/bookings" element={
            <ProtectedRoute adminOnly>
              <AdminBookings />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/slots" element={
            <ProtectedRoute adminOnly>
              <AdminSlots />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/openplay" element={
            <ProtectedRoute adminOnly>
              <AdminOpenPlay />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          } />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
}

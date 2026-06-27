import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Bell, Menu, X, LogOut, Shield, User, Calendar, Trophy, HelpCircle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    }

    loadNotifications();

    // Set up a simple 30s poll for mock/simulation or database updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Active styles helper
  const linkClass = (path) => 
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
    }`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Logo & Brand */}
      <Link to={user ? "/home" : "/"} className="flex items-center gap-3 group">
        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-1 border border-white/10 group-hover:border-emerald-500/30 transition-all duration-300">
          <img src={logo} alt="PaddleHub Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-display font-extrabold text-lg leading-tight tracking-wider text-white group-hover:text-emerald-400 transition-colors">
            HQ <span className="text-emerald-400 group-hover:text-white">PICKLEBALL</span>
          </span>
          <span className="text-[9px] tracking-widest text-slate-500 uppercase font-medium">Cebu</span>
        </div>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-2">
        {user ? (
          profile?.role === 'admin' ? (
            <>
              <Link to="/admin" className={linkClass('/admin')}>
                <div className="flex items-center gap-1.5">
                  <Shield size={15} /> Dashboard
                </div>
              </Link>
              <Link to="/admin/bookings" className={linkClass('/admin/bookings')}>Bookings</Link>
              <Link to="/admin/slots" className={linkClass('/admin/slots')}>Blocks</Link>
              <Link to="/admin/openplay" className={linkClass('/admin/openplay')}>Open Play</Link>
              <Link to="/admin/users" className={linkClass('/admin/users')}>Users</Link>
              <Link to="/popup" className={linkClass('/popup')}>Pop-up Store</Link>
            </>
          ) : (
            <>
              <Link to="/home" className={linkClass('/home')}>Home</Link>
              <Link to="/book" className={linkClass('/book')}>
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} /> Book Court
                </div>
              </Link>
              <Link to="/bookings" className={linkClass('/bookings')}>My Bookings</Link>
              <Link to="/openplay" className={linkClass('/openplay')}>
                <div className="flex items-center gap-1.5">
                  <Trophy size={15} /> Open Play
                </div>
              </Link>
              <Link to="/profile" className={linkClass('/profile')}>
                <div className="flex items-center gap-1.5">
                  <User size={15} /> Profile
                </div>
              </Link>
              <Link to="/popup" className={linkClass('/popup')}>Pop-up Store</Link>
            </>
          )
        ) : (
          <Link to="/popup" className={linkClass('/popup')}>Pop-up Store</Link>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) markAllAsRead();
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
                aria-label="View notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border border-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-xl glass border border-white/10 shadow-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            n.read 
                              ? 'bg-transparent border-transparent text-slate-400' 
                              : 'bg-emerald-500/5 border-emerald-500/10 text-slate-200'
                          }`}
                        >
                          <p className="font-medium text-xs text-white">{n.title}</p>
                          <p className="text-[11px] leading-relaxed mt-0.5">{n.message}</p>
                          <span className="text-[9px] text-slate-500 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] glow-emerald"
          >
            Sign In
          </Link>
        )}

        {/* Mobile Menu Button */}
        {user && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {user && mobileMenuOpen && (
        <div className="absolute top-[61px] left-0 right-0 w-full glass border-b border-white/10 flex flex-col p-4 gap-2 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {profile?.role === 'admin' ? (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Manage Bookings
              </Link>
              <Link
                to="/admin/slots"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Manage Slots
              </Link>
              <Link
                to="/admin/openplay"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Manage Open Play
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Manage Users
              </Link>
              <Link
                to="/popup"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Pop-up Store Space
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Player Dashboard
              </Link>
              <Link
                to="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Book Court
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                My Bookings
              </Link>
              <Link
                to="/openplay"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Open Play Feed
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                My Profile
              </Link>
              <Link
                to="/popup"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Pop-up Store Space
              </Link>
            </>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-2 p-3 mt-2 rounded-lg text-left text-sm font-medium text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}

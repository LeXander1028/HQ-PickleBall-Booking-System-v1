import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { isBookingUpcoming } from '../utils/bookingLifecycle';
import { getUserBookingStatusLabel, getUserBookingStatusStyles } from '../utils/bookingStatus';
import { Calendar, Trophy, HelpCircle, Activity, Compass, ArrowRight } from 'lucide-react';
import { VENUE_INFO } from '../lib/constants';

export default function Home() {
  const { user, profile } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBookings: 0, totalHours: 0 });
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadDashboardData() {
      try {
        // Fetch all bookings for this user
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          // Calculate stats
          const confirmedOrCompleted = data.filter(b => b.status === 'confirmed' || b.status === 'completed');
          const totalHours = confirmedOrCompleted.reduce((acc, curr) => acc + curr.duration_hours, 0);
          
          setStats({
            totalBookings: confirmedOrCompleted.length,
            totalHours
          });

          // Filter upcoming bookings
          const upcoming = data.filter(b => b.status !== 'cancelled' && isBookingUpcoming(b));
          
          // Sort by date then start hour
          upcoming.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.start_hour - b.start_hour;
          });

          setUpcomingBookings(upcoming);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour >= 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="flex flex-col gap-8 py-8 px-4 md:px-8 text-left max-w-6xl mx-auto w-full">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Welcome back, {profile?.name || 'Player'}!
          </h2>
          <p className="text-slate-400 text-sm mt-1">Ready for some pickleball action today?</p>
        </div>
        <Link
          to="/book"
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-1.5"
        >
          <Calendar size={16} /> Book a Court
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total Sessions</p>
            <p className="font-display font-bold text-white text-2xl">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="glass border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Hours Played</p>
            <p className="font-display font-bold text-white text-2xl">{stats.totalHours} hrs</p>
          </div>
        </div>

        <div className="glass border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Venue Rating</p>
            <p className="font-display font-bold text-white text-2xl">Premium 24/7</p>
          </div>
        </div>
      </div>

      {/* Quick shortcuts and Upcoming bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming bookings (2/3 width on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-display font-extrabold text-xl text-white">Upcoming Bookings</h3>
          
          {loading ? (
            <div className="glass border border-white/5 rounded-2xl p-8 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="glass border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
              <Calendar size={36} className="text-slate-600" />
              <p className="text-sm text-slate-400">You don't have any upcoming reservations.</p>
              <Link to="/book" className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                Book your first court <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingBookings.slice(0, 3).map(b => (
                <div key={b.id} className="glass border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] tracking-wider uppercase text-slate-500 font-bold">Court Location</span>
                    <h4 className="font-display font-bold text-white text-base">Court {b.court_id.replace('court-', '')}</h4>
                    <p className="text-xs text-slate-400">
                      {b.date} · {formatHour(b.start_hour)} for {b.duration_hours} hr{b.duration_hours > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getUserBookingStatusStyles(b.status, b.payment_reference)}`}>
                      {getUserBookingStatusLabel(b.status, b.payment_reference)}
                    </span>
                    <Link to="/bookings" className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300 hover:text-white text-xs font-medium">
                      Details
                    </Link>
                  </div>
                </div>
              ))}
              {upcomingBookings.length > 3 && (
                <Link to="/bookings" className="text-xs text-slate-400 hover:text-white underline text-right">
                  View all upcoming sessions ({upcomingBookings.length})
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Action Panel / Guide */}
        <div className="flex flex-col gap-4">
          <h3 className="font-display font-extrabold text-xl text-white">Resources</h3>
          
          <div className="flex flex-col gap-3">
            <Link
              to="/openplay"
              className="glass border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">Join Open Play</h4>
                  <p className="text-xs text-slate-500 mt-0.5">RSVP to community play sessions</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </Link>

            <button
              onClick={() => setShowGuide(true)}
              className="w-full text-left glass border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">How to Book Guide</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Learn about payment verification</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass border border-white/15 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto relative text-left">
            <h3 className="font-display font-extrabold text-xl text-white mb-4">
              Booking Guide & Verification
            </h3>
            
            <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-semibold text-sm text-emerald-400 mb-1">1. Hold Slot</h4>
                <p>Choose date, start hour and duration. We block the assigned court for 30 minutes while you complete the offline payment transfer.</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-emerald-400 mb-1">2. Offline Payment</h4>
                <p>Transfer the total price to one of our e-wallet platforms (GCash or GoTyme Bank) displayed on checkout. Save your transaction receipt!</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-emerald-400 mb-1">3. Enter Reference Code</h4>
                <p>Paste the transaction reference number and sender name in the Booking Wizard. If you exit early, you can update this from "My Bookings" before the 30-minute hold expires.</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-emerald-400 mb-1">4. Admin Verification</h4>
                <p>Our venue operators will audit the reference code on our admin dashboard. Once verified, you will receive a notification and your status will mark "Confirmed"!</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

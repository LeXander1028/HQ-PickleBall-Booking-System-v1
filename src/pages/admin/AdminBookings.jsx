import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getAdminBookingCategory, BOOKING_STATUSES, ADMIN_CATEGORY_META } from '../../utils/bookingStatus';
import { buildFullNotes } from '../../utils/parseBookingNotes';
import AdminBookingCardDetails from '../../components/admin/AdminBookingCardDetails';
import { Calendar, User, Phone, Check, ShieldAlert, Plus, X, Search } from 'lucide-react';
import { VENUE_INFO } from '../../lib/constants';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('paid_verify'); // default filter
  
  // Search bar
  const [searchQuery, setSearchQuery] = useState('');

  // Admin reserve modal states
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [resCourt, setResCourt] = useState('court-1');
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [resStart, setResStart] = useState(8);
  const [resDuration, setResDuration] = useState(2);
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resCollected, setResCollected] = useState(false);
  const [reserveError, setReserveError] = useState(null);

  async function loadBookings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
        .order('start_hour', { ascending: true });

      if (!error && data) {
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to load bookings list:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const handleVerify = async (id) => {
    try {
      // Get booking row to retrieve owner user_id
      const b = bookings.find(item => item.id === id);
      if (!b) return;

      const { error } = await supabase
        .from('bookings')
        .update({ status: BOOKING_STATUSES.CONFIRMED })
        .eq('id', id);

      if (error) throw error;

      // Notify player
      if (b.user_id) {
        await supabase.from('notifications').insert({
          user_id: b.user_id,
          title: "Booking Confirmed!",
          message: `Your GCash/GoTyme payment reference for Court ${b.court_id.replace('court-', '')} on ${b.date} has been confirmed. Enjoy your game!`,
          read: false
        });
      }

      setBookings(prev => prev.map(item => item.id === id ? { ...item, status: BOOKING_STATUSES.CONFIRMED } : item));
    } catch (err) {
      alert("Failed to confirm booking: " + err.message);
    }
  };

  const handleCollectCash = async (id) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_collected: true })
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.map(item => item.id === id ? { ...item, payment_collected: true } : item));
    } catch (err) {
      alert("Failed to collect payment: " + err.message);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt("Are you sure you want to cancel this booking?\n\nReason for rejection (optional):");
    if (reason === null) return;

    try {
      const b = bookings.find(item => item.id === id);
      if (!b) return;

      const updateData = { status: BOOKING_STATUSES.CANCELLED };
      if (reason.trim() !== "") {
        updateData.rejection_reason = reason.trim();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Notify player
      if (b.user_id) {
        let msg = `Your court booking on ${b.date} has been cancelled by the administrator.`;
        if (reason.trim()) msg += `\nReason: ${reason.trim()}`;

        await supabase.from('notifications').insert({
          user_id: b.user_id,
          title: "Booking Cancelled",
          message: msg,
          read: false
        });
      }

      setBookings(prev => prev.map(item => item.id === id ? { ...item, ...updateData } : item));
    } catch (err) {
      alert("Failed to cancel booking: " + err.message);
    }
  };

  // Submit Admin desk reserve
  const handleAdminReserve = async (e) => {
    e.preventDefault();
    setReserveError(null);

    if (!resName.trim() || !resPhone.trim()) {
      setReserveError("Booker name and phone are required.");
      return;
    }

    if (resStart + resDuration > 24) {
      setReserveError("Booking cannot exceed midnight.");
      return;
    }

    try {
      // Calculate price
      let total = 0;
      for (let i = 0; i < resDuration; i++) {
        const hr = (resStart + i) % 24;
        if (hr === 0 || (hr >= 1 && hr <= 6)) total += 500;
        else if (hr >= 7 && hr <= 11) total += 400;
        else if (hr >= 12 && hr <= 16) total += 450;
        else total += 500;
      }

      // Check collision
      const overlaps = bookings.some(b => 
        b.court_id === resCourt &&
        b.date === resDate &&
        b.status !== 'cancelled' &&
        !( (b.start_hour + b.duration_hours <= resStart) || (b.start_hour >= resStart + resDuration) )
      );

      if (overlaps) {
        setReserveError("Collision Error: Court is already booked during this time range.");
        return;
      }

      const notes = buildFullNotes({
        bookerName: resName,
        userNotes: "Staff Desk Reservation"
      });

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: null, // admin desk
          court_id: resCourt,
          date: resDate,
          start_hour: resStart,
          duration_hours: resDuration,
          total_price: total,
          status: 'confirmed', // immediately confirmed
          notes,
          contact_phone: resPhone,
          payment_reference: 'ADMIN',
          payment_collected: resCollected
        });

      if (error) throw error;

      setShowReserveModal(false);
      
      // Reset values
      setResName('');
      setResPhone('');
      setResCollected(false);
      
      // Reload
      await loadBookings();
    } catch (err) {
      console.error(err);
      setReserveError(err.message || "Failed to save admin reservation.");
    }
  };

  // Filter & Search logic
  const filteredBookings = bookings.filter(b => {
    const category = getAdminBookingCategory(b);
    const matchesFilter = activeFilter === 'all' || category === activeFilter;
    
    const term = searchQuery.toLowerCase();
    const matchesSearch = !term || 
      b.contact_phone?.toLowerCase().includes(term) ||
      b.notes?.toLowerCase().includes(term) ||
      b.payment_reference?.toLowerCase().includes(term) ||
      b.payment_sender_name?.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8 text-left max-w-6xl mx-auto w-full">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Manage Court Bookings</h2>
          <p className="text-slate-400 text-sm">Verify references codes, collect cash collections, or enter direct reservations.</p>
        </div>

        <button
          onClick={() => setShowReserveModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-1 cursor-pointer"
        >
          <Plus size={15} /> Desk Reservation
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by phone, sender name, or reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Filter categories tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.keys(ADMIN_CATEGORY_META).map(key => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFilter === key
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              {ADMIN_CATEGORY_META[key].label}
            </button>
          ))}
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white/10 text-white border border-white/10'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            All Bookings
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl p-12 text-center text-slate-500">
          No bookings match the current filter and search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map(b => (
            <AdminBookingCardDetails
              key={b.id}
              booking={b}
              onVerify={handleVerify}
              onCancel={handleCancel}
              onCollectCash={handleCollectCash}
            />
          ))}
        </div>
      )}

      {/* ADMIN RESERVE MODAL */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleAdminReserve}
            className="glass border border-white/15 rounded-2xl w-full max-w-md p-6 relative text-left flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setShowReserveModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="font-display font-bold text-white text-lg flex items-center gap-1.5">
              Desk Reservation
            </h3>

            {reserveError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {reserveError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Select Court</label>
              <select
                value={resCourt}
                onChange={e => setResCourt(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white"
              >
                {VENUE_INFO.courts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Date</label>
              <input
                type="date"
                required
                value={resDate}
                onChange={e => setResDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Start Hour</label>
                <select
                  value={resStart}
                  onChange={e => setResStart(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h}>{h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Duration (Hours)</label>
                <select
                  value={resDuration}
                  onChange={e => setResDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(d => (
                    <option key={d} value={d}>{d} Hr{d > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Booker Name</label>
              <input
                type="text"
                required
                value={resName}
                onChange={e => setResName(e.target.value)}
                placeholder="Name"
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Contact Phone</label>
              <input
                type="tel"
                required
                value={resPhone}
                onChange={e => setResPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-white/5 mt-2">
              <div>
                <span className="text-xs text-white font-semibold block">Collected Cash Payment</span>
                <span className="text-[10px] text-slate-500">Enable if user has paid at front desk</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resCollected}
                  onChange={e => setResCollected(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950" />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all mt-4 cursor-pointer"
            >
              Confirm Direct Booking
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

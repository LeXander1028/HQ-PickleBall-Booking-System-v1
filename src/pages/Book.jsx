import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAvailability } from '../hooks/useAvailability';
import { supabase } from '../lib/supabase';
import { calculateBookingBreakdown } from '../lib/pricing';
import { buildFullNotes } from '../utils/parseBookingNotes';
import { assignCourtsForBooking } from '../utils/userBookingCourts';
import UserBookingTimeGrid from '../components/UserBookingTimeGrid';
import BookingPriceBreakdown from '../components/admin/BookingPriceBreakdown';
import { Calendar, User, Phone, ShoppingCart, CreditCard, ChevronRight, ChevronLeft, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

const DRAFT_KEY = 'paddlehub_booking_draft';

export default function Book() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Wizard Step
  const [step, setStep] = useState(1);

  // Form States
  const [bookerName, setBookerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [courtCount, setCourtCount] = useState(1);
  const [playerCount, setPlayerCount] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [duration, setDuration] = useState(1);
  const [selectedHour, setSelectedHour] = useState(null);

  const [paddles, setPaddles] = useState(0);
  const [balls, setBalls] = useState(0);
  const [trainerOn, setTrainerOn] = useState(false);
  const [trainerHours, setTrainerHours] = useState(1);
  const [trainerHeads, setTrainerHeads] = useState(1);
  const [userNotes, setUserNotes] = useState('');

  // Payment Selection
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [senderPlatform, setSenderPlatform] = useState('');

  // Hold State (returned from DB create_booking_hold_auto)
  const [createdBookingIds, setCreatedBookingIds] = useState([]);
  const [assignedCourts, setAssignedCourts] = useState([]);

  // Availability Hook
  const { bookings, blockedSlots, loading: availabilityLoading, refresh: refreshAvailability } = useAvailability(date);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downgradeDialog, setDowngradeDialog] = useState(null); // { hour, freeCount }

  // Load draft & user profile defaults
  useEffect(() => {
    if (profile) {
      setBookerName(profile.name || '');
      setContactPhone(profile.phone || '');
    }

    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.step) setStep(parsed.step);
        if (parsed.bookerName) setBookerName(parsed.bookerName);
        if (parsed.contactPhone) setContactPhone(parsed.contactPhone);
        if (parsed.courtCount) setCourtCount(parsed.courtCount);
        if (parsed.playerCount) setPlayerCount(parsed.playerCount);
        if (parsed.date) setDate(parsed.date);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.selectedHour !== undefined) setSelectedHour(parsed.selectedHour);
        if (parsed.paddles !== undefined) setPaddles(parsed.paddles);
        if (parsed.balls !== undefined) setBalls(parsed.balls);
        if (parsed.trainerOn !== undefined) setTrainerOn(parsed.trainerOn);
        if (parsed.trainerHours !== undefined) setTrainerHours(parsed.trainerHours);
        if (parsed.trainerHeads !== undefined) setTrainerHeads(parsed.trainerHeads);
        if (parsed.userNotes !== undefined) setUserNotes(parsed.userNotes);
        if (parsed.createdBookingIds) setCreatedBookingIds(parsed.createdBookingIds);
        if (parsed.assignedCourts) setAssignedCourts(parsed.assignedCourts);
      } catch (e) {
        console.error("Failed to parse draft draft", e);
      }
    }
  }, [profile]);

  // Load active payment methods
  useEffect(() => {
    async function loadPaymentMethods() {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);
      if (!error && data) {
        setPaymentMethods(data);
        if (data.length > 0) setSelectedMethodId(data[0].id);
      }
    }
    loadPaymentMethods();
  }, []);

  // Save draft state
  const saveDraft = (nextStep = step) => {
    const draft = {
      step: nextStep,
      bookerName,
      contactPhone,
      courtCount,
      date,
      duration,
      selectedHour,
      paddles,
      balls,
      trainerOn,
      trainerHours,
      trainerHeads,
      userNotes,
      createdBookingIds,
      assignedCourts,
      playerCount
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  // Navigations
  const nextStep = () => {
    const target = step + 1;
    setStep(target);
    saveDraft(target);
  };

  const prevStep = () => {
    const target = step - 1;
    setStep(target);
    saveDraft(target);
  };

  const handleSelectHour = (hour, availability) => {
    if (availability === 'partial') {
      // Find how many courts are actually free
      const free = assignCourtsForBooking(hour, duration, courtCount, bookings, blockedSlots);
      setDowngradeDialog({ hour, freeCount: free.length });
    } else if (availability === 'full') {
      setSelectedHour(hour);
      nextStep();
    }
  };

  const confirmDowngrade = () => {
    if (downgradeDialog) {
      setCourtCount(downgradeDialog.freeCount);
      setSelectedHour(downgradeDialog.hour);
      setDowngradeDialog(null);
      setStep(3); // Go to step 3 (Extras) since time is locked
      saveDraft(3);
    }
  };

  // Step validation
  const validateStep1 = () => {
    if (!bookerName.trim()) return "Full Name is required";
    if (!contactPhone.trim()) return "Contact Phone is required";
    if (!date) return "Date is required";
    const today = new Date().toISOString().split('T')[0];
    if (date < today) return "Cannot book a past date";
    if (playerCount > courtCount * 4) {
      return `Invalid Player Count: Each court accommodates a maximum of 4 players (limit: ${courtCount * 4} players for ${courtCount} court${courtCount > 1 ? 's' : ''}).`;
    }
    return null;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    nextStep();
  };

  // Step 4 checkout trigger (create hold RPC)
  const handleCheckoutSubmit = async () => {
    setError(null);
    setLoading(true);

    const fullNotes = buildFullNotes({
      bookerName,
      paddles,
      balls,
      trainerHours: trainerOn ? trainerHours : 0,
      trainerHeads: trainerOn ? trainerHeads : 0,
      userNotes
    });

    // Resolve assigned court list to pass to RPC (optional but good practice)
    const assigned = assignCourtsForBooking(selectedHour, duration, courtCount, bookings, blockedSlots);
    const assignedIds = assigned.map(c => c.id);

    try {
      const params = {
        p_date: date,
        p_start_hour: selectedHour,
        p_duration_hours: duration,
        p_notes: fullNotes,
        p_paddles: paddles,
        p_balls: balls,
        p_court_count: courtCount,
        p_trainer_hours: trainerOn ? trainerHours : 0,
        p_trainer_heads: trainerOn ? trainerHeads : 0,
        p_contact_phone: contactPhone,
        p_court_ids: assignedIds
      };

      const { data, error: rpcError } = await supabase.rpc('create_booking_hold_auto', params);

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        const bookingIds = data.map(r => r.booking_id);
        const courtNames = data.map(r => r.court_id);
        
        setCreatedBookingIds(bookingIds);
        setAssignedCourts(courtNames);
        
        const target = 5;
        setStep(target);
        
        // Save hold references in draft
        const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
          ...draft,
          step: target,
          createdBookingIds: bookingIds,
          assignedCourts: courtNames
        }));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to reserve hold slot. It might have been booked just now.");
    } finally {
      setLoading(false);
    }
  };

  // Step 5 payment trigger (saves payment details)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (createdBookingIds.length === 0) {
      setError("No hold session exists. Please return and recreate hold.");
      return;
    }
    if (!senderName.trim() || !referenceNo.trim()) {
      setError("Please complete all payment fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update all bookings in this hold checkout
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_method_id: selectedMethodId,
          payment_sender_name: senderName.trim(),
          payment_reference: referenceNo.trim(),
          payment_sender_platform: senderPlatform.trim() || null
        })
        .in('id', createdBookingIds);

      if (updateError) throw updateError;

      // Add a client success notification row
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: "Payment Received",
        message: `Your payment reference ${referenceNo} for Court ${assignedCourts.join(', ')} has been received and is pending verification.`,
        read: false
      });

      // Clear draft
      sessionStorage.removeItem(DRAFT_KEY);
      
      // Navigate to My Bookings
      navigate('/bookings', { state: { successMsg: "Your court hold is reserved! Staff will verify your payment reference soon." } });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update payment references.");
    } finally {
      setLoading(false);
    }
  };

  // Pricing calculations
  const singleCourtCost = selectedHour !== null ? calculateBookingBreakdown({
    startHour: selectedHour,
    durationHours: duration,
    courtCount: 1,
    dateStr: date,
    playerCount
  }).singleCourtCost : 0;

  const priceBreakdown = calculateBookingBreakdown({
    startHour: selectedHour || 0,
    durationHours: duration,
    courtCount,
    paddles,
    balls,
    trainerHours: trainerOn ? trainerHours : 0,
    trainerHeads: trainerOn ? trainerHeads : 0,
    dateStr: date,
    playerCount
  });

  const activeMethod = paymentMethods.find(m => m.id === selectedMethodId);

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8 max-w-4xl mx-auto w-full text-left">
      {/* Wizard Header Progress */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Book a Court</h2>
        <p className="text-slate-400 text-sm">Follow the steps to secure your court booking at HQ Pickleball Cebu.</p>
        
        {/* Progress Bar */}
        <div className="flex items-center w-full gap-2 mt-4 text-xs font-semibold text-slate-500 overflow-x-auto pb-2 no-scrollbar">
          <span className={step === 1 ? "text-emerald-400" : step > 1 ? "text-white" : ""}>1. Details</span>
          <ChevronRight size={14} />
          <span className={step === 2 ? "text-emerald-400" : step > 2 ? "text-white" : ""}>2. Schedule</span>
          <ChevronRight size={14} />
          <span className={step === 3 ? "text-emerald-400" : step > 3 ? "text-white" : ""}>3. Add-ons</span>
          <ChevronRight size={14} />
          <span className={step === 4 ? "text-emerald-400" : step > 4 ? "text-white" : ""}>4. Review</span>
          <ChevronRight size={14} />
          <span className={step === 5 ? "text-emerald-400" : ""}>5. Payment</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-start">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
          <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
            <User size={18} className="text-emerald-400" /> Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="bookerName">Booked Under (Full Name)</label>
              <input
                id="bookerName"
                type="text"
                required
                value={bookerName}
                onChange={e => setBookerName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="contactPhone">Contact Phone Number</label>
              <input
                id="contactPhone"
                type="tel"
                required
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+63 945 378 2090"
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="courtCount">How many courts? (1-6)</label>
              <select
                id="courtCount"
                value={courtCount}
                onChange={e => setCourtCount(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white focus:outline-none"
              >
                <option value={1}>1 Court</option>
                <option value={2}>2 Courts</option>
                <option value={3}>3 Courts</option>
                <option value={4}>4 Courts</option>
                <option value={5}>5 Courts</option>
                <option value={6}>6 Courts (Full Venue)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="playerCount">Number of Players (pax)</label>
              <input
                id="playerCount"
                type="number"
                min={1}
                value={playerCount}
                onChange={e => setPlayerCount(parseInt(e.target.value, 10) || 1)}
                className={`w-full bg-slate-950 border rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-all ${
                  playerCount > courtCount * 4
                    ? 'border-rose-500 focus:border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : 'border-white/5 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold" htmlFor="date">Booking Date</label>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={e => { setDate(e.target.value); setSelectedHour(null); }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {playerCount > courtCount * 4 && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-start mt-1 animate-in slide-in-from-top-2 duration-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>
                <strong>Invalid Action:</strong> Each court accommodates a maximum of 4 players. For <strong>{courtCount} court{courtCount > 1 ? 's' : ''}</strong>, the capacity limit is <strong>{courtCount * 4} players</strong>.
              </span>
            </div>
          )}

          {/* Court visual layout guide */}
          <div className="flex flex-col gap-3.5 border-t border-white/5 pt-4 mt-1 text-left">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-xs text-white font-bold uppercase tracking-wider">Court Layout & Capacity</h4>
              <p className="text-[10px] text-slate-500">Teal floor, gray play area, white lines. Each court fits <strong className="text-white">max 4 players</strong> · Standard rate: <strong className="text-indigo-400">₱600 / hr</strong></p>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { name: "Court 1", netColor: "red" },
                { name: "Court 2", netColor: "blue" },
                { name: "Court 3", netColor: "red" },
                { name: "Court 4", netColor: "blue" },
                { name: "Court 5", netColor: "red" },
                { name: "Court 6", netColor: "blue" }
              ].map((c, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className="court-container w-full shadow-lg">
                    <div className="court-play-area">
                      <div className="court-lines-inner" />
                      <div className="court-center-line" />
                      <div className={`court-net-line ${c.netColor === 'red' ? 'net-red' : 'net-blue'}`} />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                    {c.name} ({c.netColor === 'red' ? 'Red' : 'Blue'})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto self-end px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_12px_rgba(162,252,42,0.2)] flex items-center justify-center gap-1.5 cursor-pointer mt-4 glow-emerald"
          >
            Choose Slot <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* STEP 2: Time Selection */}
      {step === 2 && (
        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" /> Select Schedule Slot
            </h3>
            <button
              onClick={prevStep}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>

          {/* Duration Slider */}
          <div className="flex flex-col gap-1.5 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
            <label className="text-xs text-slate-400 font-semibold flex justify-between">
              <span>Duration of rental</span>
              <strong className="text-emerald-400">{duration} hour{duration > 1 ? 's' : ''}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={duration}
              onChange={e => { setDuration(parseInt(e.target.value, 10)); setSelectedHour(null); }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 mt-2"
            />
          </div>

          {availabilityLoading ? (
            <div className="py-12 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <UserBookingTimeGrid
              date={date}
              duration={duration}
              courtCount={courtCount}
              bookings={bookings}
              blockedSlots={blockedSlots}
              selectedHour={selectedHour}
              onSelectHour={handleSelectHour}
            />
          )}
        </div>
      )}

      {/* STEP 3: Add-ons / Extras */}
      {step === 3 && (
        <form onSubmit={e => { e.preventDefault(); nextStep(); }} className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-400" /> Customize Equipment & Coaching
            </h3>
            <button
              type="button"
              onClick={prevStep}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>

          {/* Paddle counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-xl">
              <div>
                <h4 className="font-semibold text-sm text-white">Paddle Rental</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">₱100 per paddle</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaddles(Math.max(0, paddles - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-slate-300 hover:text-white"
                >
                  -
                </button>
                <span className="text-sm font-semibold text-white w-4 text-center">{paddles}</span>
                <button
                  type="button"
                  onClick={() => setPaddles(paddles + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-slate-300 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Ball counters */}
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-xl">
              <div>
                <h4 className="font-semibold text-sm text-white">Pro Pickleballs</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">₱100 per ball</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBalls(Math.max(0, balls - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-slate-300 hover:text-white"
                >
                  -
                </button>
                <span className="text-sm font-semibold text-white w-4 text-center">{balls}</span>
                <button
                  type="button"
                  onClick={() => setBalls(balls + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-slate-300 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Trainer options */}
          <div className="border border-white/5 rounded-xl p-4 bg-slate-950/40 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-sm text-white">Hire Professional Trainer</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">₱500/hr per head (max 30 players)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={trainerOn}
                  onChange={e => setTrainerOn(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950" />
              </label>
            </div>

            {trainerOn && (
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Training Hours</label>
                  <select
                    value={trainerHours}
                    onChange={e => setTrainerHours(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-white/5 focus:border-emerald-500 rounded-lg p-2 text-xs text-white"
                  >
                    {Array.from({ length: duration }, (_, i) => i + 1).map(h => (
                      <option key={h} value={h}>{h} Hour{h > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Head Count (pax)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={trainerHeads}
                    onChange={e => setTrainerHeads(Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className="bg-slate-900 border border-white/5 focus:border-emerald-500 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* User comments */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="userNotes">Special Instructions or Notes</label>
            <textarea
              id="userNotes"
              rows={2}
              value={userNotes}
              onChange={e => setUserNotes(e.target.value)}
              placeholder="e.g. Bringing own paddles, request for extra nets, etc."
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto self-end px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            Review Booking <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* STEP 4: Review Summary */}
      {step === 4 && (
        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-400" /> Review Booking Hold
            </h3>
            <button
              onClick={prevStep}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 border border-white/5 rounded-xl p-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Name</span>
                <span className="font-semibold text-white">{bookerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Phone</span>
                <span className="font-semibold text-white">{contactPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Courts Requested</span>
                <span className="font-semibold text-white">{courtCount} Court{courtCount > 1 ? 's' : ''} (Assigned order)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date & Time</span>
                <span className="font-semibold text-emerald-400">
                  {date} @ {selectedHour !== null ? `${selectedHour % 12 || 12}:00 ${selectedHour >= 12 ? 'PM' : 'AM'}` : ''} ({duration} hr{duration > 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Extras overview list if any */}
            {(paddles > 0 || balls > 0 || (trainerOn && trainerHours > 0)) && (
              <div className="bg-slate-950/20 border border-white/5 rounded-xl p-3 flex flex-col gap-1 text-xs text-slate-400">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Requested Extras</span>
                {paddles > 0 && <span>· {paddles} Paddle rental{paddles > 1 ? 's' : ''} (₱{paddles * 100})</span>}
                {balls > 0 && <span>· {balls} Pro Pickleball{balls > 1 ? 's' : ''} (₱{balls * 100})</span>}
                {trainerOn && <span>· Trainer Coaching ({trainerHours}h × {trainerHeads} pax = ₱{trainerHours * trainerHeads * 500})</span>}
              </div>
            )}

            {/* Pricing Breakdown */}
            <BookingPriceBreakdown
              singleCourtCost={singleCourtCost}
              courtCount={courtCount}
              paddles={paddles}
              balls={balls}
              trainerHours={trainerOn ? trainerHours : 0}
              trainerHeads={trainerOn ? trainerHeads : 0}
            />

            <button
              onClick={handleCheckoutSubmit}
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Reserve Hold & Continue to Payment <ChevronRight size={16} />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Clicking reserve locks the slot for 30 minutes. You will pay on the next screen.
            </p>
          </div>
        </div>
      )}

      {/* STEP 5: Payment Form */}
      {step === 5 && (
        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
          <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-400" /> Offline Payment Details
          </h3>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-400 leading-relaxed flex gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">30-Minute Hold Active</p>
              <p className="mt-1">
                We have temporarily reserved your court allocation. Please transfer the total amount below, then enter your sender name and reference code to submit for verification. If you don't submit within 30 minutes, this hold expires.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Payment Method selector */}
            <div className="flex flex-col gap-4 text-left">
              {/* QRPh Fee Advisory Card */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-xs text-slate-200 leading-relaxed flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider">QRPh Recommended</span>
                  <span className="font-bold text-emerald-400">Transaction Fee Info</span>
                </div>
                <p>
                  For court booking payments, we recommend using <strong>QRPh</strong>, which charges a minimal convenience fee to help cover app maintenance:
                </p>
                <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px] text-slate-400">
                  <li>Amounts <strong>₱500 and below</strong>: ₱15 convenience fee</li>
                  <li>Amounts <strong>₱501 and above</strong>: ₱25 convenience fee</li>
                </ul>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  We hope for your understanding and thank you so much for your continued support!
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Select Transfer Target</label>
                <div className="flex flex-col gap-2">
                  {paymentMethods.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                        selectedMethodId === m.id
                          ? 'border-emerald-500/50 bg-emerald-500/5 text-white'
                          : 'border-white/5 bg-slate-950/50 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <span className="font-semibold text-sm">{m.name}</span>
                      {selectedMethodId === m.id && <Check size={16} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic QR code visual */}
              {activeMethod && (
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3">
                  <div className="w-48 h-48 bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
                    {activeMethod.qr_image_url ? (
                      <img src={activeMethod.qr_image_url} alt="Payment QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-600">No QR Available</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Account Details:</p>
                    <p className="font-bold text-white text-sm mt-0.5">{activeMethod.account_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Input form */}
            <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4 text-left">
              <div className="bg-slate-900/30 rounded-xl p-3 border border-white/5 flex justify-between items-center text-sm">
                <span className="text-slate-400">Amount Due:</span>
                <span className="font-bold text-emerald-400 text-lg">₱{priceBreakdown.grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="senderName">Sender Account Name</label>
                <input
                  id="senderName"
                  type="text"
                  required
                  placeholder="e.g. JUAN DELA CRUZ"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="referenceNo">Transaction Reference Number</label>
                <input
                  id="referenceNo"
                  type="text"
                  required
                  placeholder="e.g. 50012345678"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold" htmlFor="senderPlatform">E-Wallet Used (Optional)</label>
                <input
                  id="senderPlatform"
                  type="text"
                  placeholder="e.g. GCash / GoTyme / Maya"
                  value={senderPlatform}
                  onChange={e => setSenderPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} /> Submit Reference Code
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                Once submitted, you will be redirected. Staff will verify your transaction shortly.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Downgrade Dialog Modal */}
      {downgradeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass border border-white/15 rounded-2xl w-full max-w-sm p-6 relative text-left flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle size={24} />
              <h3 className="font-display font-bold text-lg text-white">Partial Slot Available</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              You requested <strong>{courtCount} courts</strong>, but only <strong>{downgradeDialog.freeCount} courts</strong> are free at this hour.
            </p>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Would you like to downgrade your booking to <strong>{downgradeDialog.freeCount} court{downgradeDialog.freeCount > 1 ? 's' : ''}</strong> for this session and proceed?
            </p>

            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setDowngradeDialog(null)}
                className="px-3.5 py-2 border border-white/5 bg-slate-900 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel / Choose Another
              </button>
              <button
                onClick={confirmDowngrade}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all"
              >
                Downgrade & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getAdminBookingCategory, ADMIN_CATEGORY_META } from '../../utils/bookingStatus';
import { parseBookingNotes } from '../../utils/parseBookingNotes';
import { Calendar, Phone, User, Check, X, ShieldAlert, CircleDollarSign } from 'lucide-react';
import BookingPriceBreakdown from './BookingPriceBreakdown';

export default function AdminBookingCardDetails({ booking, onVerify, onCancel, onCollectCash }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const category = getAdminBookingCategory(booking);
  const meta = ADMIN_CATEGORY_META[category] || { label: booking.status, colorClass: "bg-slate-500/10 text-slate-400" };
  const parsedNotes = parseBookingNotes(booking.notes);

  // Convert hour to 12-hour AM/PM format
  const formatHour = (hour) => {
    if (hour === 0) return '12:00 MN';
    if (hour === 12) return '12:00 PM';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}:00 ${ampm}`;
  };

  const timeRangeLabel = `${formatHour(booking.start_hour)} - ${formatHour(booking.start_hour + booking.duration_hours)}`;

  return (
    <div className="glass border border-white/5 rounded-2xl p-5 flex flex-col gap-4 text-left transition-all duration-300 hover:border-white/10 hover:shadow-xl">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-wider uppercase text-slate-500 font-bold">Booking Details</span>
          <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
            Court {booking.court_id?.replace('court-', '')}
            <span className="text-slate-400 text-sm font-normal">({booking.court_id})</span>
          </h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.colorClass}`}>
          {meta.label}
        </span>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 bg-slate-900/30 rounded-lg p-2">
          <User size={14} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Booker Name</p>
            <p className="font-medium text-white">{parsedNotes.bookerName || 'Guest'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/30 rounded-lg p-2">
          <Phone size={14} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Contact Phone</p>
            <p className="font-medium text-white">{booking.contact_phone || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/30 rounded-lg p-2">
          <Calendar size={14} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Date & Slot</p>
            <p className="font-medium text-white">{booking.date} · {timeRangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/30 rounded-lg p-2">
          <CircleDollarSign size={14} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Amount Paid</p>
            <p className="font-medium text-emerald-400">₱{booking.total_price?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Payment Reference Check */}
      {booking.status === 'processing' && (
        <div className="bg-slate-950/50 rounded-xl border border-white/5 p-3 flex flex-col gap-2 text-xs">
          <p className="font-semibold text-slate-400">GCash/GoTyme Payment Reference</p>
          {booking.payment_reference ? (
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Sender Name</span>
                <span className="font-medium text-white">{booking.payment_sender_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Reference No.</span>
                <span className="font-medium text-emerald-400 select-all">{booking.payment_reference}</span>
              </div>
              {booking.payment_sender_platform && (
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 block">E-Wallet Provider</span>
                  <span>{booking.payment_sender_platform}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-rose-400 italic">User has not entered a transaction reference yet.</p>
          )}
        </div>
      )}

      {/* User Notes segment if present */}
      {parsedNotes.userNotes && (
        <div className="bg-slate-900/20 border-l-2 border-emerald-500 px-3 py-1.5 text-xs text-slate-400 italic">
          "{parsedNotes.userNotes}"
        </div>
      )}

      {/* Rejection Reason segment if present */}
      {booking.status === 'cancelled' && booking.rejection_reason && (
        <div className="bg-rose-500/10 border-l-2 border-rose-500 px-3 py-1.5 text-xs text-rose-400 italic mt-2">
          Rejection Reason: "{booking.rejection_reason}"
        </div>
      )}

      {/* Price breakdown */}
      <BookingPriceBreakdown
        notes={booking.notes}
        totalPrice={booking.total_price}
        courtCount={1}
      />

      {/* Admin Action Buttons */}
      <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-white/5">
        {category === 'paid_verify' && onVerify && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          >
            <Check size={14} /> Confirm Booking
          </button>
        )}

        {category === 'admin_unpaid' && onCollectCash && (
          <button
            onClick={() => onCollectCash(booking.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(249,115,22,0.2)]"
          >
            <CircleDollarSign size={14} /> Collect Cash (₱{booking.total_price})
          </button>
        )}

        {booking.status !== 'cancelled' && booking.status !== 'completed' && onCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/5 bg-slate-900 text-rose-400 hover:bg-rose-500/10 font-medium text-xs transition-all"
          >
            <X size={14} /> Cancel Booking
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="glass border border-emerald-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Check size={24} />
            </div>
            <h3 className="font-display font-bold text-white text-lg mb-2">Confirm Booking</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to confirm this booking for <strong className="text-white">{parsedNotes.bookerName || 'Guest'}</strong>?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onVerify(booking.id);
                  setShowConfirmModal(false);
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold text-sm rounded-xl transition-all"
              >
                Go back &crarr;
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

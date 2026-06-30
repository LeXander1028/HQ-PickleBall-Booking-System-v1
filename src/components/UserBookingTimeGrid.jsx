import React from 'react';
import { classifySlotAvailability, getHourRateBracket } from '../utils/bookingHours';

export default function UserBookingTimeGrid({
  date,
  duration,
  courtCount = 1,
  bookings = [],
  blockedSlots = [],
  selectedHour,
  onSelectHour
}) {
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0];
  const currentHour = currentDate.getHours();

  // Format hour label
  const formatHourLabel = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h} ${ampm}`;
  };

  // Generate 24 slots (0 - 23)
  const slots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Legend / Info */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold">Rates & Color Guide</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg p-2 border border-white/5">
            <span className="w-3 h-3 rounded bg-orange-500" />
            <span>Morning (₱600/hr)</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg p-2 border border-white/5">
            <span className="w-3 h-3 rounded bg-teal-500" />
            <span>Afternoon (₱600/hr)</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg p-2 border border-white/5">
            <span className="w-3 h-3 rounded bg-indigo-500" />
            <span>Evening (₱600/hr)</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg p-2 border border-white/5">
            <span className="w-3 h-3 rounded bg-fuchsia-500" />
            <span>Late Night (₱600/hr)</span>
          </div>
          <div className="col-span-2 sm:col-span-4 mt-1 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-400 font-semibold">
            Promo: ₱300/person Mon-Thurs 6AM-12NN (Automatically applied at checkout)
          </div>
        </div>
      </div>

      {/* Grid Header */}
      <div className="flex justify-between items-center bg-slate-900/30 rounded-xl p-3 border border-white/5">
        <span className="text-xs text-slate-400">Duration: <strong>{duration} hour{duration > 1 ? 's' : ''}</strong></span>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Full (All Courts Free)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-400">Partial (Few Courts Free)</span>
          </div>
        </div>
      </div>

      {/* Interactive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((hour) => {
          const availability = classifySlotAvailability({
            startHour: hour,
            duration,
            numCourts: courtCount,
            bookings,
            blockedSlots,
            dateStr: date,
            currentDateStr,
            currentHour
          });

          const isSelected = selectedHour === hour;
          const bracket = getHourRateBracket(hour);

          // Render classifications
          if (availability === 'past') {
            return (
              <div
                key={hour}
                className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 flex flex-col gap-1.5 opacity-30 select-none text-slate-600"
              >
                <span className="text-xs font-semibold">{formatHourLabel(hour)}</span>
                <span className="text-[10px] uppercase font-bold">Past Hour</span>
              </div>
            );
          }

          if (availability === 'none') {
            return (
              <div
                key={hour}
                className="bg-slate-950/20 border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 opacity-40 select-none text-slate-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{formatHourLabel(hour)}</span>
                  <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded">Blocked</span>
                </div>
                <span className="text-[10px] uppercase font-bold">Unavailable</span>
              </div>
            );
          }

          const isFull = availability === 'full';
          const indicatorColor = isFull ? 'bg-emerald-500' : 'bg-amber-500';
          const borderColor = isSelected 
            ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-emerald-500/10' 
            : 'border-white/10 bg-slate-900/40 hover:border-white/20';

          // Color for time slot badge
          let bracketBadgeColor = "bg-slate-800 text-slate-300";
          if (bracket.color === 'bracket-morning') bracketBadgeColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
          if (bracket.color === 'bracket-afternoon') bracketBadgeColor = "bg-teal-500/10 text-teal-400 border border-teal-500/20";
          if (bracket.color === 'bracket-evening') bracketBadgeColor = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
          if (bracket.color === 'bracket-night') bracketBadgeColor = "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20";

          return (
            <button
              key={hour}
              type="button"
              onClick={() => onSelectHour(hour, availability)}
              className={`border rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200 cursor-pointer ${borderColor}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-display font-bold text-sm text-white">{formatHourLabel(hour)}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${indicatorColor}`} />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${bracketBadgeColor}`}>
                  {bracket.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ₱{bracket.rate}/hr
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

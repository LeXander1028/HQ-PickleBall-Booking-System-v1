import React from 'react';
import { PRICING } from '../../lib/constants';
import { parseBookingNotes } from '../../utils/parseBookingNotes';

/**
 * A beautiful pricing breakdown table component.
 * Supports passing structured pricing elements or parsing them directly from a booking notes field.
 * 
 * @param {object} props
 * @param {number} [props.singleCourtCost] - Price of single court duration
 * @param {number} [props.courtCount] - Quantity of courts
 * @param {string} [props.notes] - If passed, parses breakdown from notes
 * @param {number} [props.paddles]
 * @param {number} [props.balls]
 * @param {number} [props.trainerHours]
 * @param {number} [props.trainerHeads]
 * @param {number} [props.totalPrice] - Grand total stored
 */
export default function BookingPriceBreakdown({
  singleCourtCost,
  courtCount = 1,
  notes,
  paddles = 0,
  balls = 0,
  trainerHours = 0,
  trainerHeads = 0,
  totalPrice
}) {
  let displayPaddles = paddles;
  let displayBalls = balls;
  let displayTrainerHours = trainerHours;
  let displayTrainerHeads = trainerHeads;

  if (notes) {
    const parsed = parseBookingNotes(notes);
    displayPaddles = parsed.paddles;
    displayBalls = parsed.balls;
    displayTrainerHours = parsed.trainerHours;
    displayTrainerHeads = parsed.trainerHeads;
  }

  // Calculate costs
  const calcCourtCost = singleCourtCost 
    ? (singleCourtCost * courtCount) 
    : (totalPrice 
        ? (totalPrice - ((displayPaddles * PRICING.paddleRate) + (displayBalls * PRICING.ballRate) + (displayTrainerHours * displayTrainerHeads * PRICING.trainerHourlyRatePerPax))) 
        : 0);

  const paddleCost = displayPaddles * PRICING.paddleRate;
  const ballCost = displayBalls * PRICING.ballRate;
  const trainerCost = displayTrainerHours * displayTrainerHeads * PRICING.trainerHourlyRatePerPax;
  
  const grandTotal = totalPrice || (calcCourtCost + paddleCost + ballCost + trainerCost);

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3.5 text-sm">
      <h3 className="font-semibold text-xs tracking-wider text-slate-400 uppercase">Payment Summary</h3>
      
      <div className="flex flex-col gap-2 border-b border-white/5 pb-3">
        {/* Court rental */}
        <div className="flex justify-between items-center text-slate-300">
          <span>Court Rental {courtCount > 1 ? `(${courtCount} courts)` : ""}</span>
          <span className="font-medium text-white">₱{calcCourtCost.toLocaleString()}</span>
        </div>

        {/* Paddles */}
        {displayPaddles > 0 && (
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>{displayPaddles} × Paddle Rental</span>
            <span>₱{paddleCost.toLocaleString()}</span>
          </div>
        )}

        {/* Balls */}
        {displayBalls > 0 && (
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>{displayBalls} × Pro Pickleballs</span>
            <span>₱{ballCost.toLocaleString()}</span>
          </div>
        )}

        {/* Trainer */}
        {displayTrainerHours > 0 && displayTrainerHeads > 0 && (
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Trainer ({displayTrainerHours}h × {displayTrainerHeads} pax)</span>
            <span>₱{trainerCost.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="flex justify-between items-center text-base font-semibold text-emerald-400 pt-0.5">
        <span>Total Price</span>
        <span className="text-lg">₱{grandTotal.toLocaleString()}</span>
      </div>
    </div>
  );
}

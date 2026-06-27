import { PRICING } from './constants';

/**
 * Checks if a slot falls under the Mon-Thurs 6am-12nn promo rate.
 * @param {string} dateStr - Calendar date YYYY-MM-DD
 * @param {number} startHour - Integer 0-23
 * @param {number} durationHours - Booking duration
 * @returns {boolean}
 */
export function isMonThursPromo(dateStr, startHour, durationHours) {
  if (!dateStr) return false;
  
  // Construct date in local timezone
  const dateObj = new Date(`${dateStr}T00:00:00`);
  const day = dateObj.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  
  const isMonThurs = day >= 1 && day <= 4;
  if (!isMonThurs) return false;

  // Check if ALL hours fall in the 6 AM - 12 NN window
  // Range is [startHour, startHour + durationHours)
  for (let i = 0; i < durationHours; i++) {
    const hour = (startHour + i) % 24;
    if (hour < 6 || hour >= 12) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates the rental cost for a single court based on the start hour and duration.
 * Includes Mon-Thurs 6am-12nn 300/person pricing promo.
 * 
 * @param {number} startHour - Integer 0-23
 * @param {number} durationHours - Whole number of hours
 * @param {string} [dateStr] - Calendar date YYYY-MM-DD
 * @param {number} [playerCount=1] - Number of players
 * @returns {number} - Total cost in PHP for one court
 */
export function calculateCourtTotal(startHour, durationHours, dateStr = null, playerCount = 1) {
  const isPromo = isMonThursPromo(dateStr, startHour, durationHours);
  
  if (isPromo) {
    // Mon-Thurs Promo: 300 PHP per person * playerCount * durationHours
    return PRICING.promoRatePerHour * (playerCount || 1) * durationHours;
  }

  let total = 0;
  for (let i = 0; i < durationHours; i++) {
    const hour = (startHour + i) % 24;
    total += PRICING.courtRates[hour] || 500;
  }
  return total;
}

/**
 * Calculates the total cost for extras (paddles, balls, trainer coaching)
 */
export function calculateExtrasTotal({ paddles = 0, balls = 0, trainerHours = 0, trainerHeads = 0 }) {
  const paddleCost = paddles * PRICING.paddleRate;
  const ballCost = balls * PRICING.ballRate;
  const trainerCost = trainerHours * trainerHeads * PRICING.trainerHourlyRatePerPax;
  
  return paddleCost + ballCost + trainerCost;
}

/**
 * Calculates the overall total price for a checkout
 */
export function calculateBookingBreakdown({
  startHour,
  durationHours,
  courtCount = 1,
  paddles = 0,
  balls = 0,
  trainerHours = 0,
  trainerHeads = 0,
  dateStr = null,
  playerCount = 1
}) {
  const singleCourtCost = calculateCourtTotal(startHour, durationHours, dateStr, playerCount);
  const courtSubtotal = singleCourtCost * courtCount;
  
  const extrasTotal = calculateExtrasTotal({ paddles, balls, trainerHours, trainerHeads });
  const grandTotal = courtSubtotal + extrasTotal;
  
  return {
    singleCourtCost,
    courtSubtotal,
    extrasTotal,
    grandTotal
  };
}

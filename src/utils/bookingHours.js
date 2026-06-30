import { VENUE_INFO } from '../lib/constants';

/**
 * Checks if a specific court is free during the hour range [startHour, startHour + duration).
 * 
 * @param {string} courtId - Court ID
 * @param {number} startHour - 0 to 23
 * @param {number} duration - Whole hours
 * @param {Array} bookings - Bookings list for this date (status !== cancelled)
 * @param {Array} blockedSlots - Blocked slots list for this date and court
 * @returns {boolean}
 */
export function isCourtFreeForSlot(courtId, startHour, duration, bookings = [], blockedSlots = []) {
  // Check boundary: slot cannot extend past midnight (hour 24)
  if (startHour + duration > 24) {
    return false;
  }

  // Generate target hours in range
  const targetHours = [];
  for (let h = startHour; h < startHour + duration; h++) {
    targetHours.push(h);
  }

  // Check bookings collision
  // Booking active hours: [start_hour, start_hour + duration_hours)
  for (const b of bookings) {
    if (b.court_id === courtId && b.status !== 'cancelled') {
      const bStart = b.start_hour;
      const bEnd = b.start_hour + b.duration_hours;
      
      // Check overlap
      const hasOverlap = targetHours.some(h => h >= bStart && h < bEnd);
      if (hasOverlap) return false;
    }
  }

  // Check blocked slots collision
  for (const block of blockedSlots) {
    if (block.court_id === courtId) {
      const blockStart = block.start_hour;
      const blockEnd = block.start_hour + block.duration_hours;
      
      const hasOverlap = targetHours.some(h => h >= blockStart && h < blockEnd);
      if (hasOverlap) return false;
    }
  }

  return true;
}

/**
 * Counts and returns the free court entities for a slot.
 */
export function getFreeCourtsForSlot(startHour, duration, bookings = [], blockedSlots = []) {
  const activeCourts = VENUE_INFO.courts.filter(c => c.is_active);
  return activeCourts.filter(c => isCourtFreeForSlot(c.id, startHour, duration, bookings, blockedSlots));
}

/**
 * Checks if a start hour is in the past compared to current date & hour.
 */
export function isHourInPast(hour, dateStr, currentDateStr, currentHour) {
  if (dateStr < currentDateStr) return true;
  if (dateStr === currentDateStr && hour <= currentHour) return true;
  return false;
}

/**
 * Classifies the availability of a slot.
 * Statuses:
 * - 'past': Slot is in the past.
 * - 'none': Slot overflows midnight OR no free courts.
 * - 'full': Free courts >= requested quantity.
 * - 'partial': Free courts > 0 but less than requested quantity.
 */
export function classifySlotAvailability({
  startHour,
  duration,
  numCourts,
  bookings = [],
  blockedSlots = [],
  dateStr,
  currentDateStr,
  currentHour
}) {
  if (isHourInPast(startHour, dateStr, currentDateStr, currentHour)) {
    return 'past';
  }

  if (startHour + duration > 24) {
    return 'none';
  }

  const freeCourts = getFreeCourtsForSlot(startHour, duration, bookings, blockedSlots);
  const freeCount = freeCourts.length;

  if (freeCount === 0) {
    return 'none';
  }

  if (freeCount >= numCourts) {
    return 'full';
  }

  return 'partial';
}

/**
 * Gets the color scale and label for pricing grids.
 */
export function getHourRateBracket(hour) {
  if (hour >= 0 && hour <= 6) {
    return { name: "Late Night", color: "bracket-night", rate: 600 };
  }
  if (hour >= 7 && hour <= 11) {
    return { name: "Morning", color: "bracket-morning", rate: 600 };
  }
  if (hour >= 12 && hour <= 16) {
    return { name: "Afternoon", color: "bracket-afternoon", rate: 600 };
  }
  return { name: "Evening", color: "bracket-evening", rate: 600 };
}

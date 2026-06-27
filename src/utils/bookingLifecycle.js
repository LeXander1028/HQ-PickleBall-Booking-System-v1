import { parseISO, addHours, isBefore, isAfter } from 'date-fns';

/**
 * Returns the Date object representing the end hour of a booking slot.
 * @param {string} dateStr - Booking calendar date (YYYY-MM-DD)
 * @param {number} startHour - Booking start hour (0-23)
 * @param {number} durationHours - Duration in hours
 * @returns {Date}
 */
export function getBookingEndDateTime(dateStr, startHour, durationHours) {
  // Parse date as ISO local date e.g. "2026-06-27"
  const startDateTime = new Date(`${dateStr}T${String(startHour).padStart(2, '0')}:00:00`);
  return addHours(startDateTime, durationHours);
}

/**
 * Returns the Date object representing the start hour of a booking slot.
 * @param {string} dateStr - Booking calendar date (YYYY-MM-DD)
 * @param {number} startHour - Booking start hour (0-23)
 * @returns {Date}
 */
export function getBookingStartDateTime(dateStr, startHour) {
  return new Date(`${dateStr}T${String(startHour).padStart(2, '0')}:00:00`);
}

/**
 * Checks if a booking's session has already ended relative to referenceTime.
 * @param {object} booking - Booking data containing date, start_hour, duration_hours
 * @param {Date} [referenceTime] - Comparison time (defaults to now)
 * @returns {boolean}
 */
export function hasBookingEnded(booking, referenceTime = new Date()) {
  if (!booking) return false;
  const endDateTime = getBookingEndDateTime(booking.date, booking.start_hour, booking.duration_hours);
  return isBefore(endDateTime, referenceTime);
}

/**
 * Checks if a booking's session is in the future.
 * @param {object} booking - Booking data containing date, start_hour
 * @param {Date} [referenceTime] - Comparison time (defaults to now)
 * @returns {boolean}
 */
export function isBookingUpcoming(booking, referenceTime = new Date()) {
  if (!booking) return false;
  const startDateTime = getBookingStartDateTime(booking.date, booking.start_hour);
  return isAfter(startDateTime, referenceTime);
}

/**
 * Checks if a processing hold is expired (more than 30 minutes old and has no payment reference).
 * @param {object} booking - Booking data containing created_at, status, payment_reference
 * @param {Date} [referenceTime] - Comparison time (defaults to now)
 * @returns {boolean}
 */
export function isHoldExpired(booking, referenceTime = new Date()) {
  if (!booking || booking.status !== "processing" || booking.payment_reference) {
    return false;
  }
  const createdAt = booking.created_at ? new Date(booking.created_at) : referenceTime;
  const expiryTime = new Date(createdAt.getTime() + 30 * 60 * 1000); // 30 minutes
  return isBefore(expiryTime, referenceTime);
}

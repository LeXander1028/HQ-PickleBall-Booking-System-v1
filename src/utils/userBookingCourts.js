import { getFreeCourtsForSlot } from './bookingHours';

/**
 * Assigns the first N free courts ordered by name that are free for the slot.
 * 
 * @param {number} startHour - Booking start hour (0-23)
 * @param {number} duration - Booking duration in hours
 * @param {number} numCourts - Requested court quantity (1-3)
 * @param {Array} bookings - Existing bookings for the day
 * @param {Array} blockedSlots - Existing blocked slots for the day
 * @returns {Array} - Array of assigned court objects.
 */
export function assignCourtsForBooking(startHour, duration, numCourts, bookings = [], blockedSlots = []) {
  const freeCourts = getFreeCourtsForSlot(startHour, duration, bookings, blockedSlots);
  
  // Sort courts by name (e.g. Court 1, Court 2, Court 3)
  const sortedFreeCourts = [...freeCourts].sort((a, b) => a.name.localeCompare(b.name));
  
  // Slice first N courts
  return sortedFreeCourts.slice(0, numCourts);
}

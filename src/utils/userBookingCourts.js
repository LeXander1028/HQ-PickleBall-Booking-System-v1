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
export function assignCourtsForBooking(startHour, duration, numCourts, bookings = [], blockedSlots = [], preferredColor = 'any') {
  const freeCourts = getFreeCourtsForSlot(startHour, duration, bookings, blockedSlots);
  
  const getColor = (name) => {
    // Determine color based on Court 1, 2, 3 etc. Odd = red, Even = blue.
    const num = parseInt(name.replace(/\D/g, ''), 10);
    return num % 2 === 0 ? 'blue' : 'red';
  };

  // Sort courts by color preference first, then by name (e.g. Court 1, Court 2, Court 3)
  const sortedFreeCourts = [...freeCourts].sort((a, b) => {
    if (preferredColor !== 'any') {
      const aColor = getColor(a.name);
      const bColor = getColor(b.name);
      if (aColor === preferredColor && bColor !== preferredColor) return -1;
      if (bColor === preferredColor && aColor !== preferredColor) return 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Slice first N courts
  return sortedFreeCourts.slice(0, numCourts);
}

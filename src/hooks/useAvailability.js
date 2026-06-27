import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to fetch bookings and blocked slots for a specific date to compute availability.
 * @param {string} dateStr - Date string formatted as YYYY-MM-DD
 */
export function useAvailability(dateStr) {
  const [bookings, setBookings] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailabilityData = useCallback(async () => {
    if (!dateStr) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch bookings for the date that are not cancelled
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', dateStr)
        .neq('status', 'cancelled');
        
      if (bookingsError) throw bookingsError;

      // Fetch blocked slots for the date
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocked_slots')
        .select('*')
        .eq('date', dateStr);

      if (blocksError) throw blocksError;

      setBookings(bookingsData || []);
      setBlockedSlots(blocksData || []);
    } catch (err) {
      console.error("Error loading availability data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchAvailabilityData();
  }, [fetchAvailabilityData]);

  return {
    bookings,
    blockedSlots,
    loading,
    error,
    refresh: fetchAvailabilityData
  };
}
export default useAvailability;

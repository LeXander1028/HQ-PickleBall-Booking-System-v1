import { describe, it, expect } from 'vitest';
import { calculateCourtTotal, calculateExtrasTotal, calculateBookingBreakdown } from '../lib/pricing';
import { parseBookingNotes, buildFullNotes } from './parseBookingNotes';
import { isCourtFreeForSlot, classifySlotAvailability } from './bookingHours';

describe('Pricing Calculations', () => {
  it('should calculate court cost correctly by hour ranges', () => {
    // Standard rates are 600/hr flat for all hours
    expect(calculateCourtTotal(7, 2)).toBe(1200);
    expect(calculateCourtTotal(12, 2)).toBe(1200);
    expect(calculateCourtTotal(17, 2)).toBe(1200);
    expect(calculateCourtTotal(11, 2)).toBe(1200);
  });

  it('should apply Mon-Thurs 6am-12nn promo rates correctly', () => {
    // Wednesday (2026-07-01) is a Wednesday. Slot: 8 AM to 10 AM (2 hours)
    // For 1 player: 300 * 1 * 2 = 600 PHP
    expect(calculateCourtTotal(8, 2, '2026-07-01', 1)).toBe(600);

    // For 4 players: 300 * 4 * 2 = 2400 PHP
    expect(calculateCourtTotal(8, 2, '2026-07-01', 4)).toBe(2400);

    // Saturday (2026-07-04) is weekend, standard rate applies: 600 * 2 = 1200 PHP
    expect(calculateCourtTotal(8, 2, '2026-07-04', 4)).toBe(1200);
  });

  it('should calculate extras cost correctly', () => {
    // 2 paddles (₱200) + 1 ball (₱100) + trainer (2h * 3 heads * ₱500 = ₱3000) = ₱3300
    const total = calculateExtrasTotal({
      paddles: 2,
      balls: 1,
      trainerHours: 2,
      trainerHeads: 3
    });
    expect(total).toBe(3300);
  });

  it('should compute combined checkout breakdown correctly', () => {
    // 2 courts, 2 hours starting 7PM (hours 19-20) -> Court = 2 * (600 + 600) = 2400
    // Trainer 1h * 3 pax -> 500 * 1 * 3 = 1500
    // 2 paddles -> 200
    // Total should be 4100
    const breakdown = calculateBookingBreakdown({
      startHour: 19,
      durationHours: 2,
      courtCount: 2,
      paddles: 2,
      balls: 0,
      trainerHours: 1,
      trainerHeads: 3
    });
    expect(breakdown.courtSubtotal).toBe(2400);
    expect(breakdown.extrasTotal).toBe(1700);
    expect(breakdown.grandTotal).toBe(4100);
  });
});

describe('Notes Codecs', () => {
  it('should build structured notes string correctly', () => {
    const notes = buildFullNotes({
      bookerName: "Juan Dela Cruz",
      paddles: 2,
      balls: 1,
      trainerHours: 2,
      trainerHeads: 3,
      userNotes: "Bringing own snacks"
    });
    expect(notes).toBe("Booked under: Juan Dela Cruz · 2 paddle rentals (₱200) · 1 ball (₱100) · trainer (2h × 3 pax × ₱500/hr) · Bringing own snacks");
  });

  it('should parse structured notes string correctly', () => {
    const notes = "Booked under: Juan Dela Cruz · 2 paddle rentals (₱200) · 1 ball (₱100) · trainer (2h × 3 pax × ₱500/hr) · Bringing own snacks";
    const parsed = parseBookingNotes(notes);
    expect(parsed.bookerName).toBe("Juan Dela Cruz");
    expect(parsed.paddles).toBe(2);
    expect(parsed.balls).toBe(1);
    expect(parsed.trainerHours).toBe(2);
    expect(parsed.trainerHeads).toBe(3);
    expect(parsed.userNotes).toBe("Bringing own snacks");
    expect(parsed.extrasTotal).toBe(3300);
  });

  it('should fallback gracefully on legacy trainer formats', () => {
    const legacyNotes = "Booked under: Juan · trainer (2h)";
    const parsed = parseBookingNotes(legacyNotes);
    expect(parsed.bookerName).toBe("Juan");
    expect(parsed.trainerHours).toBe(2);
    expect(parsed.trainerHeads).toBe(1); // defaults to 1 head
    expect(parsed.extrasTotal).toBe(1000);
  });
});

describe('Slot Availability Math', () => {
  const mockBookings = [
    { court_id: 'court-1', date: '2026-06-27', start_hour: 8, duration_hours: 2, status: 'confirmed' }
  ];
  const mockBlocks = [
    { court_id: 'court-2', date: '2026-06-27', start_hour: 9, duration_hours: 1 }
  ];

  it('should check if a court is free correctly', () => {
    // court-1 has booking from 8-10. So it's not free at 9
    expect(isCourtFreeForSlot('court-1', 9, 1, mockBookings, [])).toBe(false);
    
    // court-1 is free before 8
    expect(isCourtFreeForSlot('court-1', 7, 1, mockBookings, [])).toBe(true);

    // court-2 has block from 9-10. So not free at 9
    expect(isCourtFreeForSlot('court-2', 9, 1, [], mockBlocks)).toBe(false);
  });

  it('should classify slots availability correctly', () => {
    const availability = classifySlotAvailability({
      startHour: 9,
      duration: 1,
      numCourts: 5, // Request 5 courts, only 4 are free (total 6, 2 occupied)
      bookings: mockBookings,
      blockedSlots: mockBlocks,
      dateStr: '2026-06-27',
      currentDateStr: '2026-06-26', // relative future date check
      currentHour: 0
    });
    // court-1 is occupied (booking 8-10)
    // court-2 is occupied (block 9-10)
    // Only court-3, 4, 5, 6 are free (4 courts). User requested 5 courts.
    // So availability should be partial!
    expect(availability).toBe('partial');
  });
});

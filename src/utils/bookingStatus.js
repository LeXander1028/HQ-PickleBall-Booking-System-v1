/**
 * Helpers for booking statuses and category derivation.
 */

export const BOOKING_STATUSES = {
  PROCESSING: "processing",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed"
};

/**
 * Derives the admin category for a given booking.
 * Categories:
 * - 'paid_verify': Status is processing, has a payment reference (not ADMIN). Staff needs to confirm.
 * - 'unpaid': Status is processing, no payment reference.
 * - 'admin_unpaid': payment_reference is 'ADMIN' and payment_collected is false.
 * - 'confirmed': Status is confirmed (paid or desk-collected).
 * - 'cancelled': Status is cancelled.
 * - 'completed': Status is completed.
 * 
 * @param {object} booking - Booking row
 * @returns {string} - Admin category key
 */
export function getAdminBookingCategory(booking) {
  if (!booking) return "unpaid";
  
  const status = booking.status || "processing";
  const ref = booking.payment_reference || "";
  const collected = !!booking.payment_collected;

  if (status === BOOKING_STATUSES.CANCELLED) {
    return "cancelled";
  }
  
  if (status === BOOKING_STATUSES.COMPLETED) {
    return "completed";
  }

  if (status === BOOKING_STATUSES.PROCESSING) {
    if (ref && ref !== "ADMIN") {
      return "paid_verify";
    }
    return "unpaid";
  }

  if (status === BOOKING_STATUSES.CONFIRMED) {
    if (ref === "ADMIN" && !collected) {
      return "admin_unpaid";
    }
    return "confirmed";
  }

  return status;
}

/**
 * Metadata for each admin category.
 */
export const ADMIN_CATEGORY_META = {
  paid_verify: {
    label: "To Verify",
    colorClass: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    description: "Paid by user, needs reference number validation."
  },
  unpaid: {
    label: "Pending Pay",
    colorClass: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    description: "Hold active, waiting for user to send payment reference."
  },
  admin_unpaid: {
    label: "Desk Unpaid",
    colorClass: "bg-orange-500/10 text-orange-400 border border-orange-500/25",
    description: "Staff booking, cash payment not yet collected."
  },
  confirmed: {
    label: "Confirmed",
    colorClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    description: "Booked and verified. Playable."
  },
  cancelled: {
    label: "Cancelled",
    colorClass: "bg-slate-500/10 text-slate-400 border border-slate-500/25",
    description: "Hold expired or booking cancelled."
  },
  completed: {
    label: "Completed",
    colorClass: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25",
    description: "Past rental hour. Automatically closed."
  }
};

/**
 * Map a raw DB status to a simple user-facing status.
 */
export function getUserBookingStatusLabel(status, paymentReference) {
  switch (status) {
    case BOOKING_STATUSES.PROCESSING:
      return paymentReference ? "Pending Verification" : "Awaiting Payment";
    case BOOKING_STATUSES.CONFIRMED:
      return "Confirmed";
    case BOOKING_STATUSES.CANCELLED:
      return "Cancelled";
    case BOOKING_STATUSES.COMPLETED:
      return "Completed";
    default:
      return status;
  }
}

export function getUserBookingStatusStyles(status, paymentReference) {
  switch (status) {
    case BOOKING_STATUSES.PROCESSING:
      return paymentReference
        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
        : "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    case BOOKING_STATUSES.CONFIRMED:
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    case BOOKING_STATUSES.CANCELLED:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/30";
    case BOOKING_STATUSES.COMPLETED:
      return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30";
    default:
      return "bg-slate-500/10 text-slate-400";
  }
}

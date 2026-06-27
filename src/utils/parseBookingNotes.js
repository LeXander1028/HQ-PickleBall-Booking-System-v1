/**
 * Generates the structured notes string stored in the bookings database table.
 * Format: Booked under: {name} · {extras segments} · {user free text}
 */
export function buildFullNotes({
  bookerName,
  paddles = 0,
  balls = 0,
  trainerHours = 0,
  trainerHeads = 0,
  userNotes = ""
}) {
  const segments = [];
  
  if (paddles > 0) {
    segments.push(`${paddles} paddle rental${paddles > 1 ? "s" : ""} (₱${paddles * 100})`);
  }
  if (balls > 0) {
    segments.push(`${balls} ball${balls > 1 ? "s" : ""} (₱${balls * 100})`);
  }
  if (trainerHours > 0 && trainerHeads > 0) {
    segments.push(`trainer (${trainerHours}h × ${trainerHeads} pax × ₱500/hr)`);
  }
  
  const extrasPart = segments.length > 0 ? segments.join(" · ") : "No extras";
  const userNotesPart = userNotes.trim();
  
  return `Booked under: ${bookerName} · ${extrasPart}${userNotesPart ? ` · ${userNotesPart}` : ""}`;
}

/**
 * Parses the structured notes string back into distinct JS types.
 * @param {string} notes - Structured notes field
 * @returns {object} - { bookerName, paddles, balls, trainerHours, trainerHeads, extrasTotal, userNotes }
 */
export function parseBookingNotes(notes = "") {
  const defaultResult = {
    bookerName: "",
    paddles: 0,
    balls: 0,
    trainerHours: 0,
    trainerHeads: 0,
    extrasTotal: 0,
    userNotes: ""
  };

  if (!notes) return defaultResult;

  let content = notes;
  if (content.startsWith("Booked under: ")) {
    content = content.substring("Booked under: ".length);
  }

  const parts = content.split(" · ");
  if (parts.length === 0) return defaultResult;

  const bookerName = parts[0].trim();
  let paddles = 0;
  let balls = 0;
  let trainerHours = 0;
  let trainerHeads = 0;
  let userNotesSegments = [];

  for (let i = 1; i < parts.length; i++) {
    const segment = parts[i].trim();
    if (!segment) continue;

    if (segment.toLowerCase().includes("paddle")) {
      const match = segment.match(/(\d+)\s+paddle/i);
      if (match) paddles = parseInt(match[1], 10);
    } else if (segment.toLowerCase().includes("ball")) {
      const match = segment.match(/(\d+)\s+ball/i);
      if (match) balls = parseInt(match[1], 10);
    } else if (segment.toLowerCase().includes("trainer")) {
      // Examples:
      // "trainer (2h × 3 pax × ₱500/hr)"
      // Legacy: "trainer (2h)"
      const hourMatch = segment.match(/(\d+)h/i);
      if (hourMatch) {
        trainerHours = parseInt(hourMatch[1], 10);
      }
      const paxMatch = segment.match(/(\d+)\s*pax/i);
      if (paxMatch) {
        trainerHeads = parseInt(paxMatch[1], 10);
      } else {
        if (trainerHours > 0) {
          trainerHeads = 1; // Default legacy to 1 pax
        }
      }
    } else if (segment === "No extras") {
      // Ignore segment
    } else {
      userNotesSegments.push(segment);
    }
  }

  const extrasTotal = (paddles * 100) + (balls * 100) + (trainerHours * trainerHeads * 500);

  return {
    bookerName,
    paddles,
    balls,
    trainerHours,
    trainerHeads,
    extrasTotal,
    userNotes: userNotesSegments.join(" · ")
  };
}

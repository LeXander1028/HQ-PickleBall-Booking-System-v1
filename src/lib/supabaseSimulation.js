// Supabase Local Simulation Driver
// Mimics Supabase JS Client using localStorage for high fidelity local-only execution.

import { buildFullNotes } from '../utils/parseBookingNotes';

const STORAGE_KEY = 'paddlehub_simulation_db';

// Initial state builder
function getInitialDB() {
  const defaultDB = {
    profiles: [
      {
        id: 'mock-admin-uuid-1',
        name: 'Staff Admin',
        phone: '+63 917 000 0000',
        address: 'Consolacion, Cebu',
        onboarding_completed: true,
        role: 'admin',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-player-uuid-1',
        name: 'Juan Dela Cruz',
        phone: '+63 917 111 2222',
        address: 'Liloan, Cebu',
        onboarding_completed: true,
        role: 'user',
        created_at: new Date().toISOString()
      }
    ],
    courts: [
      { id: 'court-1', name: 'Court 1', is_active: true, created_at: new Date().toISOString() },
      { id: 'court-2', name: 'Court 2', is_active: true, created_at: new Date().toISOString() },
      { id: 'court-3', name: 'Court 3', is_active: true, created_at: new Date().toISOString() }
    ],
    bookings: [
      // Seed an upcoming booking for Court 1
      {
        id: 'booking-seed-1',
        user_id: 'mock-player-uuid-1',
        court_id: 'court-1',
        date: new Date().toISOString().split('T')[0], // Today
        start_hour: 17, // 5 PM
        duration_hours: 2,
        total_price: 1000.00,
        status: 'confirmed',
        notes: 'Booked under: Juan Dela Cruz · No extras · Practice session',
        contact_phone: '+63 917 111 2222',
        payment_method_id: 'payment-gcash-uuid',
        payment_sender_name: 'Juan Dela Cruz',
        payment_reference: '123456789',
        payment_collected: true,
        created_at: new Date().toISOString()
      }
    ],
    blocked_slots: [
      // Seed a block on Court 3 tomorrow morning
      {
        id: 'block-seed-1',
        court_id: 'court-3',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        start_hour: 8, // 8 AM
        duration_hours: 3, // 3 hours
        reason: 'Regular Court Cleaning & Net Adjustments',
        created_at: new Date().toISOString()
      }
    ],
    payment_methods: [
      {
        id: 'payment-gcash-uuid',
        name: 'GCash',
        account_name: 'PaddleHub Consolacion (0917-123-4567)',
        qr_image_url: 'https://placehold.co/400x400/030712/10b981?text=GCASH+QR',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'payment-gotyme-uuid',
        name: 'GoTyme Bank',
        account_name: 'PaddleHub Sports Center (Account: 1234-5678-9012)',
        qr_image_url: 'https://placehold.co/400x400/030712/06b6d4?text=GOTYME+QR',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ],
    open_play_posts: [
      {
        id: 'open-play-seed-1',
        title: 'Sunday Morning Open Play (All Levels)',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // In 2 days
        start_hour: 8,
        duration_hours: 3,
        skill_level: 'All Levels (1.0 - 5.0)',
        reclub_url: 'https://reclub.co/events/12345',
        image_url: 'https://placehold.co/600x400/030712/10b981?text=Open+Play+Session',
        blocked_slot_id: null,
        created_at: new Date().toISOString()
      }
    ],
    open_play_rsvps: [],
    notifications: []
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse simulated DB, resetting to defaults", e);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDB));
  return defaultDB;
}

// Write to storage
function commitDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Authentication Session simulator
let currentSession = null;
const sessionListeners = new Set();

// Load session from storage if present
const storedSession = localStorage.getItem('paddlehub_simulation_session');
if (storedSession) {
  try {
    currentSession = JSON.parse(storedSession);
  } catch (e) {
    localStorage.removeItem('paddlehub_simulation_session');
  }
}

function notifyAuthChange() {
  const user = currentSession ? currentSession.user : null;
  sessionListeners.forEach(listener => listener('SIGNED_IN', currentSession));
}

export const supabaseSimulation = {
  auth: {
    signUp: async ({ email, password, options }) => {
      const db = getInitialDB();
      const userExists = db.profiles.some(p => p.id === email);
      if (userExists) {
        return { data: null, error: { message: "User already exists with this email" } };
      }

      const id = email.replace(/[@.]/g, '-'); // Simple UUID simulation
      const newProfile = {
        id,
        name: options?.data?.name || email.split('@')[0],
        phone: options?.data?.phone || '',
        address: options?.data?.address || '',
        onboarding_completed: false,
        role: 'user',
        created_at: new Date().toISOString()
      };

      db.profiles.push(newProfile);
      commitDB(db);

      const session = {
        access_token: 'mock-jwt-' + id,
        user: { id, email, user_metadata: options?.data || {} }
      };
      currentSession = session;
      localStorage.setItem('paddlehub_simulation_session', JSON.stringify(session));
      notifyAuthChange();

      return { data: { user: session.user, session }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const db = getInitialDB();
      // Look up profile matching email-mock-id or assume it's created if we type anything
      let profile = db.profiles.find(p => p.id === email.replace(/[@.]/g, '-'));
      
      // If we are logging in as admin or player seeds
      if (email === 'admin@paddlehub.ph') {
        profile = db.profiles.find(p => p.role === 'admin');
      } else if (email === 'player@paddlehub.ph') {
        profile = db.profiles.find(p => p.id === 'mock-player-uuid-1');
      }

      if (!profile) {
        // Auto create user for convenience in mock mode
        const id = email.replace(/[@.]/g, '-');
        profile = {
          id,
          name: email.split('@')[0],
          phone: '',
          address: '',
          onboarding_completed: false,
          role: 'user',
          created_at: new Date().toISOString()
        };
        db.profiles.push(profile);
        commitDB(db);
      }

      const session = {
        access_token: 'mock-jwt-' + profile.id,
        user: { id: profile.id, email, user_metadata: { name: profile.name } }
      };

      currentSession = session;
      localStorage.setItem('paddlehub_simulation_session', JSON.stringify(session));
      notifyAuthChange();

      return { data: { user: session.user, session }, error: null };
    },

    signOut: async () => {
      currentSession = null;
      localStorage.removeItem('paddlehub_simulation_session');
      sessionListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },

    getSession: async () => {
      return { data: { session: currentSession }, error: null };
    },

    getUser: async () => {
      return { data: { user: currentSession ? currentSession.user : null }, error: null };
    },

    onAuthStateChange: (callback) => {
      sessionListeners.add(callback);
      // Immediately call with current state
      callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              sessionListeners.delete(callback);
            }
          }
        }
      };
    }
  },

  from: (table) => {
    return new QueryBuilder(table);
  },

  rpc: async (name, params) => {
    const db = getInitialDB();
    const now = new Date();

    if (name === 'create_booking_hold_auto') {
      const {
        p_date,
        p_start_hour,
        p_duration_hours,
        p_notes,
        p_paddles,
        p_balls,
        p_court_count,
        p_trainer_hours,
        p_trainer_heads,
        p_contact_phone,
        p_court_ids
      } = params;

      // Authenticate
      if (!currentSession) {
        return { data: null, error: { message: "Unauthorized: Please log in" } };
      }
      const userId = currentSession.user.id;

      // Basic validations
      if (!p_contact_phone) {
        return { data: null, error: { message: "Validation Error: Phone is required" } };
      }
      if (p_start_hour + p_duration_hours > 24) {
        return { data: null, error: { message: "Validation Error: Booking cannot exceed midnight" } };
      }

      // 1. Gather all free courts
      const activeCourts = db.courts.filter(c => c.is_active);
      const freeCourts = [];

      for (const court of activeCourts) {
        // check overlap against bookings
        const overlapsBooking = db.bookings.some(b => 
          b.court_id === court.id &&
          b.date === p_date &&
          b.status !== 'cancelled' &&
          !( (b.start_hour + b.duration_hours <= p_start_hour) || (b.start_hour >= p_start_hour + p_duration_hours) )
        );

        // check overlap against blocks
        const overlapsBlock = db.blocked_slots.some(bs =>
          bs.court_id === court.id &&
          bs.date === p_date &&
          !( (bs.start_hour + bs.duration_hours <= p_start_hour) || (bs.start_hour >= p_start_hour + p_duration_hours) )
        );

        if (!overlapsBooking && !overlapsBlock) {
          freeCourts.push(court);
        }
      }

      // Sort by name
      freeCourts.sort((a, b) => a.name.localeCompare(b.name));

      if (freeCourts.length < p_court_count) {
        return { data: null, error: { message: "Collision Error: Not enough courts available" } };
      }

      // Pricing math
      const dateObj = new Date(`${p_date}T00:00:00`);
      const day = dateObj.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
      const isMonThurs = day >= 1 && day <= 4;

      let singleCourtPrice = 0;
      for (let i = 0; i < p_duration_hours; i++) {
        const hour = (p_start_hour + i) % 24;
        const isPromoTime = isMonThurs && hour >= 6 && hour < 12;
        if (isPromoTime) {
          singleCourtPrice += 300;
        } else {
          singleCourtPrice += 600;
        }
      }

      const extrasPrice = (p_paddles * 100) + (p_balls * 100) + (p_trainer_hours * p_trainer_heads * 500);

      const createdBookings = [];
      for (let i = 0; i < p_court_count; i++) {
        const court = freeCourts[i];
        const isFirst = i === 0;
        const price = singleCourtPrice + (isFirst ? extrasPrice : 0);
        
        const newBooking = {
          id: `booking-hold-${Math.random().toString(36).substring(2, 9)}`,
          user_id: userId,
          court_id: court.id,
          date: p_date,
          start_hour: p_start_hour,
          duration_hours: p_duration_hours,
          total_price: price,
          status: 'processing',
          notes: p_notes,
          contact_phone: p_contact_phone,
          payment_method_id: null,
          payment_sender_name: null,
          payment_reference: null,
          payment_sender_platform: null,
          payment_collected: false,
          created_at: new Date().toISOString()
        };

        db.bookings.push(newBooking);
        createdBookings.push({
          booking_id: newBooking.id,
          court_id: court.id,
          total_price: price
        });
      }

      commitDB(db);
      return { data: createdBookings, error: null };
    }

    if (name === 'run_booking_maintenance' || name === 'refresh_booking_statuses') {
      // confirmed past -> completed
      // processing 30m unpaid -> cancelled
      let changed = false;
      const ManilaNow = new Date();

      db.bookings = db.bookings.map(b => {
        if (b.status === 'confirmed') {
          const endDateTime = new Date(`${b.date}T${String(b.start_hour + b.duration_hours).padStart(2, '0')}:00:00`);
          if (endDateTime < ManilaNow) {
            changed = true;
            return { ...b, status: 'completed' };
          }
        }
        if (b.status === 'processing' && !b.payment_reference) {
          const created = new Date(b.created_at);
          if (ManilaNow.getTime() - created.getTime() > 30 * 60 * 1000) {
            changed = true;
            return { ...b, status: 'cancelled' };
          }
        }
        return b;
      });

      if (changed) commitDB(db);
      return { data: true, error: null };
    }

    return { data: null, error: { message: `Simulated RPC ${name} not implemented` } };
  }
};

// Query Builder to mimic Supabase chainable syntax
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.limitVal = null;
    this.orderByVal = null;
    this.action = 'select'; // 'select', 'insert', 'update', 'delete'
    this.actionPayload = null;
  }

  select(cols = "*") {
    this.action = 'select';
    return this;
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  neq(col, val) {
    this.filters.push({ type: 'neq', col, val });
    return this;
  }

  in(col, array) {
    this.filters.push({ type: 'in', col, val: array });
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderByVal = { col, ascending };
    return this;
  }

  limit(count) {
    this.limitVal = count;
    return this;
  }

  insert(payload) {
    this.action = 'insert';
    this.actionPayload = payload;
    return this;
  }

  update(payload) {
    this.action = 'update';
    this.actionPayload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async then(resolve) {
    const db = getInitialDB();
    
    if (!db[this.table]) {
      resolve({ data: null, error: { message: `Table ${this.table} not found` } });
      return;
    }

    const filterFn = (row) => {
      return this.filters.every(filter => {
        if (filter.type === 'eq') return row[filter.col] === filter.val;
        if (filter.type === 'neq') return row[filter.col] !== filter.val;
        if (filter.type === 'in') return filter.val.includes(row[filter.col]);
        return true;
      });
    };

    if (this.action === 'select') {
      let data = [...db[this.table]];
      data = data.filter(filterFn);

      if (this.orderByVal) {
        const { col, ascending } = this.orderByVal;
        data.sort((a, b) => {
          const valA = a[col];
          const valB = b[col];
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitVal) {
        data = data.slice(0, this.limitVal);
      }

      resolve({ data, error: null });
      return;
    }

    if (this.action === 'insert') {
      const payload = this.actionPayload;
      const rows = Array.isArray(payload) ? payload : [payload];
      const inserted = [];

      for (const r of rows) {
        const newRow = {
          id: r.id || `${this.table.substring(0, 3)}-${Math.random().toString(36).substring(2, 9)}`,
          created_at: new Date().toISOString(),
          ...r
        };
        db[this.table].push(newRow);
        inserted.push(newRow);
      }

      commitDB(db);
      resolve({ data: Array.isArray(payload) ? inserted : inserted[0], error: null });
      return;
    }

    if (this.action === 'update') {
      const payload = this.actionPayload;
      let updatedRows = [];
      
      db[this.table] = db[this.table].map(row => {
        if (filterFn(row)) {
          const updated = { ...row, ...payload };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      commitDB(db);
      resolve({ data: updatedRows, error: null });
      return;
    }

    if (this.action === 'delete') {
      const deleted = [];
      db[this.table] = db[this.table].filter(row => {
        if (filterFn(row)) {
          deleted.push(row);
          return false;
        }
        return true;
      });

      commitDB(db);
      resolve({ data: deleted, error: null });
      return;
    }
  }
}

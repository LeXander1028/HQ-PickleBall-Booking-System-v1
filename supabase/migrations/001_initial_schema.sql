-- Migration 001: Initial Schema & RLS Rules
-- Setup profiles, courts, bookings, blocked_slots, payment_methods, open_play_posts, open_play_rsvps, notifications.

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create courts table
CREATE TABLE IF NOT EXISTS public.courts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  qr_image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  court_id TEXT REFERENCES public.courts(id) ON DELETE RESTRICT NOT NULL,
  date DATE NOT NULL,
  start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  duration_hours INT NOT NULL CHECK (duration_hours > 0 AND duration_hours <= 24),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  status TEXT DEFAULT 'processing' NOT NULL CHECK (status IN ('processing', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  contact_phone TEXT NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_sender_name TEXT,
  payment_reference TEXT,
  payment_sender_platform TEXT,
  payment_collected BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Prevent overlap at database level
  -- Note: GiST requires btree_gist extension for mixing Scalar and Ranges.
  -- To keep standard SQL compatible, we can enforce uniqueness via procedures or custom check triggers.
  CONSTRAINT check_booking_boundary CHECK (start_hour + duration_hours <= 24)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id TEXT REFERENCES public.courts(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  duration_hours INT NOT NULL CHECK (duration_hours > 0 AND duration_hours <= 24),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Create open_play_posts table
CREATE TABLE IF NOT EXISTS public.open_play_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  duration_hours INT NOT NULL CHECK (duration_hours > 0),
  skill_level TEXT NOT NULL,
  reclub_url TEXT NOT NULL,
  image_url TEXT,
  blocked_slot_id UUID REFERENCES public.blocked_slots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.open_play_posts ENABLE ROW LEVEL SECURITY;

-- Create open_play_rsvps table
CREATE TABLE IF NOT EXISTS public.open_play_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.open_play_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(profile_id, post_id)
);

ALTER TABLE public.open_play_rsvps ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES --

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Profiles Policies
CREATE POLICY "Public profiles read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile except role" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- block role change
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Courts Policies
CREATE POLICY "Public courts read access" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Admins can manage courts" ON public.courts ALL USING (public.is_admin());

-- Payment Methods Policies
CREATE POLICY "Public payment methods read access" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods ALL USING (public.is_admin());

-- Bookings Policies
CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own processing bookings" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'processing')
  WITH CHECK (auth.uid() = user_id AND status = 'processing');
CREATE POLICY "Admins can manage all bookings" ON public.bookings ALL
  USING (public.is_admin());

-- Blocked Slots Policies
CREATE POLICY "Public can read blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots ALL USING (public.is_admin());

-- Open Play Policies
CREATE POLICY "Public can read open play posts" ON public.open_play_posts FOR SELECT USING (true);
CREATE POLICY "Admins can manage open play posts" ON public.open_play_posts ALL USING (public.is_admin());

-- Open Play RSVPs Policies
CREATE POLICY "Users can read all RSVPs" ON public.open_play_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP for themselves" ON public.open_play_rsvps ALL
  USING (auth.uid() = profile_id OR public.is_admin());

-- Notifications Policies
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- Profile Sync Trigger (from Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, address, onboarding_completed, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Player'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    false,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default courts
INSERT INTO public.courts (id, name, is_active) VALUES
  ('court-1', 'Court 1', true),
  ('court-2', 'Court 2', true),
  ('court-3', 'Court 3', true)
ON CONFLICT (id) DO NOTHING;

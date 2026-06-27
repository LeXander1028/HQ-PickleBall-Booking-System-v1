import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { VENUE_INFO } from '../lib/constants';
import { ShieldCheck, MapPin, Compass, Award, Activity } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen text-slate-300">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8 text-center flex flex-col items-center justify-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col items-center max-w-3xl gap-6 z-10">
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-slate-900 flex items-center justify-center p-2.5 border border-white/10 shadow-2xl mb-2 animate-bounce">
            <img src={logo} alt="HQ Pickleball Logo" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-tight">
            Elevate Your <span className="text-emerald-400">Pickleball</span> Game at HQ Cebu
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Welcome to **HQ Pickleball Cebu** – your premium pickleball destination in the heart of Cebu’s central business district! Located at the Grand Convention Center of Cebu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
            <Link
              to={user ? "/book" : "/login"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base transition-all shadow-[0_0_20px_rgba(162,252,42,0.3)] glow-emerald"
            >
              Book a Court Now
            </Link>
            <Link
              to={user ? "/home" : "/login"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-slate-900/50 hover:bg-slate-900 text-white font-semibold transition-all"
            >
              Player Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-center text-white mb-12">
          Why Choose HQ Pickleball Cebu?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
            <h3 className="font-display font-bold text-white text-lg">9 Covered Courts (Expansion)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Currently featuring 3 outdoor courts, expanding to 9 covered courts coming March 2026. Tented, high ceilings for year-round play rain or shine.
            </p>
          </div>

          <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Compass size={20} />
            </div>
            <h3 className="font-display font-bold text-white text-lg">Prime Central Location</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Located at the Grand Convention Center of Cebu, Archbishop Reyes Ave. Convenient parking space and easy drop-in access before or after office hours.
            </p>
          </div>

          <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="font-display font-bold text-white text-lg">Complete Play Features</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Certified trainers coaching up to 30 players, pro paddle rentals, premium balls, and active community RSVP events.
            </p>
          </div>
        </div>
      </section>

      {/* Hourly Rates section */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto w-full text-center">
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white mb-4">
          Court Rates
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-10">
          Open 24/7 — simple flat pricing per court per hour. Plus a special weekday morning promo!
        </p>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 text-sm">
          <div className="grid grid-cols-2 p-4 font-semibold text-slate-400 uppercase tracking-wider text-xs bg-slate-950/40">
            <span>Rate Type</span>
            <span>Price</span>
          </div>
          <div className="grid grid-cols-2 p-4 items-center bg-emerald-500/5">
            <span className="text-white font-medium flex flex-col items-start">
              <span className="text-emerald-400 font-bold">Mon–Thurs Promo</span>
              <span className="text-[10px] text-slate-500 mt-0.5">6:00 AM – 12:00 NN · Max 4 players per court</span>
            </span>
            <span className="text-emerald-400 font-bold text-base">₱300 / person / hr</span>
          </div>
          <div className="grid grid-cols-2 p-4 items-center">
            <span className="text-white font-medium flex flex-col items-start">
              <span>Standard Rate</span>
              <span className="text-[10px] text-slate-500 mt-0.5">All hours, all days · Open 24/7</span>
            </span>
            <span className="text-indigo-400 font-bold text-base">₱600 / court / hr</span>
          </div>
          <div className="grid grid-cols-2 p-4 items-center bg-slate-950/20">
            <span className="text-white font-medium flex flex-col items-start">
              <span>Court Capacity</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Per court</span>
            </span>
            <span className="text-white font-semibold">Max 4 players</span>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto w-full text-center">
        <div className="glass border border-white/5 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8 text-left">
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-2xl text-white">Visit Our Center</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We are located at the Grand Convention Center of Cebu. Drop in before work, during lunch, or after office hours to join the fastest-growing pickleball community in Cebu.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <MapPin size={16} />
              <span>{VENUE_INFO.address}</span>
            </div>
          </div>
          
          <div className="w-full md:w-72 shrink-0 h-44 rounded-xl overflow-hidden border border-white/10 relative">
            {/* Map Frame */}
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
              <span className="font-display font-extrabold text-sm text-white">HQ Location Map</span>
              <span className="text-[10px] text-slate-500 mt-1">Archbishop Reyes Ave., Cebu City</span>
              <a 
                href={VENUE_INFO.contact.googleMapsLink} 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all"
              >
                Open Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React from 'react';
import { VENUE_INFO } from '../lib/constants';
import { Store, MessageSquare, Compass, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function PopUpStore() {
  return (
    <div className="flex flex-col gap-10 py-12 px-4 md:px-8 text-left max-w-5xl mx-auto w-full relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="glass border border-white/10 rounded-3xl p-6 sm:p-10 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Clock size={13} /> 24hrs open
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Compass size={13} /> Archbishop Reyes Ave.
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight mt-2">
          Your pop-up store
        </h1>
        
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Cebu's pickleball community might just be the perfect market for your pop-up store!
        </p>

        <div className="border-t border-white/5 pt-6 mt-4">
          <a
            href={VENUE_INFO.contact.facebookMessage}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(162,252,42,0.3)] glow-emerald"
          >
            <MessageSquare size={16} /> Send us a DM for more details
          </a>
        </div>
      </section>

      {/* Highlights & Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Store size={20} />
          </div>
          <h3 className="font-display font-bold text-white text-lg">Prime Foot Traffic</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            HQ Pickleball Cebu hosts hundreds of players daily, ranging from business executives to passionate athletes, right in Cebu's business district.
          </p>
        </div>

        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-display font-bold text-white text-lg">Strategic Location</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Positioned at the Grand Convention Center of Cebu, Archbishop Reyes Ave. Highly accessible with ample safe parking.
          </p>
        </div>

        <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <h3 className="font-display font-bold text-white text-lg">24/7 Exposure</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Our venue is open 24 hours daily. Your pop-up store gets round-the-clock visibility from early morning enthusiasts to late-night players.
          </p>
        </div>
      </section>

      {/* Inquiry details */}
      <section className="glass border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
        <div>
          <h3 className="font-display font-bold text-white text-base">Looking for custom partnerships?</h3>
          <p className="text-xs text-slate-400 mt-1">We offer flexible space sizes, electricity connections, and banner sponsorships.</p>
        </div>
        <div className="text-xs text-slate-300">
          <p>Email us: <strong className="text-white">{VENUE_INFO.contact.email}</strong></p>
          <p className="mt-1">Call us: <strong className="text-white">{VENUE_INFO.contact.phone}</strong></p>
        </div>
      </section>
    </div>
  );
}

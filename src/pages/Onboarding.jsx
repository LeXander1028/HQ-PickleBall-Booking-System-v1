import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      
      // If onboarding is already completed, go to Home
      if (profile.onboarding_completed) {
        navigate('/home');
      }
    }
  }, [profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);

    if (!name.trim() || !phone.trim()) {
      setError("Full Name and Contact Phone are required.");
      setSubmitting(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 relative z-10 shadow-2xl text-left">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-bold">Step 1 of 1</span>
          <h2 className="font-display font-extrabold text-2xl text-white">COMPLETE YOUR PROFILE</h2>
          <p className="text-xs text-slate-400">
            We need your contact information to manage booking changes, verification updates, and trainer schedules.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-start">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="name">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="name"
                type="text"
                required
                placeholder="Juan Dela Cruz"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="phone">Contact Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="phone"
                type="tel"
                required
                placeholder="+63 917 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="address">Address (Optional)</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="address"
                type="text"
                placeholder="Consolacion, Cebu"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Save & Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

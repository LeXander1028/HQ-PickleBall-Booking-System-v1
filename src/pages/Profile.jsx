import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError("Name and Phone fields are required.");
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-8 px-4 md:px-8 text-left max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Profile Settings</h2>
        <p className="text-slate-400 text-sm">Keep your player profile details updated to ensure smooth bookings and verification.</p>
      </div>

      <div className="glass border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 relative shadow-2xl">
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-center">
            <CheckCircle size={16} className="shrink-0" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Readonly Account Info */}
          <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4 text-xs">
            <div>
              <span className="text-slate-500 block">Registered Email</span>
              <span className="font-medium text-white">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Account Role</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
                <Shield size={12} /> {profile?.role === 'admin' ? 'Administrator' : 'Player'}
              </span>
            </div>
          </div>

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
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none transition-all"
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
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="address">Mailing Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="address"
                type="text"
                placeholder="Consolacion, Cebu"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

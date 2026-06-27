import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, MapPin, Search, ShieldAlert, Award } from 'lucide-react';

export default function AdminUsers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const filteredProfiles = profiles.filter(p => {
    const term = searchQuery.toLowerCase();
    return !term ||
      p.name?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term) ||
      p.address?.toLowerCase().includes(term) ||
      p.id?.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8 text-left max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Registered Players Directory</h2>
        <p className="text-slate-400 text-sm">Read-only directory of all user accounts and contact information.</p>
      </div>

      {/* Search query input */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search players by name, phone, email/ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-white/5 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none"
        />
      </div>

      {/* Listings */}
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl p-12 text-center text-slate-500">
          No profiles matched the query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(p => (
            <div 
              key={p.id} 
              className="glass border border-white/5 rounded-2xl p-5 flex flex-col gap-4 text-left transition-all hover:border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Profile ID</span>
                  <span className="font-mono text-[10px] text-slate-400 select-all">{p.id}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  p.role === 'admin' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {p.role}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-slate-300 mt-2">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-emerald-400 shrink-0" />
                  <span className="font-medium text-white">{p.name || 'Anonymous User'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-emerald-400 shrink-0" />
                  <span>{p.phone || 'No phone registered'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-400 shrink-0" />
                  <span>{p.address || 'No address registered'}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-white/5 pt-3.5 mt-1 flex justify-between items-center">
                <span>Joined: {new Date(p.created_at).toLocaleDateString()}</span>
                {p.onboarding_completed ? (
                  <span className="text-emerald-400 font-medium">Onboarded</span>
                ) : (
                  <span className="text-amber-400 font-medium">Pending Onboard</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

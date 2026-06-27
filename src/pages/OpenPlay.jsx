import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Trophy, Calendar, Users, ExternalLink, Check } from 'lucide-react';

export default function OpenPlay() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOpenPlayData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch active posts
      const { data: postsData, error: postsError } = await supabase
        .from('open_play_posts')
        .select('*')
        .order('date', { ascending: true });

      if (postsError) throw postsError;

      // 2. Fetch user's RSVPs
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('open_play_rsvps')
        .select('*')
        .eq('profile_id', user.id);

      if (rsvpsError) throw rsvpsError;

      setPosts(postsData || []);
      setRsvps(rsvpsData || []);
    } catch (err) {
      console.error("Failed to load open play data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpenPlayData();
  }, [user]);

  const handleToggleRSVP = async (postId) => {
    const existing = rsvps.find(r => r.post_id === postId);

    try {
      if (existing) {
        // Delete RSVP
        const { error } = await supabase
          .from('open_play_rsvps')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        setRsvps(prev => prev.filter(r => r.id !== existing.id));
      } else {
        // Insert RSVP
        const { data, error } = await supabase
          .from('open_play_rsvps')
          .insert({
            profile_id: user.id,
            post_id: postId
          });

        if (error) throw error;
        if (data) {
          const inserted = Array.isArray(data) ? data[0] : data;
          setRsvps(prev => [...prev, inserted]);
        } else {
          // If no row is returned, reload to sync
          await loadOpenPlayData();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update RSVP: " + err.message);
    }
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour >= 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8 text-left max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Community Open Play</h2>
        <p className="text-slate-400 text-sm">Join local player sessions, match with matching skill levels, and RSVP below.</p>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <Trophy size={48} className="text-slate-600" />
          <h3 className="font-display font-bold text-white text-lg">No open play sessions</h3>
          <p className="text-sm text-slate-400 max-w-sm">There are no community sessions scheduled right now. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(post => {
            const hasRSVP = rsvps.some(r => r.post_id === post.id);
            const timeRange = `${formatHour(post.start_hour)} - ${formatHour(post.start_hour + post.duration_hours)}`;

            return (
              <div 
                key={post.id} 
                className="glass border border-white/5 rounded-2xl overflow-hidden flex flex-col text-left transition-all hover:border-white/10 shadow-lg"
              >
                {/* Visual Header */}
                <div className="h-44 bg-slate-900 border-b border-white/5 relative overflow-hidden flex items-center justify-center">
                  {post.image_url ? (
                    <img 
                      src={post.image_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 opacity-70" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider">
                      {post.skill_level}
                    </span>
                    <h3 className="font-display font-bold text-white text-lg mt-1.5 leading-tight">{post.title}</h3>
                  </div>
                </div>

                {/* Details Panel */}
                <div className="p-5 flex flex-col gap-4 flex-grow justify-between">
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-400" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-400" />
                      <span>{timeRange}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2.5 mt-2 border-t border-white/5 pt-4">
                    <a
                      href={post.reclub_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl border border-white/5 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      RSVP on Reclub <ExternalLink size={12} />
                    </a>

                    <button
                      onClick={() => handleToggleRSVP(post.id)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        hasRSVP
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                      }`}
                    >
                      {hasRSVP ? (
                        <>
                          <Check size={14} /> Attending
                        </>
                      ) : (
                        "Mark RSVP Locally"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

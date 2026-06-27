import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { VENUE_INFO } from '../../lib/constants';
import { Trophy, Plus, Trash2, Calendar, Clock, Link as LinkIcon, Lock } from 'lucide-react';

export default function AdminOpenPlay() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState(17);
  const [duration, setDuration] = useState(3);
  const [skillLevel, setSkillLevel] = useState('All Levels (1.0 - 5.0)');
  const [reclubUrl, setReclubUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Optional blockout
  const [lockCourt, setLockCourt] = useState(false);
  const [blockCourtId, setBlockCourtId] = useState('court-3');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('open_play_posts')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const handleAddPost = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!title.trim() || !reclubUrl.trim()) {
      setError("Title and Reclub RSVP Link are required.");
      setSubmitting(false);
      return;
    }

    try {
      let blockedSlotId = null;

      // 1. If lock court is toggled, insert blocked_slots first
      if (lockCourt) {
        const blockReason = `Open Play: ${title.trim()}`;
        const { data: blockData, error: blockError } = await supabase
          .from('blocked_slots')
          .insert({
            court_id: blockCourtId,
            date,
            start_hour: startHour,
            duration_hours: duration,
            reason: blockReason
          });

        if (blockError) throw blockError;

        // Fetch inserted block id (handles arrays in supabase simulation / real postgrest return)
        if (blockData) {
          const insertedBlock = Array.isArray(blockData) ? blockData[0] : blockData;
          blockedSlotId = insertedBlock.id;
        } else {
          // Fallback fetch in case inserts don't return rows (real RLS or Postgrest settings)
          const { data: checkBlocks } = await supabase
            .from('blocked_slots')
            .select('id')
            .eq('court_id', blockCourtId)
            .eq('date', date)
            .eq('start_hour', startHour);
          if (checkBlocks && checkBlocks.length > 0) {
            blockedSlotId = checkBlocks[0].id;
          }
        }
      }

      // 2. Insert Open Play Post
      const { error: postError } = await supabase
        .from('open_play_posts')
        .insert({
          title: title.trim(),
          date,
          start_hour: startHour,
          duration_hours: duration,
          skill_level: skillLevel,
          reclub_url: reclubUrl.trim(),
          image_url: imageUrl.trim() || null,
          blocked_slot_id: blockedSlotId
        });

      if (postError) {
        // Rollback block if post fails
        if (blockedSlotId) {
          await supabase.from('blocked_slots').delete().eq('id', blockedSlotId);
        }
        throw postError;
      }

      // Reset
      setTitle('');
      setReclubUrl('');
      setImageUrl('');
      setLockCourt(false);
      
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create Open Play post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id, blockedSlotId) => {
    if (!window.confirm("Are you sure you want to delete this Open Play post? If court hours were blocked, they will automatically be unblocked.")) return;
    
    try {
      // 1. Delete Post
      const { error: postError } = await supabase
        .from('open_play_posts')
        .delete()
        .eq('id', id);

      if (postError) throw postError;

      // 2. If it had a linked block, delete the block slot
      if (blockedSlotId) {
        await supabase
          .from('blocked_slots')
          .delete()
          .eq('id', blockedSlotId);
      }

      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Failed to delete post: " + err.message);
    }
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour >= 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8 text-left max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Manage Open Play Sessions</h2>
        <p className="text-slate-400 text-sm">Publish community matches feed posts and automatically synchronize linked court bookings blocks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ADD FORM */}
        <form onSubmit={handleAddPost} className="glass border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-1.5">
            <Trophy size={16} className="text-emerald-400" /> Publish Open Play Post
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Sunday Social Singles"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Event Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Skill Level</label>
              <input
                type="text"
                required
                placeholder="e.g. Intermediate (3.0+)"
                value={skillLevel}
                onChange={e => setSkillLevel(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2 text-xs text-white placeholder-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Start Hour</label>
              <select
                value={startHour}
                onChange={e => setStartHour(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2 text-xs text-white"
              >
                {Array.from({ length: 24 }, (_, i) => i).map(h => (
                  <option key={h} value={h}>{h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Duration (hrs)</label>
              <select
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5, 6].map(d => (
                  <option key={d} value={d}>{d} Hr{d > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Reclub RSVP Link</label>
            <input
              type="url"
              required
              placeholder="https://reclub.co/events/..."
              value={reclubUrl}
              onChange={e => setReclubUrl(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Banner Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-700 focus:outline-none"
            />
          </div>

          {/* Conditional Lock Court */}
          <div className="border border-white/5 rounded-lg p-3 bg-slate-950/40 mt-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-white font-semibold block">Block Court Slot?</span>
                <span className="text-[10px] text-slate-500">Locks court during event</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockCourt}
                  onChange={e => setLockCourt(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950" />
              </label>
            </div>

            {lockCourt && (
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2 text-left animate-in slide-in-from-top-2 duration-150">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Court to Block</label>
                <select
                  value={blockCourtId}
                  onChange={e => setBlockCourtId(e.target.value)}
                  className="bg-slate-900 border border-white/5 rounded p-1.5 text-xs text-white"
                >
                  {VENUE_INFO.courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer mt-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={14} /> Publish Post
              </>
            )}
          </button>
        </form>

        {/* FEED DIRECTORY (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-display font-bold text-white text-base">Active Open Plays ({posts.length})</h3>

          {loading ? (
            <div className="py-12 flex items-center justify-center glass border border-white/5 rounded-2xl">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="glass border border-white/5 rounded-2xl p-8 text-center text-slate-500">
              No open play sessions scheduled.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map(p => (
                <div key={p.id} className="glass border border-white/5 rounded-xl p-4 flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-1 text-left">
                    <h4 className="font-bold text-white text-sm">{p.title}</h4>
                    <p className="text-slate-400">
                      <Calendar size={12} className="inline text-emerald-400 mr-1" /> {p.date} · 
                      <Clock size={12} className="inline text-emerald-400 mr-1" /> {formatHour(p.start_hour)} - {formatHour(p.start_hour + p.duration_hours)}
                    </p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400 font-bold text-[9px]">
                        {p.skill_level}
                      </span>
                      {p.blocked_slot_id && (
                        <span className="text-rose-400 flex items-center gap-0.5 text-[10px]">
                          <Lock size={10} /> Court Locked
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(p.id, p.blocked_slot_id)}
                    className="p-2 rounded-lg bg-slate-900 border border-white/5 text-rose-400 hover:text-white hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

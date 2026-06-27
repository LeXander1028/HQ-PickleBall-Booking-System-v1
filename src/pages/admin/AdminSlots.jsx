import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { VENUE_INFO } from '../../lib/constants';
import { Layers, Plus, Trash2, Calendar, Clock, Lock } from 'lucide-react';

export default function AdminSlots() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [courtId, setCourtId] = useState('court-1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState(8);
  const [duration, setDuration] = useState(2);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function loadBlocks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_slots')
        .select('*')
        .order('date', { ascending: false })
        .order('start_hour', { ascending: true });

      if (!error && data) {
        setBlocks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleAddBlock = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (startHour + duration > 24) {
      setError("Boundary Error: Block hours cannot exceed midnight.");
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blocked_slots')
        .insert({
          court_id: courtId,
          date,
          start_hour: startHour,
          duration_hours: duration,
          reason: reason.trim() || 'Court Maintenance'
        });

      if (error) throw error;

      setReason('');
      await loadBlocks();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to block slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id) => {
    if (!window.confirm("Are you sure you want to remove this block? The slot will immediately become open for booking.")) return;
    try {
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert("Failed to delete block: " + err.message);
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
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Blocked Court Hours</h2>
        <p className="text-slate-400 text-sm">Lock court availability for routine cleaning, coaching classes, or special tournaments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* BLOCK INPUT FORM (1/3 width) */}
        <form onSubmit={handleAddBlock} className="glass border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-1.5">
            <Lock size={16} className="text-rose-400" /> Create Blockout Slot
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Select Court</label>
            <select
              value={courtId}
              onChange={e => setCourtId(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white"
            >
              {VENUE_INFO.courts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Block Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Start Hour</label>
              <select
                value={startHour}
                onChange={e => setStartHour(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white"
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
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white"
              >
                {[1, 2, 3, 4, 6, 8, 12, 24].map(d => (
                  <option key={d} value={d}>{d} Hr{d > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Reason</label>
            <input
              type="text"
              placeholder="e.g. Tournament Match"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer mt-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={14} /> Add Blockout
              </>
            )}
          </button>
        </form>

        {/* BLOCKS DIRECTORY (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-1.5">
            <Layers size={16} className="text-emerald-400" /> Active Blockouts ({blocks.length})
          </h3>

          {loading ? (
            <div className="py-12 flex items-center justify-center glass border border-white/5 rounded-2xl">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="glass border border-white/5 rounded-2xl p-8 text-center text-slate-500">
              No blocked slots scheduled.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {blocks.map(b => (
                <div key={b.id} className="glass border border-white/5 rounded-xl p-4 flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-1 text-left">
                    <h4 className="font-bold text-white text-sm">Court {b.court_id.replace('court-', '')}</h4>
                    <p className="text-slate-400 flex items-center gap-1">
                      <Calendar size={12} className="text-emerald-400" /> {b.date} · 
                      <Clock size={12} className="text-emerald-400" /> {formatHour(b.start_hour)} - {formatHour(b.start_hour + b.duration_hours)}
                    </p>
                    <span className="text-slate-500 font-medium">Reason: {b.reason}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(b.id)}
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

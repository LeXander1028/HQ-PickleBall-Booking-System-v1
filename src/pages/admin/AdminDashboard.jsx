import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, CircleDollarSign, CalendarDays, UsersRound, RefreshCw, Layers } from 'lucide-react';
import { getAdminBookingCategory } from '../../utils/bookingStatus';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    pendingPaymentsCount: 0,
    confirmedBookingsCount: 0,
    activeBlockCount: 0
  });
  const [chartData, setChartData] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadAdminDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      if (bookingsError) throw bookingsError;

      // 2. Fetch blocked slots
      const { data: blocks, error: blocksError } = await supabase
        .from('blocked_slots')
        .select('*');

      if (blocksError) throw blocksError;

      // Calculate KPI metrics
      let totalEarnings = 0;
      let pendingPaymentsCount = 0;
      let confirmedBookingsCount = 0;

      const monthlyBuckets = {};

      if (bookings) {
        bookings.forEach(b => {
          const category = getAdminBookingCategory(b);
          
          if (category === 'confirmed' || category === 'completed') {
            totalEarnings += Number(b.total_price || 0);
            confirmedBookingsCount++;
          }
          if (category === 'paid_verify') {
            pendingPaymentsCount++;
          }

          // Build month buckets for Recharts chart
          if (b.status === 'confirmed' || b.status === 'completed') {
            const dateObj = new Date(b.date);
            const monthName = dateObj.toLocaleString('default', { month: 'short' });
            monthlyBuckets[monthName] = (monthlyBuckets[monthName] || 0) + Number(b.total_price || 0);
          }
        });
      }

      setMetrics({
        totalEarnings,
        pendingPaymentsCount,
        confirmedBookingsCount,
        activeBlockCount: blocks ? blocks.length : 0
      });

      // Format chart data
      const formattedChart = Object.keys(monthlyBuckets).map(month => ({
        name: month,
        earnings: monthlyBuckets[month]
      }));

      // Fallback data if empty to display chart
      setChartData(formattedChart.length > 0 ? formattedChart : [
        { name: 'Jan', earnings: 4000 },
        { name: 'Feb', earnings: 6000 },
        { name: 'Mar', earnings: 8500 },
        { name: 'Apr', earnings: 12000 },
        { name: 'May', earnings: 9000 },
        { name: 'Jun', earnings: totalEarnings || 15000 }
      ]);

    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  }

  // Trigger RPC maintenance and reload
  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      // In simulation mode or live mode, we invoke maintenance RPC
      await supabase.rpc('refresh_booking_statuses');
      await loadAdminDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Refresh status and load on page open
    handleTriggerSync();
  }, []);

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8 text-left max-w-6xl mx-auto w-full">
      {/* Header section */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Operator Dashboard</h2>
          <p className="text-slate-400 text-sm">Real-time scheduling metrics and payment audit stats.</p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="p-2.5 rounded-xl border border-white/5 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync Statuses"}
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* KPI grid cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Earnings</span>
                <span className="font-display font-bold text-emerald-400 text-2xl">₱{metrics.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <CircleDollarSign size={20} />
              </div>
            </div>

            <div className="glass border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Verification Queue</span>
                <span className={`font-display font-bold text-2xl ${metrics.pendingPaymentsCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {metrics.pendingPaymentsCount} holds
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.pendingPaymentsCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-900 text-slate-500'}`}>
                <ShieldAlert size={20} />
              </div>
            </div>

            <div className="glass border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Confirmed Sales</span>
                <span className="font-display font-bold text-white text-2xl">{metrics.confirmedBookingsCount} bookings</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <CalendarDays size={20} />
              </div>
            </div>

            <div className="glass border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Blocked Courts</span>
                <span className="font-display font-bold text-white text-2xl">{metrics.activeBlockCount} slots</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <Layers size={20} />
              </div>
            </div>
          </div>

          {/* Alert panel for pending payments */}
          {metrics.pendingPaymentsCount > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <p className="text-xs text-amber-400">
                You have <strong>{metrics.pendingPaymentsCount} court reservations</strong> awaiting e-wallet payment audit checks.
              </p>
              <a 
                href="/admin/bookings" 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-all text-center"
              >
                Go to Verification Queue
              </a>
            </div>
          )}

          {/* Revenue Chart Visuals */}
          <div className="glass border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-1.5">
              Revenue Visualizer <span className="text-[10px] uppercase font-bold text-slate-500 font-sans tracking-widest bg-slate-900 px-2 py-0.5 rounded">Sales Breakdown</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="earnings" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Mail, Lock, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!name || !phone) {
          throw new Error("Name and contact phone are required.");
        }
        await signup(email, password, name, phone, address);
        // After signup, user is logged in
        navigate('/home');
      } else {
        await login(email, password);
        navigate('/home');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-6 relative z-10 shadow-2xl">
        {/* Branding logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center p-1.5 border border-white/10 shadow-lg">
            <img src={logo} alt="PaddleHub Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white tracking-wider">
            {isSignUp ? "CREATE PLAYER PROFILE" : "SIGN IN TO PLAY"}
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            {isSignUp ? "Join the PaddleHub family" : "Reserve courts and view schedules"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="w-full p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-start text-left">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                placeholder="player@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
            {/* Quick-fill helper for simulation mode */}
            {!isSignUp && (
              <span className="text-[10px] text-slate-500 mt-1">
                Demo emails: <button type="button" onClick={() => { setEmail('player@paddlehub.ph'); setPassword('password'); }} className="text-emerald-400 underline">player@paddlehub.ph</button> (User) or <button type="button" onClick={() => { setEmail('admin@paddlehub.ph'); setPassword('password'); }} className="text-emerald-400 underline">admin@paddlehub.ph</button> (Admin)
              </span>
            )}
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="password">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* SignUp conditional inputs */}
          {isSignUp && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
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
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              "Complete Register"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Toggle between Log In and Register */}
        <div className="w-full text-center text-xs text-slate-500 border-t border-white/5 pt-4">
          {isSignUp ? (
            <span>
              Already have a profile?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New player?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Register Here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

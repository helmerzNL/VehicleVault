import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';

export const Register: React.FC = () => {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, user, authDisabled } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user || authDisabled) {
      navigate('/', { replace: true });
    }
  }, [user, authDisabled, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(lang === 'nl' ? 'Wachtwoord moet minimaal 8 tekens lang zijn' : 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError(lang === 'nl' ? 'Wachtwoorden komen niet overeen' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || (lang === 'nl' ? 'Registratie mislukt' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))] pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] relative overflow-hidden text-slate-100">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <img src="/icon-512.png" alt="VehicleVault" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {lang === 'nl' ? 'Account Aanmaken' : 'Create Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center">
            {lang === 'nl'
              ? 'Het eerste geregistreerde account krijgt automatisch beheerdersrechten.'
              : 'The first registered user is automatically granted administrator privileges.'}
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs p-3.5 rounded-2xl mb-5 font-medium shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">{lang === 'nl' ? 'E-mailadres' : 'Email Address'}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bestuurder@voorbeeld.nl"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 font-medium transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">{lang === 'nl' ? 'Wachtwoord' : 'Password'}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'nl' ? 'Minimaal 8 tekens' : 'At least 8 characters'}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">{lang === 'nl' ? 'Bevestig Wachtwoord' : 'Confirm Password'}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={lang === 'nl' ? 'Herhaal wachtwoord' : 'Repeat password'}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/60 hover:scale-[1.01] mt-3"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            <span>{loading ? (lang === 'nl' ? 'Aanmaken...' : 'Creating...') : (lang === 'nl' ? 'Account Aanmaken' : 'Create Account')}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
          <span>{lang === 'nl' ? 'Al een account? ' : 'Already have an account? '}</span>
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold inline-flex items-center space-x-1">
            <span>{lang === 'nl' ? 'Inloggen' : 'Sign in'}</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
};

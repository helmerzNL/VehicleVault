import React, { useState } from 'react';
import { X, Mail, Lock, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface ConvertGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConvertGuestModal: React.FC<ConvertGuestModalProps> = ({ isOpen, onClose }) => {
  const { convertGuestAccount } = useAuth();
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(
        lang === 'nl'
          ? 'Wachtwoord moet minimaal 8 tekens lang zijn.'
          : 'Password must be at least 8 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(lang === 'nl' ? 'Wachtwoorden komen niet overeen.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await convertGuestAccount(email, password);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || (lang === 'nl' ? 'Opslaan mislukt. Probeer opnieuw.' : 'Save failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center safe-overlay bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'nl' ? 'Proefaccount Opslaan' : 'Save Trial Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'nl' ? 'Behoud al je voertuigen en data' : 'Keep all your vehicles and data'}
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'nl' ? 'Account succesvol opgeslagen!' : 'Account successfully saved!'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {lang === 'nl'
                ? 'Je bent nu een permanente gebruiker. Je kunt voortaan met je eigen e-mail en wachtwoord inloggen.'
                : 'You are now a permanent user. You can sign in with your email and password from now on.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              {lang === 'nl'
                ? 'Kies je persoonlijke e-mailadres en een veilig wachtwoord. Alle auto’s, ritten en gegevens die je zojuist hebt ingevoerd blijven gekoppeld.'
                : 'Choose your personal email address and a password. All vehicles, trips, and logs created in this trial session will remain saved.'}
            </p>

            {error && (
              <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {lang === 'nl' ? 'Je E-mailadres' : 'Your Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {lang === 'nl' ? 'Wachtwoord (min. 8 tekens)' : 'Password (min. 8 chars)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {lang === 'nl' ? 'Wachtwoord Bevestigen' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
              >
                {lang === 'nl' ? 'Later' : 'Later'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 flex items-center space-x-2 shadow-md shadow-emerald-950/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{lang === 'nl' ? 'Account Opslaan' : 'Save Account'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


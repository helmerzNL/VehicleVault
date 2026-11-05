import React from 'react';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';

interface TwoFactorLoginFormProps {
  twoFactorCode: string;
  setTwoFactorCode: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  lang: string;
}

export const TwoFactorLoginForm: React.FC<TwoFactorLoginFormProps> = ({
  twoFactorCode,
  setTwoFactorCode,
  onSubmit,
  onCancel,
  loading,
  lang,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div className="bg-sky-950/50 border border-sky-500/30 p-4 rounded-2xl text-sky-200 space-y-1">
        <div className="flex items-center space-x-2 font-bold text-sky-300">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>{lang === 'nl' ? 'Tweefactorauthenticatie (2FA)' : 'Two-Factor Authentication'}</span>
        </div>
        <p className="text-[11px] text-sky-300/80 leading-relaxed">
          {lang === 'nl'
            ? 'Voer de 6-cijferige verificatiecode of een 8-tekens herstelcode in.'
            : 'Enter the 6-digit code from your authenticator app or recovery code.'}
        </p>
      </div>

      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">
          {lang === 'nl' ? 'Verificatiecode' : 'Verification Code'}
        </label>
        <input
          type="text"
          required
          autoFocus
          autoComplete="one-time-code"
          value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value)}
          placeholder="123456"
          className="w-full bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-3 text-center font-mono text-lg font-bold tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition shadow-inner"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !twoFactorCode.trim()}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 hover:scale-[1.01]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        <span>{loading ? (lang === 'nl' ? 'Verifiëren...' : 'Verifying...') : (lang === 'nl' ? 'Verifieer & Inloggen' : 'Verify & Continue')}</span>
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{lang === 'nl' ? 'Terug naar inloggen' : 'Back to login'}</span>
      </button>
    </form>
  );
};


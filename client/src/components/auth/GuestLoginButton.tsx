import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface GuestLoginButtonProps {
  onError: (err: string) => void;
}

export const GuestLoginButton: React.FC<GuestLoginButtonProps> = ({ onError }) => {
  const { loginAsGuest, allowGuestAccess } = useAuth();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);

  if (!allowGuestAccess) {
    return null;
  }

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (err: any) {
      onError(
        err?.message ||
          (lang === 'nl'
            ? 'Gasttoegang starten mislukt. Probeer opnieuw.'
            : 'Starting guest access failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={loading}
        className="group relative w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-sky-500/15 hover:from-amber-500/25 hover:via-emerald-500/25 hover:to-sky-500/25 border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 shadow-md hover:shadow-lg text-left flex items-center justify-between overflow-hidden"
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-sm shrink-0">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>{lang === 'nl' ? 'Direct Proberen (Gasttoegang)' : 'Try Instantly (Guest Access)'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1-Klik
              </span>
            </div>
            <div className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
              {lang === 'nl'
                ? 'Geen registratie vereist • Schone eigen garage'
                : 'No registration required • Private trial garage'}
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
      </button>
    </div>
  );
};


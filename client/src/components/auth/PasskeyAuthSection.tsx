import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface PasskeyAuthSectionProps {
  onPasskeyLogin: () => void;
  onRecoveryLogin: (code: string) => void;
  loading: boolean;
  passkeyAvailable: boolean;
}

export const PasskeyAuthSection: React.FC<PasskeyAuthSectionProps> = ({
  onPasskeyLogin,
  onRecoveryLogin,
  loading,
  passkeyAvailable,
}) => {
  const { t, lang } = useLanguage();
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCode.trim()) {
      onRecoveryLogin(recoveryCode.trim());
    }
  };

  return (
    <>
      {passkeyAvailable && (
        <div className="mb-5">
          <button
            type="button"
            onClick={onPasskeyLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white rounded-2xl font-bold text-xs transition duration-200 flex items-center justify-center space-x-2.5 shadow-lg group"
          >
            <Fingerprint className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>{t('loginWithPasskey')} (FaceID / TouchID / Windows Hello)</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-slate-950/90 px-3 text-slate-500">
                {lang === 'nl' ? 'of met e-mail & wachtwoord' : 'or sign in with email'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recovery code link for lost device */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="text-center">
          <button
            type="button"
            aria-expanded={showRecovery}
            onClick={() => setShowRecovery((v) => !v)}
            className="text-[11px] text-slate-500 hover:text-slate-400 hover:underline font-medium"
          >
            {t('lostDevice')}
          </button>
        </div>
        <form hidden={!showRecovery} onSubmit={handleRecovery} className="space-y-2 pt-2 [&[hidden]]:hidden">
          <input
            type="text"
            required
            autoComplete="off"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-center text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
          />
          <button
            type="submit"
            disabled={loading || !recoveryCode.trim()}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition disabled:opacity-50"
          >
            {t('loginWithRecoveryCode')}
          </button>
        </form>
      </div>
    </>
  );
};


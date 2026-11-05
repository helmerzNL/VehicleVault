import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { ConvertGuestModal } from './ConvertGuestModal.js';

export const GuestTrialBanner: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const isGuest = Boolean(user?.isGuest || user?.email?.endsWith('@proef.local'));
  if (!isGuest) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-sky-500/20 border-b border-amber-500/30 px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
              <Sparkles className="w-3 h-3 mr-1" />
              {lang === 'nl' ? 'Proefsessie' : 'Trial Session'}
            </span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              {lang === 'nl'
                ? 'Je verkent VehicleVault als gast in een afgeschermde garage. Sla je account op om je data te behouden.'
                : 'Exploring VehicleVault as guest in a private garage. Save your account to keep your data.'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition hover:scale-[1.02]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'nl' ? 'Account Bewaren' : 'Save Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConvertGuestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};


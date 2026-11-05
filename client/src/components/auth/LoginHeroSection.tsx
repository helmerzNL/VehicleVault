import React from 'react';
import { Fuel, FileText, Radio, Sparkles, Cpu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { AnimatedCockpitVisual } from './AnimatedCockpitVisual.js';

export const LoginHeroSection: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-10 xl:p-12 bg-slate-950 text-white overflow-hidden select-none border-r border-slate-800/80">
      {/* Dynamic ambient background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Decorative Cockpit HUD Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      ></div>

      {/* Top Header / Branding */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="/icon-512.png"
              alt="VehicleVault"
              className="w-11 h-11 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block">VehicleVault</span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wide">
              v3.1 Telematics &amp; TCO
            </span>
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 backdrop-blur-md text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Self-Hosted &amp; MCP</span>
        </div>
      </div>

      {/* Center Content with Animated Cockpit Visual */}
      <div className="relative z-10 my-auto py-4 max-w-xl space-y-6">
        {/* Animated HUD Telemetry Centerpiece */}
        <AnimatedCockpitVisual />

        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lang === 'nl'
                ? 'Tanken, Documenten & Live Telematica'
                : 'Fuel Logs, Documents & Telematics'}
            </span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-white leading-tight">
            {lang === 'nl' ? (
              <>
                Volledige controle over tanken,{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  documenten &amp; telematica.
                </span>
              </>
            ) : (
              <>
                Complete control over fueling,{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  documents &amp; telematics.
                </span>
              </>
            )}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
            {lang === 'nl'
              ? 'Beheer al je tankbeurten, gescande facturen, APK en realtime kilometerstanden op één veilige, privacy-vriendelijke plek.'
              : 'Manage all your fill-ups, scanned invoices, inspections and realtime odometer telemetry in one privacy-friendly vault.'}
          </p>
        </div>

        {/* 3 Compact Glass Feature Cards: Fuel, Documents, Telematics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Card 1: Tankbeurten & Bonnen */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md transition-all group">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Fuel className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">
              {lang === 'nl' ? 'Slimme Tanklog' : 'Smart Fuel Log'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              {lang === 'nl' ? 'Bonnen scannen, GPS & km/l' : 'Receipt scan, GPS & km/l'}
            </p>
          </div>

          {/* Card 2: Documenten & Facturen */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md transition-all group">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">
              {lang === 'nl' ? 'Documenten & Facturen' : 'Docs & Invoices'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              {lang === 'nl' ? 'AI factuurherkenning & APK' : 'AI invoice OCR & APK'}
            </p>
          </div>

          {/* Card 3: Live Telematica */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md transition-all group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">
              {lang === 'nl' ? 'Telematica & TCO' : 'Telematics & TCO'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              {lang === 'nl' ? 'Kia, HA, Mercedes & tellers' : 'Kia, HA, Mercedes & odo'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer / Trust Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-4 gap-2">
        <span>© {new Date().getFullYear()} VehicleVault • Open Source &amp; Self-Hosted</span>
        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
          <span>Privacy First</span>
          <span>•</span>
          <span>Offline Ready</span>
          <span>•</span>
          <span>SQLite Native</span>
        </div>
      </div>
    </div>
  );
};

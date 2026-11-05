import React, { useState, useEffect } from 'react';
import { Fuel, FileText, Radio, Wrench, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export const AnimatedCockpitVisual: React.FC = () => {
  const { lang } = useLanguage();
  const [speed, setSpeed] = useState(104);

  // Gentle realistic speed fluctuation to bring the cockpit to life
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const next = prev + delta;
        return next >= 98 && next <= 110 ? next : 104;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto py-2 flex flex-col items-center justify-center select-none overflow-visible">
      {/* Ambient background glow behind the cluster */}
      <div className="absolute w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none -bottom-4"></div>

      {/* SVG Animated HUD & Telemetry Route Lines */}
      <div className="relative w-full h-64 sm:h-72">
        <svg
          viewBox="0 0 500 300"
          className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(16,185,129,0.25)]"
        >
          <defs>
            <linearGradient id="glow-teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="gauge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Perspective Night Road Grid (Bottom horizon) */}
          <g opacity="0.18">
            <line x1="250" y1="180" x2="50" y2="295" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="250" y1="180" x2="150" y2="295" stroke="#38bdf8" strokeWidth="1" />
            <line x1="250" y1="180" x2="250" y2="295" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 6" className="animate-dash-flow" />
            <line x1="250" y1="180" x2="350" y2="295" stroke="#38bdf8" strokeWidth="1" />
            <line x1="250" y1="180" x2="450" y2="295" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cx="250" cy="220" rx="90" ry="12" fill="none" stroke="#10b981" strokeWidth="0.7" strokeDasharray="4 4" />
            <ellipse cx="250" cy="255" rx="150" ry="18" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="4 4" />
            <ellipse cx="250" cy="290" rx="210" ry="24" fill="none" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* Telemetry Pulse Connection Lines */}
          {/* Path 1: Center to Top-Left (Tankbeurt & Verbruik) */}
          <path d="M 210,135 Q 140,110 90,80" fill="none" stroke="#1e293b" strokeWidth="2" />
          <path
            d="M 210,135 Q 140,110 90,80"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="6 14"
            className="animate-dash-flow"
            filter="url(#neon-glow)"
          />

          {/* Path 2: Center to Top-Right (Document & Factuur OCR) */}
          <path d="M 290,135 Q 360,110 410,80" fill="none" stroke="#1e293b" strokeWidth="2" />
          <path
            d="M 290,135 Q 360,110 410,80"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="6 14"
            className="animate-dash-flow-reverse"
            filter="url(#neon-glow)"
          />

          {/* Path 3: Center to Bottom-Left (Telematica & Odometer) */}
          <path d="M 200,165 Q 130,195 80,215" fill="none" stroke="#1e293b" strokeWidth="2" />
          <path
            d="M 200,165 Q 130,195 80,215"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6 14"
            className="animate-dash-flow"
            filter="url(#neon-glow)"
          />

          {/* Path 4: Center to Bottom-Right (APK & Onderhoud) */}
          <path d="M 300,165 Q 370,195 420,215" fill="none" stroke="#1e293b" strokeWidth="2" />
          <path
            d="M 300,165 Q 370,195 420,215"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeDasharray="6 14"
            className="animate-dash-flow-reverse"
            filter="url(#neon-glow)"
          />

          {/* Central Digital HUD Instrument Cluster */}
          <circle cx="250" cy="150" r="78" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle
            cx="250"
            cy="150"
            r="78"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="40 180"
            className="animate-spin-slow origin-center"
            style={{ transformOrigin: '250px 150px' }}
          />

          {/* Inner Glowing Speedometer Gauge Arc */}
          <circle cx="250" cy="150" r="64" fill="none" stroke="#0f172a" strokeWidth="7" />
          <circle
            cx="250"
            cy="150"
            r="64"
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="7"
            strokeDasharray="280 400"
            strokeLinecap="round"
            className="transition-all duration-700"
            filter="url(#neon-glow)"
          />

          {/* Center Dark Core with Digital Readout */}
          <circle cx="250" cy="150" r="52" fill="#020617" stroke="#334155" strokeWidth="2" />
        </svg>

        {/* HTML Overlay: Center Digital Cluster Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold flex items-center space-x-1">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>CRUISE</span>
          </span>
          <div className="flex items-baseline space-x-1 my-0.5">
            <span className="text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              {speed}
            </span>
            <span className="text-[10px] font-mono text-slate-400">km/h</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 font-medium">READY • ECO</span>
        </div>

        {/* Satellite Node 1: Top-Left (Tankbeurten & Verbruik) */}
        <div className="absolute top-2 left-0 sm:left-2 bg-slate-900/90 border border-amber-500/40 rounded-2xl px-3 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center space-x-2.5 animate-float-slow">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'nl' ? 'Tankbeurt & Verbruik' : 'Fuel & Consumption'}
            </div>
            <div className="text-xs font-mono font-bold text-amber-300">
              {lang === 'nl' ? '1:18,5 km/l • € 1,89/L' : '1:18.5 km/l • €1.89/L'}
            </div>
          </div>
        </div>

        {/* Satellite Node 2: Top-Right (Document & Factuur OCR) */}
        <div className="absolute top-2 right-0 sm:right-2 bg-slate-900/90 border border-sky-500/40 rounded-2xl px-3 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(14,165,233,0.2)] flex items-center space-x-2.5 animate-float-delayed">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'nl' ? 'Factuur & Doc OCR' : 'Invoice & Doc OCR'}
            </div>
            <div className="text-xs font-mono font-bold text-sky-300">
              {lang === 'nl' ? 'Kia Factuur • Gescand ✓' : 'Kia Invoice • Scanned ✓'}
            </div>
          </div>
        </div>

        {/* Satellite Node 3: Bottom-Left (Live Telematica & Odometer) */}
        <div className="absolute bottom-2 left-0 sm:left-2 bg-slate-900/90 border border-emerald-500/40 rounded-2xl px-3 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center space-x-2.5 animate-float-delayed">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'nl' ? 'Telematica & Kilometerstand' : 'Telematics & Odometer'}
            </div>
            <div className="text-xs font-mono font-bold text-emerald-300 flex items-center space-x-1">
              <span>{lang === 'nl' ? '45.280 km' : '45,280 km'}</span>
              <span className="text-[10px] text-emerald-400 font-normal">● Auto Sync</span>
            </div>
          </div>
        </div>

        {/* Satellite Node 4: Bottom-Right (APK & Onderhoud) */}
        <div className="absolute bottom-2 right-0 sm:right-2 bg-slate-900/90 border border-purple-500/40 rounded-2xl px-3 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center space-x-2.5 animate-float-slow">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              {lang === 'nl' ? 'APK & Onderhoud' : 'Inspection & Maintenance'}
            </div>
            <div className="text-xs font-mono font-bold text-purple-300">
              {lang === 'nl' ? 'APK OK • Historie Actueel' : 'Inspection OK • Up to Date'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

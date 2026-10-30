import React from 'react';
import { useChannel } from '../context/ChannelContext.js';

/** Shown next to the app name on the beta channel only; stable builds render nothing. */
export const BetaBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { channel } = useChannel();
  if (channel !== 'beta') return null;
  return (
    <span
      className={`ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800/60 text-[9px] font-black uppercase tracking-wider ${className}`}
    >
      beta
    </span>
  );
};

import React, { useState } from 'react';
import { Users, X, AlertCircle, CheckCircle2, Copy, Check, Link2 } from 'lucide-react';
import { Vehicle } from '../../types/index.js';
import { formatDisplayDate } from '../../utils/format.js';

interface VehicleShareModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  shares: any[];
  shareableUsers: { id: string; email: string }[];
  selectedShareEmail: string;
  setSelectedShareEmail: (email: string) => void;
  selectedShareRole: 'editor' | 'viewer';
  setSelectedShareRole: (role: 'editor' | 'viewer') => void;
  shareLoading: boolean;
  shareError: string | null;
  shareSuccess: string | null;
  lastInviteLink?: string | null;
  onAddShare: (e: React.FormEvent) => void;
  onRemoveShare: (userId: string) => void;
}

export const VehicleShareModal: React.FC<VehicleShareModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  shares,
  shareableUsers,
  selectedShareEmail,
  setSelectedShareEmail,
  selectedShareRole,
  setSelectedShareRole,
  shareLoading,
  shareError,
  shareSuccess,
  lastInviteLink,
  onAddShare,
  onRemoveShare,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  if (!isOpen) return null;

  const handleCopyInvite = () => {
    if (!lastInviteLink) return;
    navigator.clipboard.writeText(lastInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain safe-overlay bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Voertuig Delen: {vehicle.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Geef gezinsleden of mede-bestuurders toegang tot dit voertuig
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {shareError && (
          <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{shareError}</span>
          </div>
        )}

        {shareSuccess && (
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{shareSuccess}</span>
          </div>
        )}

        {lastInviteLink && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200 flex items-center space-x-1.5">
              <Link2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Directe Uitnodigingslink voor de mede-bestuurder:</span>
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={lastInviteLink}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1 shrink-0 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Gekopieerd!' : 'Kopiëren'}</span>
              </button>
            </div>
            <p className="text-[10px] text-sky-700 dark:text-sky-400">
              Stuur deze link via bijv. WhatsApp of e-mail. De mede-bestuurder kan direct inloggen of registreren en heeft meteen toegang tot dit voertuig.
            </p>
          </div>
        )}

        {/* Add share form */}
        <form onSubmit={onAddShare} className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Mede-bestuurder uitnodigen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                E-mailadres mede-bestuurder
              </label>
              <input
                type="email"
                required
                list="shareable-users-list"
                placeholder="bijv. vrouw@voorbeeld.nl"
                value={selectedShareEmail}
                onChange={(e) => setSelectedShareEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-accent-500"
              />
              <datalist id="shareable-users-list">
                {shareableUsers.map((u) => (
                  <option key={u.id} value={u.email} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Toegangsrechten
              </label>
              <select
                value={selectedShareRole}
                onChange={(e) => setSelectedShareRole(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-accent-500"
              >
                <option value="editor">Bewerker (Tanken, ritten & onderhoud)</option>
                <option value="viewer">Alleen-lezen (Alleen inzien)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={shareLoading || !selectedShareEmail}
              className="px-3.5 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{shareLoading ? 'Toevoegen...' : 'Toegang Verlenen'}</span>
            </button>
          </div>
        </form>

        {/* List of active shares */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Actieve delingen ({shares.length})
          </span>
          {shares.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              Dit voertuig is momenteel nog met niemand gedeeld.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
              {shares.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{s.email}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      Rol: {s.role === 'editor' ? 'Bewerker' : 'Alleen-lezen'} • Gedeeld op {formatDisplayDate(s.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveShare(s.user_id)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Toegang intrekken"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

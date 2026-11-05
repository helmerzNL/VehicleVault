import { useState } from 'react';
import { Vehicle } from '../../types/index.js';
import { apiFetch } from '../../api/client.js';

export function useVehicleShare() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingVehicle, setSharingVehicle] = useState<Vehicle | null>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [shareableUsers, setShareableUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedShareEmail, setSelectedShareEmail] = useState('');
  const [selectedShareRole, setSelectedShareRole] = useState<'editor' | 'viewer'>('editor');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const openShareModal = async (v: Vehicle) => {
    setSharingVehicle(v);
    setIsShareModalOpen(true);
    setShareError(null);
    setShareSuccess(null);
    setLastInviteLink(null);
    setSelectedShareEmail('');
    setSelectedShareRole('editor');
    setShareLoading(true);

    try {
      const [sharesRes, usersRes] = await Promise.all([
        apiFetch<{ shares: any[] }>(`/api/vehicles/${v.id}/shares`),
        apiFetch<{ users: { id: string; email: string }[] }>('/api/auth/users/shareable').catch(() => ({ users: [] })),
      ]);
      setShares(sharesRes?.shares || []);
      setShareableUsers(usersRes?.users || []);
    } catch (err: any) {
      setShareError(err?.message || 'Fout bij het ophalen van gedeelde gebruikers');
    } finally {
      setShareLoading(false);
    }
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingVehicle || !selectedShareEmail) return;

    setShareError(null);
    setShareSuccess(null);
    setLastInviteLink(null);
    setShareLoading(true);

    try {
      const res = await apiFetch<any>(`/api/vehicles/${sharingVehicle.id}/shares`, {
        method: 'POST',
        body: JSON.stringify({
          email: selectedShareEmail,
          targetUserEmail: selectedShareEmail,
          role: selectedShareRole,
        }),
      });

      setShareSuccess(res.message || `Toegang verleend aan ${selectedShareEmail}`);
      if (res.inviteLink) {
        setLastInviteLink(res.inviteLink);
      }

      const updated = await apiFetch<{ shares: any[] }>(`/api/vehicles/${sharingVehicle.id}/shares`);
      setShares(updated.shares || []);
      setSelectedShareEmail('');
    } catch (err: any) {
      setShareError(err?.message || 'Fout bij delen van voertuig');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    if (!sharingVehicle) return;
    setShareError(null);
    setShareSuccess(null);

    try {
      await apiFetch(`/api/vehicles/${sharingVehicle.id}/shares/${userId}`, {
        method: 'DELETE',
      });
      setShares((prev) => prev.filter((s) => s.user_id !== userId));
      setShareSuccess('Toegang ingetrokken');
    } catch (err: any) {
      setShareError(err?.message || 'Fout bij intrekken van toegang');
    }
  };

  return {
    isShareModalOpen,
    setIsShareModalOpen,
    sharingVehicle,
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
    openShareModal,
    handleAddShare,
    handleRemoveShare,
  };
}

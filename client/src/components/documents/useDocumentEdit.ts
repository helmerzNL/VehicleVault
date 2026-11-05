import { useState } from 'react';
import { Vehicle, VehicleDocument } from '../../types/index.js';
import { apiFetch } from '../../api/client.js';

export function useDocumentEdit(
  selectedVehicle: Vehicle | null,
  loadDocuments: (vehicleId: string) => Promise<void>,
  extractDocumentDate: (doc: VehicleDocument) => string
) {
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'registration' | 'insurance' | 'apk' | 'invoice' | 'manual' | 'other'>('invoice');
  const [editDate, setEditDate] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (doc: VehicleDocument) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
    setEditDate(extractDocumentDate(doc));
    setEditExpiresAt(doc.expires_at || '');
    setEditNotes(doc.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      setIsSavingEdit(true);
      await apiFetch(`/api/documents/${editingDoc.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory,
          document_date: editDate || null,
          expires_at: editExpiresAt || null,
          notes: editNotes.trim() || null,
        }),
      });
      setIsEditModalOpen(false);
      setEditingDoc(null);
      if (selectedVehicle) {
        await loadDocuments(selectedVehicle.id);
      }
    } catch (err: any) {
      alert(err.message || 'Fout bij opslaan document');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return {
    editingDoc,
    setEditingDoc,
    isEditModalOpen,
    setIsEditModalOpen,
    editName,
    setEditName,
    editCategory,
    setEditCategory,
    editDate,
    setEditDate,
    editExpiresAt,
    setEditExpiresAt,
    editNotes,
    setEditNotes,
    isSavingEdit,
    openEditModal,
    handleSaveEdit,
  };
}


import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FolderLock, Plus } from 'lucide-react';
import { Vehicle, VehicleDocument } from '../types/index.js';
import { apiFetch } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.js';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal.js';
import { DocumentListView } from '../components/documents/DocumentListView.js';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal.js';
import { DocumentEditModal } from '../components/documents/DocumentEditModal.js';
import { DocumentHeaderControls, DocCategory } from '../components/documents/DocumentHeaderControls.js';
import { useDocumentOperations } from '../components/documents/useDocumentOperations.js';

interface ContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

export const Documents: React.FC = () => {
  const { selectedVehicle } = useOutletContext<ContextType>();
  const { t, lang } = useLanguage();

  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('vv_documents_view') as 'list' | 'grid') || 'list';
  });

  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    date?: string;
    fileSize?: number;
    notes?: string;
  } | null>(null);

  const loadDocuments = async (vehicleId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ documents: VehicleDocument[] }>(`/api/documents/${vehicleId}`);
      setDocuments(res.documents);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const ops = useDocumentOperations(selectedVehicle, loadDocuments);

  useEffect(() => {
    if (selectedVehicle) {
      loadDocuments(selectedVehicle.id);
    }
  }, [selectedVehicle?.id]);

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('vv_documents_view', mode);
  };

  const filteredDocuments = documents
    .filter((doc) => {
      if (activeCategory === 'all') return true;
      return doc.category === activeCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      const dateA = ops.extractDocumentDate(a);
      const dateB = ops.extractDocumentDate(b);
      if (sortBy === 'date_asc') {
        return dateA.localeCompare(dateB) || a.created_at.localeCompare(b.created_at);
      }
      return dateB.localeCompare(dateA) || b.created_at.localeCompare(a.created_at);
    });

  if (!selectedVehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <FolderLock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          {lang === 'nl' ? 'Geen voertuig geselecteerd' : 'No vehicle selected'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {lang === 'nl'
            ? 'Selecteer een voertuig in het menu hierboven om de digitale handschoenenkast te bekijken.'
            : 'Select a vehicle from the top menu to access the digital glovebox.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <FolderLock className="w-5 h-5 text-sky-500" />
            <span>{t('documentsTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('documentsSubtitle')} • <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedVehicle.name}</span>
          </p>
        </div>

        <button
          onClick={() => ops.setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm hover:scale-[1.02] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('uploadDocument')}</span>
        </button>
      </div>

      <DocumentHeaderControls
        documents={documents}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        onSetViewMode={handleSetViewMode}
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {t('loading')}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <FolderLock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            {t('noDocumentsFound')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Bewaar al je belangrijke autopapieren, groene kaart, kentekencard scans en garagefacturen digitaal op één veilige plek.
          </p>
          <button
            onClick={() => ops.setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('uploadDocument')}</span>
          </button>
        </div>
      ) : (
        <DocumentListView
          documents={filteredDocuments}
          viewMode={viewMode}
          onPreview={(doc: any) => setPreviewDoc({ ...doc, isOpen: true })}
          onEdit={ops.openEditModal}
          onDelete={ops.handleDelete}
        />
      )}

      {/* Upload Modal */}
      {ops.isUploadModalOpen && (
        <DocumentUploadModal
          isOpen={ops.isUploadModalOpen}
          onClose={() => ops.setIsUploadModalOpen(false)}
          onUpload={ops.handleUpload}
          docFile={ops.docFile}
          docName={ops.docName}
          setDocName={ops.setDocName}
          docCategory={ops.docCategory}
          setDocCategory={ops.setDocCategory}
          docNotes={ops.docNotes}
          setDocNotes={ops.setDocNotes}
          docExpiresAt={ops.docExpiresAt}
          setDocExpiresAt={ops.setDocExpiresAt}
          docDate={ops.docDate}
          setDocDate={ops.setDocDate}
          isUploading={ops.isUploading}
          compressing={ops.compressing}
          compressionRatio={ops.compressionRatio}
          isDragging={ops.isDragging}
          onFileChange={ops.handleFileChange}
          onDragOver={ops.handleDragOver}
          onDragLeave={ops.handleDragLeave}
          onDrop={ops.handleDrop}
          onRemoveFile={() => {
            ops.setDocFile(null);
            ops.setCompressionRatio(null);
          }}
          isScanning={ops.isScanning}
          scanExtraction={ops.scanExtraction}
          scanWarning={ops.scanWarning}
          onReScan={ops.handleManualReScan}
        />
      )}

      {/* Edit Modal */}
      {ops.isEditModalOpen && (
        <DocumentEditModal
          isOpen={ops.isEditModalOpen}
          editingDoc={ops.editingDoc}
          onClose={() => {
            ops.setIsEditModalOpen(false);
            ops.setEditingDoc(null);
          }}
          onSave={ops.handleSaveEdit}
          editName={ops.editName}
          setEditName={ops.setEditName}
          editCategory={ops.editCategory}
          setEditCategory={ops.setEditCategory}
          editDate={ops.editDate}
          setEditDate={ops.setEditDate}
          editExpiresAt={ops.editExpiresAt}
          setEditExpiresAt={ops.setEditExpiresAt}
          editNotes={ops.editNotes}
          setEditNotes={ops.setEditNotes}
          isSavingEdit={ops.isSavingEdit}
        />
      )}

      {/* Document In-App Preview Modal */}
      {previewDoc?.isOpen && (
        <DocumentPreviewModal
          isOpen={previewDoc.isOpen}
          title={previewDoc.title}
          url={previewDoc.url}
          fileSize={previewDoc.fileSize}
          notes={previewDoc.notes}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};

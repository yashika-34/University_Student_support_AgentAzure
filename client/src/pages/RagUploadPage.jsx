import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { ragAPI } from '../services/api.js';
import ModalPortal from '../components/ModalPortal.jsx';
import {
  Upload, FileText, Trash2, CheckCircle, AlertCircle, File, X, Search,
  FolderOpen, Download, Eye, BookOpen, Filter, ExternalLink, Calendar,
  User, Check, Loader2, Info, Layers
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'General',
  'Academics',
  'Fees & Financial Aid',
  'Examinations',
  'Campus Facilities',
  'Regulations',
  'Syllabus',
  'Admissions'
];

const RagUploadPage = () => {
  const { role, user } = useAuth();
  const isFaculty = role === 'faculty' || role === 'teacher' || role === 'admin' || role === 'super_admin';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('Academics');
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await ragAPI.list();
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Error fetching university documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setSelectedFile(f);
      setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(15);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('title', title.trim() || selectedFile.name.replace(/\.[^.]+$/, ''));
    formData.append('category', category);

    const timer = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 20, 90));
    }, 250);

    try {
      const res = await ragAPI.upload(formData);
      clearInterval(timer);
      setUploadProgress(100);
      setUploadResult({
        success: true,
        message: res.data.message || 'Document uploaded and indexed into database successfully.'
      });
      setSelectedFile(null);
      setTitle('');
      fetchDocuments();
    } catch (err) {
      clearInterval(timer);
      setUploadProgress(0);
      setUploadResult({
        success: false,
        message: err.response?.data?.message || 'Failed to upload and parse document. Please check file format.'
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2500);
    }
  };

  // Preview Document Handler
  const handleOpenPreview = async (docSummary) => {
    setLoadingPreview(true);
    setPreviewSearch('');
    try {
      const res = await ragAPI.getById(docSummary.id || docSummary.docId);
      setPreviewDoc(res.data.document || docSummary);
    } catch (err) {
      console.error('Failed to load document preview:', err);
      // Fallback to summary info if single fetch fails
      setPreviewDoc(docSummary);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Direct Download Handler
  const handleDownload = async (doc) => {
    try {
      const res = await ragAPI.download(doc.id || doc.docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = doc.originalName?.endsWith('.txt')
        ? doc.originalName
        : `${doc.originalName || doc.title}.txt`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document. Please try again.');
    }
  };

  // Delete Document Handler
  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document from the university knowledge base? This action cannot be undone.')) {
      return;
    }
    setDeletingId(docId);
    try {
      await ragAPI.delete(docId);
      setDocuments((prev) => prev.filter((d) => (d.id !== docId && d.docId !== docId)));
      if (previewDoc && (previewDoc.id === docId || previewDoc.docId === docId)) {
        setPreviewDoc(null);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert(err.response?.data?.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title?.toLowerCase().includes(q);
      const matchOrig = doc.originalName?.toLowerCase().includes(q);
      const matchCat = doc.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchOrig && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <BookOpen size={16} /> University Knowledge Repository
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Documents &amp; Academic Resources</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isFaculty
              ? 'Upload, index, and manage official syllabus documents, academic regulations, and study guides for the AI knowledge base.'
              : 'Browse, preview, and download verified academic syllabi, university circulars, and course study materials.'}
          </p>
        </div>
      </div>

      {/* ── FACULTY / TEACHER: Document Upload Zone ── */}
      {isFaculty && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
            <Upload size={18} color="var(--primary)" /> Upload Academic Document
          </h3>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('rag-file-input').click()}
            style={{
              border: `2px dashed ${dragActive ? 'var(--primary)' : selectedFile ? 'var(--success)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              background: dragActive ? 'rgba(59, 130, 246, 0.08)' : selectedFile ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-input)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            <input
              id="rag-file-input"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
                <File size={32} color="var(--success)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatSize(selectedFile.size)}</div>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setTitle(''); }}
                  style={{ width: 28, height: 28, marginLeft: '0.5rem' }}
                  title="Remove selected file"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <FolderOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.65rem auto', opacity: 0.6 }} />
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {dragActive ? 'Drop your document here...' : 'Drag & drop a file, or click to browse'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Supports PDF, DOCX, DOC, and TXT • Maximum file size: 20 MB
                </div>
              </>
            )}
          </div>

          {/* Form Fields: Title & Category */}
          {selectedFile && (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Syllabus 2026"
                  required
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {uploadProgress > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.2s ease' }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {uploadProgress < 100 ? 'Extracting text and indexing document chunks...' : 'Uploaded & indexed!'}
              </div>
            </div>
          )}

          {/* Upload Status Banner */}
          {uploadResult && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: uploadResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${uploadResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: uploadResult.success ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {uploadResult.success ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
              <span>{uploadResult.message}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Processing &amp; Indexing Document...
              </>
            ) : (
              <>
                <Upload size={18} /> Upload &amp; Index Document
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Document Explorer (Search, Filter, Cards) ── */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
              <FileText size={18} color="var(--accent-purple)" />
              {isFaculty ? `Indexed Knowledge Documents (${filteredDocuments.length})` : `Published Course Documents (${filteredDocuments.length})`}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Verified academic files available for reading and download
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search documents by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', width: 230, fontSize: '0.85rem' }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontSize: '0.9rem' }}>Loading documents from university database...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <FolderOpen size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>No documents match the selected filter</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
              {searchQuery ? 'Try adjusting your search query or category filter.' : 'Upload official syllabus and academic guides to get started.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id || doc.docId}
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color 0.2s ease, transform 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FileText size={22} color="var(--accent-purple)" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.originalName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {doc.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatSize(doc.sizeBytes)}
                      </span>
                      {doc.totalChunks > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • {doc.totalChunks} chunks
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} /> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Active'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(doc)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      title="Preview document content"
                    >
                      <Eye size={13} /> Preview
                    </button>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      title="Download document text"
                    >
                      <Download size={13} /> Download
                    </button>

                    {/* Delete button (Faculty / Admin only) */}
                    {isFaculty && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id || doc.docId)}
                        disabled={deletingId === (doc.id || doc.docId)}
                        className="icon-btn"
                        style={{ width: 30, height: 30, color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                        title="Delete document"
                      >
                        {deletingId === (doc.id || doc.docId) ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Document Preview Modal via ModalPortal ── */}
      <ModalPortal isOpen={Boolean(previewDoc)}>
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="doc-preview-title"
        >
          <div className="modal-container" style={{ maxWidth: '780px', width: '92%' }}>
            {/* Sticky Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 id="doc-preview-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                    {previewDoc?.title || 'Document Content Preview'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>{previewDoc?.originalName}</span>
                    <span>•</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{previewDoc?.category}</span>
                    <span>•</span>
                    <span>{formatSize(previewDoc?.sizeBytes)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
              {/* Search within document preview */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search inside this document..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {loadingPreview ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
                  <p>Loading document content from database...</p>
                </div>
              ) : previewDoc?.chunks && previewDoc.chunks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {previewDoc.chunks
                    .filter((c) => !previewSearch.trim() || c.content.toLowerCase().includes(previewSearch.toLowerCase()))
                    .map((chunk, index) => (
                      <div
                        key={chunk.chunkId || index}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.875rem',
                          lineHeight: 1.65,
                          whiteSpace: 'pre-wrap',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Segment #{index + 1}</span>
                          <span style={{ fontFamily: 'monospace' }}>ID: {chunk.chunkId}</span>
                        </div>
                        {chunk.content}
                      </div>
                    ))}
                </div>
              ) : previewDoc?.fullContent ? (
                <div style={{
                  padding: '1.25rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '55vh',
                  overflowY: 'auto'
                }}>
                  {previewDoc.fullContent}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <Info size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p>No text content available for preview.</p>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
              {previewDoc && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDownload(previewDoc)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={15} /> Download Document Text
                </button>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
};

export default RagUploadPage;

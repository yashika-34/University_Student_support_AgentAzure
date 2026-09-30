import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { digitalTwinAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Brain, Upload, MessageSquare, Settings, Trash2, Plus, Power,
  BookOpen, FileText, ChevronRight, Loader2, CheckCircle, 
  Save, Eye, HelpCircle, Activity, Sparkles, Send, RefreshCw, X,
  BarChart2, Inbox, AlertTriangle, Check
} from 'lucide-react';

const PERSONALITY_OPTIONS = [
  { value: 'friendly', label: '😊 Friendly', desc: 'Warm & approachable' },
  { value: 'formal', label: '🎓 Academic', desc: 'Professional & thorough' },
  { value: 'socratic', label: '🤔 Socratic', desc: 'Guides with questions' },
  { value: 'encouraging', label: '🌟 Encouraging', desc: 'Motivating & patient' },
  { value: 'strict', label: '📐 Rigorous', desc: 'Direct & exam-focused' }
];

const AVATAR_OPTIONS = ['🧑‍🏫', '👨‍🏫', '👩‍🏫', '🤖', '🧠', '⚡', '🦉', '🎓', '🔬', '💡'];

const TYPE_OPTIONS = [
  { value: 'lecture_notes', label: 'Lecture Notes' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'past_paper', label: 'Past Exam' },
  { value: 'reference_material', label: 'Reference' },
  { value: 'custom', label: 'Custom Note' }
];

const DigitalTwinPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'knowledge' | 'faqs' | 'analytics'

  // Profile Form
  const [identityForm, setIdentityForm] = useState({
    twinName: '',
    subject: '',
    personality: 'friendly',
    greetingMessage: '',
    avatarEmoji: '🧑‍🏫'
  });
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Knowledge Form
  const [addType, setAddType] = useState('file'); // 'file' | 'text'
  const [knowledgeForm, setKnowledgeForm] = useState({ title: '', content: '', type: 'lecture_notes' });
  const [uploadFile, setUploadFile] = useState(null);
  const [addingKnowledge, setAddingKnowledge] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef();

  // FAQs
  const [faqList, setFaqList] = useState([]);
  const [savingFaqs, setSavingFaqs] = useState(false);

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Analytics & Doubt Queue
  const [analytics, setAnalytics] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionText, setResolutionText] = useState({});
  const [saveToFaqCheck, setSaveToFaqCheck] = useState({});

  useEffect(() => {
    fetchTwin();
    fetchAnalytics();
  }, []);

  const fetchTwin = async () => {
    try {
      setLoading(true);
      const res = await digitalTwinAPI.getMyTwin();
      const t = res.data.twin;
      setTwin(t);
      setIdentityForm({
        twinName: t.twinName || `${user?.name || 'Professor'}'s AI Twin`,
        subject: t.subject || 'General Studies',
        personality: t.personality || 'friendly',
        greetingMessage: t.greetingMessage || 'Hello! Ask me any questions about our course.',
        avatarEmoji: t.avatarEmoji || '🧑‍🏫'
      });
      setFaqList(t.faqs?.length ? t.faqs : [{ question: '', answer: '' }]);
    } catch (err) {
      toast.error('Failed to load your Digital Twin profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await digitalTwinAPI.getAnalytics();
      if (res.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      // Non-critical, ignore
    }
  };

  const handleSaveIdentity = async (e) => {
    e?.preventDefault();
    if (!identityForm.twinName?.trim() || !identityForm.subject?.trim()) {
      toast.error('Twin Name and Subject are required.');
      return;
    }
    setSavingIdentity(true);
    try {
      const res = await digitalTwinAPI.updateMyTwin(identityForm);
      setTwin(res.data.twin);
      toast.success('Twin profile updated successfully! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleAddKnowledge = async (e) => {
    e?.preventDefault();
    if (!knowledgeForm.title.trim()) {
      toast.error('Please enter a title for this material.');
      return;
    }

    if (addType === 'text') {
      if (!knowledgeForm.content.trim()) {
        toast.error('Please paste the content text.');
        return;
      }
      setAddingKnowledge(true);
      try {
        await digitalTwinAPI.addKnowledgeText(knowledgeForm);
        toast.success('Knowledge added! Your twin learned this new material 🧠');
        setKnowledgeForm({ title: '', content: '', type: 'lecture_notes' });
        await fetchTwin();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to add knowledge.');
      } finally {
        setAddingKnowledge(false);
      }
    } else {
      if (!uploadFile) {
        toast.error('Please select a PDF file to upload.');
        return;
      }
      setAddingKnowledge(true);
      try {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', knowledgeForm.title);
        formData.append('type', knowledgeForm.type);
        await digitalTwinAPI.addKnowledgeFile(formData);
        toast.success('Document processed and uploaded! 📄');
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setKnowledgeForm({ title: '', content: '', type: 'lecture_notes' });
        await fetchTwin();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to process document.');
      } finally {
        setAddingKnowledge(false);
      }
    }
  };

  const handleDeleteKnowledge = async (id) => {
    setDeletingId(id);
    try {
      await digitalTwinAPI.deleteKnowledge(id);
      toast.success('Material removed.');
      await fetchTwin();
    } catch (err) {
      toast.error('Failed to remove material.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddFaqRow = () => {
    setFaqList(prev => [...prev, { question: '', answer: '' }]);
  };

  const handleFaqChange = (index, field, val) => {
    setFaqList(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleRemoveFaqRow = (index) => {
    setFaqList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveFaqs = async () => {
    const validFaqs = faqList.filter(f => f.question?.trim() && f.answer?.trim());
    setSavingFaqs(true);
    try {
      await digitalTwinAPI.updateFaqs(validFaqs);
      toast.success('Instant FAQs updated! ⚡');
      await fetchTwin();
    } catch (err) {
      toast.error('Failed to save FAQs.');
    } finally {
      setSavingFaqs(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const res = await digitalTwinAPI.toggleStatus();
      setTwin(prev => ({ ...prev, isActive: res.data.isActive }));
      toast.success(res.data.isActive ? 'Twin is now ONLINE for students! 🟢' : 'Twin is now OFFLINE 🔴');
    } catch (err) {
      toast.error('Failed to toggle status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleResolveDoubt = async (doubtId) => {
    const text = resolutionText[doubtId];
    if (!text?.trim()) {
      toast.error('Please enter your answer/resolution.');
      return;
    }

    setResolvingId(doubtId);
    try {
      await digitalTwinAPI.resolveDoubt(doubtId, {
        resolution: text.trim(),
        addToFaqs: saveToFaqCheck[doubtId] !== false
      });
      toast.success('Doubt resolved and answer saved! ✨');
      await fetchAnalytics();
      await fetchTwin();
    } catch (err) {
      toast.error('Failed to resolve doubt.');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0.75rem' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading your AI Twin...</span>
      </div>
    );
  }

  const pendingDoubtsCount = analytics?.escalatedDoubts?.filter(d => d.status === 'pending')?.length || 0;

  return (
    <div className="page-wrapper" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ── Compact Header & Status Card ── */}
      <div className="card" style={{
        padding: '1.5rem',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        {/* Left: Avatar + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            border: '2px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', flexShrink: 0
          }}>
            {twin?.avatarEmoji || '🧑‍🏫'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {twin?.twinName || 'AI Teacher Twin'}
              </h1>
              <span style={{
                padding: '0.15rem 0.55rem', borderRadius: '999px',
                fontSize: '0.72rem', fontWeight: 600,
                background: twin?.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: twin?.isActive ? '#10b981' : '#ef4444',
                border: `1px solid ${twin?.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                {twin?.isActive ? '● Online' : '○ Offline'}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Subject: <strong>{twin?.subject || 'Not specified'}</strong> &nbsp;•&nbsp; 
              Notes: <strong>{twin?.knowledgeBase?.length || 0} files</strong> &nbsp;•&nbsp;
              Chats: <strong>{twin?.totalChats || 0}</strong>
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`btn ${twin?.isActive ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
              borderColor: twin?.isActive ? 'rgba(239,68,68,0.4)' : undefined,
              color: twin?.isActive ? '#ef4444' : undefined
            }}
          >
            {togglingStatus ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
            {twin?.isActive ? 'Take Offline' : 'Publish Online'}
          </button>

          <Link
            to={`/digital-twin/chat/${twin?._id}`}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Eye size={15} /> Preview as Student
          </Link>
        </div>
      </div>

      {/* ── Modern Streamlined Tabs ── */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem', paddingBottom: '0.25rem', overflowX: 'auto'
      }}>
        {[
          { id: 'profile', icon: <Settings size={16} />, label: '1. Persona & Identity' },
          { id: 'knowledge', icon: <BookOpen size={16} />, label: `2. Knowledge Base (${twin?.knowledgeBase?.length || 0})` },
          { id: 'faqs', icon: <HelpCircle size={16} />, label: `3. Instant FAQs (${twin?.faqs?.length || 0})` },
          { 
            id: 'analytics', 
            icon: <BarChart2 size={16} />, 
            label: `4. Doubt Heatmap & Inbox`,
            badge: pendingDoubtsCount > 0 ? pendingDoubtsCount : null
          }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.15rem', borderRadius: '0.5rem 0.5rem 0 0',
              border: 'none', background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
            {tab.badge && (
              <span style={{
                background: '#ef4444', color: '#fff', fontSize: '0.7rem',
                padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 700
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Persona & Identity ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveIdentity} className="card" style={{ padding: '1.75rem', borderRadius: '1rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Configure AI Persona
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Customize how your digital clone introduces itself and speaks to students.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Twin Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Prof. Kumar's AI Twin"
                value={identityForm.twinName}
                onChange={e => setIdentityForm(p => ({ ...p, twinName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Subject / Course</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Data Structures & Algorithms"
                value={identityForm.subject}
                onChange={e => setIdentityForm(p => ({ ...p, subject: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Avatar Picker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Choose Avatar</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIdentityForm(p => ({ ...p, avatarEmoji: emoji }))}
                  style={{
                    width: 44, height: 44, borderRadius: '0.6rem', fontSize: '1.4rem',
                    border: identityForm.avatarEmoji === emoji
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    background: identityForm.avatarEmoji === emoji
                      ? 'rgba(99,102,241,0.15)'
                      : 'var(--bg-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Personality Style */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Teaching Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
              {PERSONALITY_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setIdentityForm(p => ({ ...p, personality: opt.value }))}
                  style={{
                    padding: '0.75rem', borderRadius: '0.6rem', cursor: 'pointer',
                    border: identityForm.personality === opt.value
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    background: identityForm.personality === opt.value
                      ? 'rgba(99,102,241,0.08)'
                      : 'var(--bg-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Greeting message */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Welcome Message</label>
            <textarea
              className="form-input"
              rows={2}
              value={identityForm.greetingMessage}
              onChange={e => setIdentityForm(p => ({ ...p, greetingMessage: e.target.value }))}
              placeholder="Hi there! Ask me any questions regarding our lectures and exams..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingIdentity}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
            >
              {savingIdentity ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Persona
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: Knowledge Base ── */}
      {activeTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Add Knowledge to Your Twin</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Upload PDF lecture notes or paste text. The AI twin will answer student questions using this data.
                </p>
              </div>

              {/* Mode Toggle */}
              <div style={{
                display: 'flex', background: 'var(--bg-secondary)',
                borderRadius: '0.5rem', padding: '0.2rem', border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setAddType('file')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '0.35rem', border: 'none',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: addType === 'file' ? 'var(--accent-primary)' : 'transparent',
                    color: addType === 'file' ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  📄 Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setAddType('text')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '0.35rem', border: 'none',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: addType === 'text' ? 'var(--accent-primary)' : 'transparent',
                    color: addType === 'text' ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  ✏️ Paste Text
                </button>
              </div>
            </div>

            <form onSubmit={handleAddKnowledge}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Material Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Chapter 3 - Binary Trees & Graphs"
                    value={knowledgeForm.title}
                    onChange={e => setKnowledgeForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Material Category</label>
                  <select
                    className="form-input"
                    value={knowledgeForm.type}
                    onChange={e => setKnowledgeForm(p => ({ ...p, type: e.target.value }))}
                  >
                    {TYPE_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {addType === 'file' ? (
                <div style={{
                  border: '2px dashed var(--border-subtle)', borderRadius: '0.75rem',
                  padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)',
                  cursor: 'pointer', marginBottom: '1rem'
                }}
                onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {uploadFile ? uploadFile.name : 'Click to select PDF notes or syllabus'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Supported formats: PDF (up to 10MB)
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => setUploadFile(e.target.files[0] || null)}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Paste Notes / Content</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Paste lecture excerpts, exam notes, summaries, or formulas here..."
                    value={knowledgeForm.content}
                    onChange={e => setKnowledgeForm(p => ({ ...p, content: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={addingKnowledge}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  {addingKnowledge ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Add to Knowledge Base
                </button>
              </div>
            </form>
          </div>

          {/* List of Knowledge items */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>
              Uploaded Knowledge Files ({twin?.knowledgeBase?.length || 0})
            </h3>

            {!twin?.knowledgeBase?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <BookOpen size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No documents uploaded yet. Upload your first PDF above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {twin.knowledgeBase.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.85rem 1rem', borderRadius: '0.6rem',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {TYPE_OPTIONS.find(t => t.value === item.type)?.label || item.type} &nbsp;•&nbsp; 
                          Added {new Date(item.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteKnowledge(item._id)}
                      disabled={deletingId === item._id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '0.4rem', borderRadius: '0.4rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      title="Remove this file"
                    >
                      {deletingId === item._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Instant FAQs ── */}
      {activeTab === 'faqs' && (
        <div className="card" style={{ padding: '1.75rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Instant Answer FAQs</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                When students ask these exact questions, your twin answers instantly without waiting for AI.
              </p>
            </div>
            <button
              onClick={handleAddFaqRow}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus size={14} /> Add FAQ
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {faqList.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem', borderRadius: '0.75rem',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Question (e.g. When is the midterm exam?)"
                    value={faq.question}
                    onChange={e => handleFaqChange(idx, 'question', e.target.value)}
                    style={{ fontSize: '0.88rem', fontWeight: 600 }}
                  />
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Instant Answer (e.g. Midterms will be held on Oct 15th from 10 AM to 12 PM in Hall B.)"
                    value={faq.answer}
                    onChange={e => handleFaqChange(idx, 'answer', e.target.value)}
                    style={{ fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>
                {faqList.length > 1 && (
                  <button
                    onClick={() => handleRemoveFaqRow(idx)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-secondary)', padding: '0.4rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveFaqs}
              disabled={savingFaqs}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
            >
              {savingFaqs ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save FAQs
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 4: Doubt Heatmap & Inbox ── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Topics / Heatmap */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart2 size={20} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Doubt Heatmap (Most Asked Topics)</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Concepts your students have asked your AI twin about most frequently.
                </p>
              </div>
            </div>

            {!analytics?.popularTopics?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <Activity size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>No student doubt trends yet. As students chat with your twin, topics will populate here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {analytics.popularTopics.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '999px',
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      #{item.topic}
                    </span>
                    <span style={{
                      background: 'var(--accent-primary)', color: '#fff',
                      fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 700
                    }}>
                      {item.count} queries
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escalated Doubts (Inbox) */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Inbox size={20} style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Escalated Doubts Inbox ({pendingDoubtsCount} Pending)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Questions students forwarded directly to you for human guidance.
                  </p>
                </div>
              </div>
            </div>

            {!analytics?.escalatedDoubts?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: '0.5rem', color: '#10b981' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>Inbox is clear! No doubts waiting for your response.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analytics.escalatedDoubts.map((doubt) => (
                  <div
                    key={doubt._id}
                    style={{
                      padding: '1.25rem', borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${doubt.status === 'pending' ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {doubt.studentName} ({doubt.studentEmail || 'Student'})
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Received {new Date(doubt.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <span style={{
                        padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
                        background: doubt.status === 'pending' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                        color: doubt.status === 'pending' ? '#ef4444' : '#10b981',
                        border: `1px solid ${doubt.status === 'pending' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`
                      }}>
                        {doubt.status === 'pending' ? '● Needs Answer' : '✓ Resolved'}
                      </span>
                    </div>

                    <div style={{
                      padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.5rem'
                    }}>
                      "{doubt.question}"
                    </div>

                    {doubt.context && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        Student Note: {doubt.context}
                      </div>
                    )}

                    {doubt.status === 'pending' ? (
                      <div style={{ marginTop: '0.75rem' }}>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Type your official answer to the student..."
                          value={resolutionText[doubt._id] || ''}
                          onChange={e => setResolutionText(p => ({ ...p, [doubt._id]: e.target.value }))}
                          style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={saveToFaqCheck[doubt._id] !== false}
                              onChange={e => setSaveToFaqCheck(p => ({ ...p, [doubt._id]: e.target.checked }))}
                            />
                            Automatically save this answer to Twin FAQs
                          </label>

                          <button
                            onClick={() => handleResolveDoubt(doubt._id)}
                            disabled={resolvingId === doubt._id}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem' }}
                          >
                            {resolvingId === doubt._id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            Send Resolution
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '0.5rem', padding: '0.65rem', borderRadius: '0.5rem',
                        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: '0.82rem', color: 'var(--text-primary)'
                      }}>
                        <strong>Your Answer:</strong> {doubt.resolution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Student Queries */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              Recent Queries Stream ({analytics?.recentDoubts?.length || 0})
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Spot knowledge gaps: Questions marked with ⚠️ mean the topic was not found in your uploaded notes.
            </p>

            {!analytics?.recentDoubts?.length ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No student queries recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analytics.recentDoubts.slice(0, 15).map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem', borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {q.hasSourceMatch ? (
                        <span style={{ color: '#10b981', fontSize: '0.75rem' }} title="Found in your notes">✅</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.75rem' }} title="Not in your notes (potential knowledge gap)">⚠️</span>
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>"{q.question}"</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>— {q.studentName}</span>
                    </div>

                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                      {new Date(q.askedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default DigitalTwinPage;

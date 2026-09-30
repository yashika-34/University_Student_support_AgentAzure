import React, { useState, useEffect, useRef } from 'react';
import { autoGraderAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  FileCheck2, Upload, Sparkles, CheckCircle2, AlertTriangle,
  Loader2, Trash2, Eye, Download, Award, BarChart3,
  BookOpen, FileText, ChevronRight, ArrowRight, RefreshCw,
  Printer, Check, Plus, HelpCircle, User, Calendar
} from 'lucide-react';

const AIAutoGraderPage = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('grade'); // 'grade' | 'archive'
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [questionPapers, setQuestionPapers] = useState([]);

  // Form State
  const [sourceType, setSourceType] = useState('paper'); // 'paper' | 'custom'
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCourse, setCustomCourse] = useState('Computer Science');
  const [customQuestions, setCustomQuestions] = useState('');
  const [customAnswerKey, setCustomAnswerKey] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [examType, setExamType] = useState('midterm');

  // Student & Answer Sheet State
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'text'
  const [uploadFile, setUploadFile] = useState(null);
  const [pastedAnswerText, setPastedAnswerText] = useState('');
  const fileInputRef = useRef();

  // Execution & Results
  const [grading, setGrading] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [syncingMarks, setSyncingMarks] = useState(false);

  // Archive State
  const [evaluations, setEvaluations] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveStats, setArchiveStats] = useState({ totalEvaluated: 0, averageScore: 0, passRate: 0 });
  const [viewModalEval, setViewModalEval] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchQuestionPapers();
    fetchEvaluationsArchive();
  }, []);

  const fetchQuestionPapers = async () => {
    try {
      setLoadingPapers(true);
      const res = await autoGraderAPI.getQuestionPapers();
      const papers = res.data?.papers || [];
      setQuestionPapers(papers);
      if (papers.length > 0) {
        setSelectedPaperId(papers[0]._id);
      }
    } catch (err) {
      console.warn('Could not fetch papers:', err);
    } finally {
      setLoadingPapers(false);
    }
  };

  const fetchEvaluationsArchive = async () => {
    try {
      setLoadingArchive(true);
      const res = await autoGraderAPI.getEvaluations();
      setEvaluations(res.data?.evaluations || []);
      if (res.data?.stats) {
        setArchiveStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Could not fetch evaluations:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleRunAutoGrading = async (e) => {
    e?.preventDefault();
    if (!studentName.trim()) {
      toast.error('Please enter the student name.');
      return;
    }

    if (inputMode === 'file' && !uploadFile) {
      toast.error('Please select an answer sheet image or PDF to evaluate.');
      return;
    }

    if (inputMode === 'text' && !pastedAnswerText.trim()) {
      toast.error('Please paste the student answer transcript.');
      return;
    }

    setGrading(true);
    setCurrentEvaluation(null);

    try {
      const formData = new FormData();
      formData.append('studentName', studentName.trim());
      formData.append('studentRollNo', studentRollNo.trim());
      formData.append('courseName', customCourse);
      formData.append('examType', examType);
      formData.append('maxMarks', String(maxMarks));

      if (sourceType === 'paper' && selectedPaperId) {
        formData.append('questionPaperId', selectedPaperId);
        const qp = questionPapers.find(p => p._id === selectedPaperId);
        formData.append('examTitle', qp ? qp.title : 'AI Paper Evaluation');
      } else {
        formData.append('examTitle', customTitle || 'Custom Exam Evaluation');
        formData.append('customQuestionText', customQuestions);
        formData.append('customAnswerKeyText', customAnswerKey);
      }

      if (inputMode === 'file' && uploadFile) {
        formData.append('file', uploadFile);
      } else {
        formData.append('pastedText', pastedAnswerText);
      }

      const res = await autoGraderAPI.gradeSheet(formData);
      setCurrentEvaluation(res.data.evaluation);
      toast.success('Answer sheet auto-graded successfully! 🎯');
      fetchEvaluationsArchive();
    } catch (err) {
      console.error('Grading error:', err);
      toast.error(err.response?.data?.message || 'Auto-grading failed. Check file format.');
    } finally {
      setGrading(false);
    }
  };

  const handleSyncToGradebook = async (evaluationId) => {
    setSyncingMarks(true);
    try {
      const res = await autoGraderAPI.syncToMarks(evaluationId);
      toast.success(res.data.message || 'Marks synced to Gradebook! 📊');
      if (currentEvaluation && currentEvaluation._id === evaluationId) {
        setCurrentEvaluation(prev => ({ ...prev, syncedToMarks: true }));
      }
      fetchEvaluationsArchive();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync to gradebook.');
    } finally {
      setSyncingMarks(false);
    }
  };

  const handleDeleteEvaluation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this evaluation report?')) return;
    try {
      await autoGraderAPI.deleteEvaluation(id);
      toast.success('Evaluation deleted.');
      if (currentEvaluation?._id === id) setCurrentEvaluation(null);
      fetchEvaluationsArchive();
    } catch (err) {
      toast.error('Failed to delete report.');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredEvaluations = evaluations.filter(e =>
    e.studentName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    e.studentRollNo?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    e.examTitle?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="page-wrapper" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: '1.25rem',
        padding: '2rem 2.25rem',
        marginBottom: '2rem',
        color: '#fff',
        boxShadow: '0 12px 40px rgba(67, 56, 202, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px', width: 220, height: 220,
          background: 'rgba(99,102,241,0.25)', borderRadius: '50%', filter: 'blur(50px)'
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.6rem' }}>
              <Sparkles size={13} style={{ color: '#fbbf24' }} /> AI Vision & Rubric Evaluation Engine
            </div>
            <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.85rem', fontWeight: 800, color: '#fff' }}>
              AI Answer Sheet Auto-Grader
            </h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(255,255,255,0.8)', maxWidth: 560, lineHeight: 1.5 }}>
              Upload handwritten photos or typed PDF answer sheets. AI transcribes handwriting, checks step-by-step against your marking scheme, and generates transparent feedback.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Evaluated Sheets', value: archiveStats.totalEvaluated || 0, icon: <FileCheck2 size={18} /> },
              { label: 'Class Average', value: `${archiveStats.averageScore || 0}%`, icon: <BarChart3 size={18} /> },
              { label: 'Pass Rate', value: `${archiveStats.passRate || 0}%`, icon: <Award size={18} /> }
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                borderRadius: '0.85rem', padding: '0.85rem 1.25rem', border: '1px solid rgba(255,255,255,0.15)',
                textAlign: 'center', minWidth: 105
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', color: '#fbbf24', marginBottom: '0.2rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.75rem', paddingBottom: '0.25rem'
      }}>
        <button
          onClick={() => setActiveTab('grade')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.25rem', borderRadius: '0.5rem 0.5rem 0 0',
            border: 'none', background: activeTab === 'grade' ? 'var(--bg-card)' : 'transparent',
            borderBottom: activeTab === 'grade' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'grade' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <Sparkles size={16} /> 1. Grade Answer Sheet
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.25rem', borderRadius: '0.5rem 0.5rem 0 0',
            border: 'none', background: activeTab === 'archive' ? 'var(--bg-card)' : 'transparent',
            borderBottom: activeTab === 'archive' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'archive' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <FileText size={16} /> 2. Evaluated Archive ({evaluations.length})
        </button>
      </div>

      {/* ── TAB 1: GRADE NEW ANSWER SHEET ── */}
      {activeTab === 'grade' && (
        <div style={{ display: 'grid', gridTemplateColumns: currentEvaluation ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Form Setup Card (Left Column when evaluating, full width if alone) */}
          {(!currentEvaluation || grading) && (
            <div className="card" style={{ padding: '1.75rem', borderRadius: '1rem', gridColumn: currentEvaluation ? '1 / -1' : undefined }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Exam & Student Details
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Select an AI-generated question paper or define custom questions, then upload the student's submission.
                </p>
              </div>

              <form onSubmit={handleRunAutoGrading}>
                
                {/* Source Selection (AI Paper vs Custom) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Question Paper & Rubric Source</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSourceType('paper')}
                      style={{
                        padding: '0.6rem', borderRadius: '0.5rem',
                        border: sourceType === 'paper' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: sourceType === 'paper' ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                        color: sourceType === 'paper' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                      }}
                    >
                      📚 From AI Question Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType('custom')}
                      style={{
                        padding: '0.6rem', borderRadius: '0.5rem',
                        border: sourceType === 'custom' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: sourceType === 'custom' ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                        color: sourceType === 'custom' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                      }}
                    >
                      ✏️ Custom Questions & Key
                    </button>
                  </div>
                </div>

                {/* Source Option A: Existing Question Paper */}
                {sourceType === 'paper' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Select Generated Exam Paper</label>
                    {questionPapers.length === 0 ? (
                      <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        No saved papers found. Switch to "Custom Questions" or generate one in AI Paper Generator.
                      </div>
                    ) : (
                      <select
                        className="form-input"
                        value={selectedPaperId}
                        onChange={e => setSelectedPaperId(e.target.value)}
                        style={{ fontSize: '0.88rem' }}
                      >
                        {questionPapers.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.title} ({p.examType} - {p.totalMarks} Marks)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Source Option B: Custom Questions & Answer Key */}
                {sourceType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Exam Title & Course</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Midterm 1 - Algorithms"
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Questions / Marking Scheme</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Paste question prompts and expected solutions..."
                        value={customQuestions}
                        onChange={e => setCustomQuestions(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Student Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Student Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rahul Sharma"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Roll Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS2024-042"
                      value={studentRollNo}
                      onChange={e => setStudentRollNo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Answer Sheet Upload (File vs Text) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                      Answer Sheet Input
                    </label>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        type="button"
                        onClick={() => setInputMode('file')}
                        style={{
                          padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: 'none',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          background: inputMode === 'file' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: inputMode === 'file' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        📷 Photo / PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('text')}
                        style={{
                          padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: 'none',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          background: inputMode === 'text' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: inputMode === 'text' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        ✏️ Paste Text
                      </button>
                    </div>
                  </div>

                  {inputMode === 'file' ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-subtle)', borderRadius: '0.75rem',
                        padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer',
                        background: 'var(--bg-secondary)', transition: 'all 0.15s'
                      }}
                    >
                      <Upload size={28} style={{ color: 'var(--accent-primary)', marginBottom: '0.4rem' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {uploadFile ? uploadFile.name : 'Upload Handwritten Photo or PDF Answer Sheet'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Supports JPG, PNG (Handwritten Vision OCR) and PDF documents up to 15MB
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={e => setUploadFile(e.target.files[0] || null)}
                      />
                    </div>
                  ) : (
                    <textarea
                      className="form-input"
                      rows={5}
                      placeholder="Paste transcribed student answers or typed solution text here..."
                      value={pastedAnswerText}
                      onChange={e => setPastedAnswerText(e.target.value)}
                    />
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={grading}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '0.75rem', fontSize: '0.92rem',
                    fontWeight: 700, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.5rem', borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {grading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Transcribing Handwriting & Auto-Grading...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Run Step-by-Step AI Auto-Grading
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Right Column / Full Width Report Card */}
          {currentEvaluation && (
            <div className="card" style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
              
              {/* Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎓</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                        {currentEvaluation.studentName}
                      </h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Roll No: {currentEvaluation.studentRollNo || 'N/A'} &nbsp;•&nbsp; 
                        Exam: {currentEvaluation.examTitle} &nbsp;•&nbsp;
                        Date: {new Date(currentEvaluation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleSyncToGradebook(currentEvaluation._id)}
                    disabled={syncingMarks || currentEvaluation.syncedToMarks}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                      background: currentEvaluation.syncedToMarks ? '#10b981' : undefined
                    }}
                  >
                    {syncingMarks ? <Loader2 size={14} className="animate-spin" /> : currentEvaluation.syncedToMarks ? <Check size={14} /> : <BarChart3 size={14} />}
                    {currentEvaluation.syncedToMarks ? 'Synced to Gradebook ✓' : 'Sync to Gradebook'}
                  </button>

                  <button
                    onClick={handlePrintReport}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Printer size={14} /> Print
                  </button>

                  <button
                    onClick={() => setCurrentEvaluation(null)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem' }}
                  >
                    Grade Another
                  </button>
                </div>
              </div>

              {/* Score Banner */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem',
                alignItems: 'center', background: 'var(--bg-secondary)',
                padding: '1.25rem 1.5rem', borderRadius: '0.85rem', marginBottom: '1.5rem',
                border: '1px solid var(--border-subtle)'
              }}>
                {/* Score Badge */}
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: currentEvaluation.percentage >= 75 ? 'linear-gradient(135deg, #10b981, #059669)' : currentEvaluation.percentage >= 50 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)', flexShrink: 0
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{currentEvaluation.obtainedMarks}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>/ {currentEvaluation.maxMarks}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '0.2rem' }}>Grade {currentEvaluation.gradeLetter}</div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700 }}>Examiner Feedback</h4>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {currentEvaluation.overallFeedback}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Percentage: <strong>{currentEvaluation.percentage}%</strong></span>
                    <span>Status: <strong style={{ color: currentEvaluation.percentage >= 40 ? '#10b981' : '#ef4444' }}>{currentEvaluation.percentage >= 40 ? 'PASS' : 'NEEDS IMPROVEMENT'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Key Improvement Tips */}
              {currentEvaluation.improvementTips?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    💡 Actionable Improvement Points for Student
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {currentEvaluation.improvementTips.map((tip, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                        fontSize: '0.82rem', color: 'var(--text-secondary)'
                      }}>
                        • {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question-by-Question Deep Dive */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                  Question-by-Question Evaluation Breakdown
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentEvaluation.questionBreakdown?.map((q, idx) => (
                    <div key={idx} style={{
                      padding: '1rem 1.25rem', borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {q.questionNumber}: {q.questionText || 'Question item'}
                        </span>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800,
                          background: q.awardedMarks === q.maxMarks ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: q.awardedMarks === q.maxMarks ? '#10b981' : '#ef4444',
                          border: `1px solid ${q.awardedMarks === q.maxMarks ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                        }}>
                          +{q.awardedMarks} / {q.maxMarks} Marks
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '0.4rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>✅ Strengths:</span>
                          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)' }}>{q.strengths || 'Accurate response.'}</p>
                        </div>
                        <div style={{ padding: '0.5rem', borderRadius: '0.4rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <span style={{ fontWeight: 700, color: '#ef4444' }}>⚠️ Deductions:</span>
                          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)' }}>{q.deductionReason || q.mistakes || 'No errors.'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ── TAB 2: EVALUATION ARCHIVE & REPORTS ── */}
      {activeTab === 'archive' && (
        <div className="card" style={{ padding: '1.75rem', borderRadius: '1rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Evaluated Answer Sheets Archive</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                View, sync to marks gradebook, or print past auto-graded exam evaluations.
              </p>
            </div>

            <div style={{ width: 260 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search student or exam..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {loadingArchive ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Loading evaluations...</p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <FileCheck2 size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No evaluations recorded yet. Run your first auto-grading!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Student</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Exam Title</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Score</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Grade</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Gradebook</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.map(e => (
                    <tr key={e._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.studentName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{e.studentRollNo || 'No roll'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {e.examTitle}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {e.obtainedMarks} / {e.maxMarks}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginLeft: '0.3rem' }}>
                          ({e.percentage}%)
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.45rem', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 800,
                          background: e.percentage >= 70 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: e.percentage >= 70 ? '#10b981' : '#ef4444'
                        }}>
                          {e.gradeLetter}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {e.syncedToMarks ? (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Synced ✓</span>
                        ) : (
                          <button
                            onClick={() => handleSyncToGradebook(e._id)}
                            style={{
                              background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)',
                              border: '1px solid rgba(99,102,241,0.25)', borderRadius: '0.3rem',
                              padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600
                            }}
                          >
                            Sync Now
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => setViewModalEval(e)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title="View Full Report"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            onClick={() => handleDeleteEvaluation(e._id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--text-secondary)', padding: '0.3rem'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── View Evaluation Modal ── */}
      {viewModalEval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', zIndex: 9999
        }}>
          <div className="card" style={{
            maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            padding: '1.75rem', borderRadius: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{viewModalEval.studentName}'s Report</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Exam: {viewModalEval.examTitle} &nbsp;•&nbsp; Score: {viewModalEval.obtainedMarks} / {viewModalEval.maxMarks} ({viewModalEval.percentage}%)
                </div>
              </div>
              <button
                onClick={() => setViewModalEval(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.9rem', fontWeight: 700 }}>Overall Evaluation</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {viewModalEval.overallFeedback}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {viewModalEval.questionBreakdown?.map((q, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem' }}>
                    <span>{q.questionNumber}: {q.questionText}</span>
                    <span style={{ color: q.awardedMarks === q.maxMarks ? '#10b981' : '#ef4444' }}>
                      +{q.awardedMarks} / {q.maxMarks}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    <div><strong>Strengths:</strong> {q.strengths}</div>
                    <div style={{ marginTop: '0.15rem' }}><strong>Deduction:</strong> {q.deductionReason || q.mistakes}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', gap: '0.5rem' }}>
              <button
                onClick={() => setViewModalEval(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIAutoGraderPage;

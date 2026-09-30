import React, { useState, useEffect, useMemo } from 'react';
import { 
  UploadCloud, FileText, CheckCircle, Settings, ChevronRight, Loader2, PlayCircle, 
  Key, Printer, Download, History, Book, Target, Layers, FileDigit, ShieldQuestion, 
  Focus, Sparkles, Maximize2, Sliders, RefreshCw, BookOpen, Tag, HelpCircle, Check, 
  ChevronDown 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api, { flashcardAPI } from '../services/api.js';


export default function AIPaperGenerator() {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('Mid-Term');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [totalMarks, setTotalMarks] = useState(100);
  const [objectiveCount, setObjectiveCount] = useState(10);
  const [subjectiveCount, setSubjectiveCount] = useState(5);
  const [specificTopics, setSpecificTopics] = useState('');  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [result, setResult] = useState(null); // { generatedPaper, answerKey, variants: [...] }
  const [viewMode, setViewMode] = useState('paper'); // 'paper' | 'key' | 'flashcards'
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(-1); // -1 is original paper
  const [generatingVariant, setGeneratingVariant] = useState(false);
  

  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/teacher/question-paper/my-papers');
      if (res.data?.data) {
        setHistory(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      if (droppedFiles.length > 0) {
        setFiles(prev => [...prev, ...droppedFiles]);
      } else {
        setError('Only PDF files are allowed.');
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one syllabus PDF.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('syllabus', f));
      formData.append('title', title);
      formData.append('examType', examType);
      formData.append('difficulty', difficulty);
      formData.append('totalMarks', totalMarks);
      formData.append('objectiveCount', objectiveCount);
      formData.append('subjectiveCount', subjectiveCount);
      if (specificTopics) {
        formData.append('specificTopics', specificTopics);
      }

      const res = await api.post('/teacher/question-paper/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data?.data) {
        setResult(res.data.data);
        setSelectedVariantIndex(-1);
        fetchHistory(); // refresh history
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate paper. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVariant = async () => {
    if (!result?._id) return;
    setGeneratingVariant(true);
    try {
      const res = await api.post(`/teacher/question-paper/${result._id}/variant`, {
        objectiveCount,
        subjectiveCount
      });
      if (res.data?.data) {
        setResult(res.data.data);
        // Switch to the newly generated variant
        setSelectedVariantIndex(res.data.data.variants.length - 1);
        fetchHistory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate variant');
    } finally {
      setGeneratingVariant(false);
    }
  };

  const loadPastPaper = (paper) => {
    setResult(paper);
    setSelectedVariantIndex(-1); // load original by default
    setViewMode('paper');
  };
  const handleDownload = () => {
    if (!result) return;
    const currentView = selectedVariantIndex >= 0 ? result.variants[selectedVariantIndex] : result;
    const content = viewMode === 'paper' ? currentView.generatedPaper : currentView.answerKey;
    const filename = `${result.title.replace(/\s+/g, '_')}_${viewMode}.md`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!result) return;
    const currentView = selectedVariantIndex >= 0 ? result.variants[selectedVariantIndex] : result;
    const content = viewMode === 'paper' ? currentView.generatedPaper : currentView.answerKey;
    const titleText = `${result.title} — ${viewMode === 'paper' ? 'Examination Paper' : 'Model Answer Key'}`;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please enable pop-ups in your browser to view and save the exam paper as PDF.');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${titleText}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.6;
      font-size: 11pt;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 17pt;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header h2 {
      margin: 4px 0 0 0;
      font-size: 13pt;
      color: #374151;
      font-weight: 600;
    }
    .meta-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 20px;
      font-size: 10pt;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .paper-text {
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.7;
    }
    h2, h3, h4 { color: #1e3a8a; margin-top: 16px; margin-bottom: 8px; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>University Examination Division</h1>
    <h2>${result.title}</h2>
    <div style="font-size: 10pt; color: #4b5563; margin-top: 4px;">
      ${result.examType} &bull; Academic Session 2026
    </div>
  </div>
  <div class="meta-box">
    <div><strong>Max Marks:</strong> ${result.totalMarks}</div>
    <div><strong>Difficulty:</strong> ${result.difficulty}</div>
    <div><strong>Duration:</strong> 3 Hours</div>
    <div><strong>Section:</strong> ${viewMode === 'paper' ? 'Official Question Paper' : 'Model Answer Key'}</div>
    <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
    <div><strong>Approved:</strong> Examination Board</div>
  </div>
  <div class="paper-text">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
      
      {/* Main Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            AI Question Paper Generator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Upload your syllabus PDF and automatically generate a balanced examination paper with answer keys using Azure OpenAI.</p>
        </div>

        {!result ? (
          <form onSubmit={handleGenerate} className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} color="var(--primary)" /> Exam Configuration
            </h2>

            {error && (
              <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Book size={14} color="var(--text-muted)"/> Subject / Title</label>
                <input required className="form-input" style={{ background: 'var(--bg-input)' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced Data Structures" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Target size={14} color="var(--text-muted)"/> Exam Type</label>
                <select className="form-input" style={{ background: 'var(--bg-input)' }} value={examType} onChange={(e) => setExamType(e.target.value)}>
                  <option>Mid-Term</option>
                  <option>End-Term</option>
                  <option>Quiz</option>
                  <option>Assignment</option>
                  <option>Practice Test</option>
                </select>
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileDigit size={14} color="var(--text-muted)"/> Total Marks</label>
                <input type="number" required className="form-input" style={{ background: 'var(--bg-input)' }} value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldQuestion size={14} color="var(--text-muted)"/> Objective (MCQs) Count</label>
                <input type="number" required className="form-input" style={{ background: 'var(--bg-input)' }} value={objectiveCount} onChange={(e) => setObjectiveCount(e.target.value)} />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Settings size={14} color="var(--text-muted)"/> Difficulty Level</label>
                <select className="form-input" style={{ background: 'var(--bg-input)' }} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option>Mixed (Recommended)</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Layers size={14} color="var(--text-muted)"/> Subjective Questions Count</label>
                <input type="number" required className="form-input" style={{ background: 'var(--bg-input)' }} value={subjectiveCount} onChange={(e) => setSubjectiveCount(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Focus size={14} color="var(--text-muted)"/> Specific Topics to Focus On (Optional)</label>
                <input className="form-input" style={{ background: 'var(--bg-input)' }} value={specificTopics} onChange={(e) => setSpecificTopics(e.target.value)} placeholder="e.g. Dynamic Programming, Trees, Graph Algorithms" />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>If left blank, the AI will generate questions covering the entire syllabus.</div>
              </div>
            </div>

            <div className="form-group" style={{ margin: '0 0 2.5rem 0' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UploadCloud size={14} color="var(--text-muted)"/> Upload Syllabus & Materials (Multiple PDFs allowed)</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                  border: files.length > 0 ? '2px solid var(--success)' : '2px dashed var(--border-focus)',
                  borderRadius: '12px',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  background: files.length > 0 ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('syllabus-upload').click()}
                onMouseEnter={(e) => files.length === 0 && (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => files.length === 0 && (e.currentTarget.style.borderColor = 'var(--border-focus)')}
              >
                <input
                  type="file"
                  id="syllabus-upload"
                  accept="application/pdf"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.length && setFiles(prev => [...prev, ...Array.from(e.target.files)])}
                />
                {files.length > 0 ? (
                  <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem', opacity: 0.9, animation: 'pulse 2s infinite' }} />
                ) : (
                  <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                )}
                
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: files.length > 0 ? 'var(--success)' : 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {files.length > 0 ? `${files.length} file(s) selected` : 'Drag & drop syllabus PDFs here'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {files.length > 0 ? files.map(f => f.name).join(', ') : 'or click to browse from computer'}
                </div>
                {files.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFiles([]); }} className="btn btn-sm" style={{ color: 'var(--danger)', fontSize: '0.8rem', border: '1px solid var(--danger)' }}>Clear Files</button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <PlayCircle size={20} />} 
              {loading ? 'AI is extracting text & generating paper...' : 'Generate AI Question Paper'}
            </button>
          </form>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>{result.title}</h2>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{result.examType}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Settings size={14}/> {result.difficulty}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileDigit size={14}/> {result.totalMarks} Marks</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {result.variants && result.variants.length > 0 && (
                  <select 
                    className="form-input" 
                    style={{ padding: '0.3rem 0.5rem', width: 'auto', marginRight: '0.5rem' }}
                    value={selectedVariantIndex} 
                    onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                  >
                    <option value={-1}>Original Paper</option>
                    {result.variants.map((v, i) => (
                      <option key={i} value={i}>{v.variantName}</option>
                    ))}
                  </select>
                )}
                
                <button onClick={handleGenerateVariant} disabled={generatingVariant} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white', border: 'none' }}>
                  {generatingVariant ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                  {generatingVariant ? 'Generating...' : 'Generate Variant'}
                </button>
                <button onClick={handleExportPDF} className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}>
                  <Printer size={16} /> Export to PDF
                </button>
                <button onClick={handleDownload} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={16} /> Download .md
                </button>
                <button onClick={() => { setResult(null); setFiles([]); setSelectedVariantIndex(-1); }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  New Paper
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setViewMode('paper')} 
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.25rem', fontSize: '1.05rem', fontWeight: 600, 
                  color: viewMode === 'paper' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: viewMode === 'paper' ? '3px solid var(--primary)' : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}>
                <FileText size={18} /> Generated Paper
              </button>
              <button 
                onClick={() => setViewMode('key')} 
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.25rem', fontSize: '1.05rem', fontWeight: 600, 
                  color: viewMode === 'key' ? 'var(--accent-purple)' : 'var(--text-muted)',
                  borderBottom: viewMode === 'key' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}>
                <Key size={18} /> Answer Key
              </button>
            </div>

            <div className="markdown-body printable-area" style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '1.05rem', minHeight: '500px' }}>
              <ReactMarkdown>
                {viewMode === 'paper' 
                  ? (selectedVariantIndex >= 0 ? result.variants[selectedVariantIndex].generatedPaper : result.generatedPaper)
                  : (selectedVariantIndex >= 0 ? result.variants[selectedVariantIndex].answerKey : result.answerKey)}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="var(--primary)" /> Paper Repository
        </h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No papers generated yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((paper) => (
              <div 
                key={paper._id} 
                onClick={() => loadPastPaper(paper)}
                style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{paper.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{paper.examType}</span>
                  <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>



      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; color: #000; background: #fff; }
          .glass-panel { box-shadow: none; border: none; }
        }
      `}</style>
    </div>
  );
}

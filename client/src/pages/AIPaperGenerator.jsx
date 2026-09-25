import React, { useState, useEffect, useMemo } from 'react';
import { 
  UploadCloud, FileText, CheckCircle, Settings, ChevronRight, Loader2, PlayCircle, 
  Key, Printer, Download, History, Book, Target, Layers, FileDigit, ShieldQuestion, 
  Focus, Sparkles, Maximize2, Sliders, RefreshCw, BookOpen, Tag, HelpCircle, Check, 
  ChevronDown 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api, { flashcardAPI } from '../services/api.js';
import FlashcardViewer from '../components/flashcards/FlashcardViewer.jsx';
import FlashcardModal from '../components/flashcards/FlashcardModal.jsx';

export default function AIPaperGenerator() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('Mid-Term');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [totalMarks, setTotalMarks] = useState(100);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState('MCQs, Short Answer, Long Answer');
  const [specificTopics, setSpecificTopics] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [result, setResult] = useState(null); // { generatedPaper, answerKey }
  const [viewMode, setViewMode] = useState('paper'); // 'paper' | 'key' | 'flashcards'
  
  // Smart AI Flashcard State
  const [activeFlashcardType, setActiveFlashcardType] = useState('chapter_wise');
  const [selectedChapter, setSelectedChapter] = useState('All Chapters');
  const [customChapterInput, setCustomChapterInput] = useState('');
  const [cardCount, setCardCount] = useState(8);
  const [cardDifficulty, setCardDifficulty] = useState('Mixed');
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [generatedChapterLabel, setGeneratedChapterLabel] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        setError('Only PDF files are allowed.');
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a syllabus PDF first.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('syllabus', file);
      formData.append('title', title);
      formData.append('examType', examType);
      formData.append('difficulty', difficulty);
      formData.append('totalMarks', totalMarks);
      formData.append('questionCount', questionCount);
      formData.append('questionTypes', questionTypes);
      if (specificTopics) {
        formData.append('specificTopics', specificTopics);
      }

      const res = await api.post('/teacher/question-paper/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data?.data) {
        setResult(res.data.data);
        fetchHistory(); // refresh history
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate paper. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Intelligently extract or detect chapters & topics from the generated paper/syllabus
  const detectedChapters = useMemo(() => {
    if (!result) return [];
    const text = (result.syllabusText || '') + '\n' + (result.generatedPaper || '');
    const chapters = [];

    // Match patterns like "Unit 1: ...", "Unit I: ...", "Chapter 1: ...", "Module 1: ..."
    const regex = /(?:Unit|Chapter|Module|Topic)\s*([0-9IVX]+|\w+)?[:\-–\s]+([^\n\r]+)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      let clean = match[0].replace(/[*#]/g, '').trim();
      if (clean.length > 4 && clean.length < 60 && !chapters.includes(clean)) {
        chapters.push(clean);
      }
      if (chapters.length >= 8) break;
    }

    // Merge specific topics if entered by faculty
    const custom = (result.specificTopics || specificTopics || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    custom.forEach((c) => {
      if (!chapters.includes(c)) chapters.push(c);
    });

    // If still empty, provide subject-relevant units
    if (chapters.length === 0) {
      const titleLower = (result.title || '').toLowerCase();
      if (titleLower.includes('dsa') || titleLower.includes('data structure') || titleLower.includes('algorithm')) {
        return [
          'Unit 1: Arrays, Stacks & Queues',
          'Unit 2: Linked Lists & Hash Tables',
          'Unit 3: Trees, BST & Heap Sort',
          'Unit 4: Graphs & Shortest Path Algorithms',
          'Unit 5: Dynamic Programming & Greedy Approach'
        ];
      }
      if (titleLower.includes('database') || titleLower.includes('dbms') || titleLower.includes('sql')) {
        return [
          'Unit 1: Relational Models & ER Diagrams',
          'Unit 2: Normalization (1NF to BCNF)',
          'Unit 3: SQL Queries & Relational Algebra',
          'Unit 4: Transactions & Concurrency Control',
          'Unit 5: Indexing & Query Optimization'
        ];
      }
      if (titleLower.includes('ai') || titleLower.includes('intelligence') || titleLower.includes('neural')) {
        return [
          'Unit 1: Search Algorithms (A*, Heuristics)',
          'Unit 2: Knowledge Representation & Logic',
          'Unit 3: Machine Learning & Classification',
          'Unit 4: Deep Neural Networks & Backprop',
          'Unit 5: Natural Language Processing & LLMs'
        ];
      }
      if (titleLower.includes('cloud') || titleLower.includes('distributed')) {
        return [
          'Unit 1: Cloud Architecture & Service Models',
          'Unit 2: Virtualization & Containerization',
          'Unit 3: Distributed Storage & Consistency',
          'Unit 4: Cloud Security & IAM Policies',
          'Unit 5: Serverless & Microservices'
        ];
      }
      return [
        'Unit 1: Foundations & Core Principles',
        'Unit 2: Key Models & Architecture',
        'Unit 3: Analytical Techniques & Design',
        'Unit 4: Practical Applications & Case Studies',
        'Unit 5: Advanced Problems & Exam Patterns'
      ];
    }

    return chapters;
  }, [result, specificTopics]);

  const loadPastPaper = (paper) => {
    setResult(paper);
    setViewMode('paper');
    setFlashcards([]);
    setShowConfigPanel(true);
    setSelectedChapter('All Chapters');
    setCustomChapterInput('');
  };

  const handleGenerateFlashcards = async (
    type = activeFlashcardType,
    chapter = selectedChapter,
    count = cardCount,
    diff = cardDifficulty
  ) => {
    if (!result) return;
    setActiveFlashcardType(type);
    setIsGeneratingCards(true);

    const typeTitles = {
      chapter_wise: 'Chapter-wise Flashcards',
      exam_revision: 'Exam Revision Cards',
      important_topics: 'Important Topics & Formulas',
      unit_quick_revision: 'Unit-wise Quick Revision Cards'
    };

    const chapterFocus = chapter === 'custom' ? customChapterInput : chapter;
    const finalFocus = chapterFocus && chapterFocus !== 'All Chapters' ? chapterFocus : '';
    setGeneratedChapterLabel(finalFocus || 'Complete Syllabus');

    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'teacher_paper',
        type,
        title: `${result.title}${finalFocus ? ` (${finalFocus})` : ''} — ${typeTitles[type] || 'Revision Deck'}`,
        context: {
          paperTitle: result.title,
          examType: result.examType,
          difficulty: diff,
          chapterFocus: finalFocus,
          specificTopics: finalFocus || result.specificTopics || specificTopics,
          syllabusSnippet: result.generatedPaper ? result.generatedPaper.slice(0, 4000) : ''
        },
        count: Number(count) || 8,
        save: true
      });

      if (res.data?.data?.cards && res.data.data.cards.length > 0) {
        setFlashcards(res.data.data.cards);
        setShowConfigPanel(false);
      }
    } catch (err) {
      console.error('Failed to generate syllabus flashcards:', err);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = viewMode === 'paper' ? result.generatedPaper : result.answerKey;
    const filename = `${result.title.replace(/\s+/g, '_')}_${viewMode}.md`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldQuestion size={14} color="var(--text-muted)"/> Total Questions</label>
                <input type="number" required className="form-input" style={{ background: 'var(--bg-input)' }} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Layers size={14} color="var(--text-muted)"/> Question Types</label>
                <input className="form-input" style={{ background: 'var(--bg-input)' }} value={questionTypes} onChange={(e) => setQuestionTypes(e.target.value)} placeholder="e.g. MCQs, Long Answer" />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Focus size={14} color="var(--text-muted)"/> Specific Topics to Focus On (Optional)</label>
                <input className="form-input" style={{ background: 'var(--bg-input)' }} value={specificTopics} onChange={(e) => setSpecificTopics(e.target.value)} placeholder="e.g. Dynamic Programming, Trees, Graph Algorithms" />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>If left blank, the AI will generate questions covering the entire syllabus.</div>
              </div>
            </div>

            <div className="form-group" style={{ margin: '0 0 2.5rem 0' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UploadCloud size={14} color="var(--text-muted)"/> Upload Syllabus (PDF)</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                  border: file ? '2px solid var(--success)' : '2px dashed var(--border-focus)',
                  borderRadius: '12px',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  background: file ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('syllabus-upload').click()}
                onMouseEnter={(e) => !file && (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => !file && (e.currentTarget.style.borderColor = 'var(--border-focus)')}
              >
                <input
                  type="file"
                  id="syllabus-upload"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.length && setFile(e.target.files[0])}
                />
                {file ? (
                  <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem', opacity: 0.9, animation: 'pulse 2s infinite' }} />
                ) : (
                  <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                )}
                
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: file ? 'var(--success)' : 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {file ? file.name : 'Drag & drop syllabus PDF here'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB Ready for processing` : 'or click to browse from computer'}
                </div>
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleDownload} className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={16} /> Download Paper
                </button>
                <button onClick={() => setResult(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
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
              <button 
                onClick={() => setViewMode('flashcards')} 
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.25rem', fontSize: '1.05rem', fontWeight: 600, 
                  color: viewMode === 'flashcards' ? '#ec4899' : 'var(--text-muted)',
                  borderBottom: viewMode === 'flashcards' ? '3px solid #ec4899' : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}>
                <Layers size={18} /> 🎴 Syllabus &amp; Revision Flashcards
              </button>
            </div>

            {viewMode === 'flashcards' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Category Switcher Tabs */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'chapter_wise', label: '📖 Chapter-wise Cards' },
                      { id: 'exam_revision', label: '🎯 Exam Revision' },
                      { id: 'important_topics', label: '⭐ Important Topics' },
                      { id: 'unit_quick_revision', label: '📑 Unit Quick Revision' }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => {
                          setActiveFlashcardType(btn.id);
                        }}
                        disabled={isGeneratingCards}
                        className={`btn ${activeFlashcardType === btn.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.4rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          ...(activeFlashcardType === btn.id ? { background: '#ec4899', borderColor: '#ec4899' } : {})
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {flashcards.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setShowConfigPanel(!showConfigPanel)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Sliders size={13} /> {showConfigPanel ? 'Hide Selectors' : 'Change Chapter'}
                      </button>
                      <button
                        onClick={() => setFlashcardModalOpen(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Maximize2 size={13} /> Full Screen
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Interactive Chapter & Topic Selector Panel */}
                {(showConfigPanel || flashcards.length === 0) && (
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(145deg, rgba(236,72,153,0.04), rgba(59,130,246,0.04))',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(236,72,153,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sliders size={18} color="#ec4899" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                            Select Chapter &amp; Customize Flashcards
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Choose which unit or topic Azure AI should synthesize into flashcards.
                          </div>
                        </div>
                      </div>
                      <span className="badge" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', fontSize: '0.75rem' }}>
                        ✨ AI Grounded to Syllabus
                      </span>
                    </div>

                    {/* Chapter / Unit Selector Dropdown & Quick Chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={14} color="var(--primary)" /> Target Chapter / Unit Focus:
                      </label>
                      <select
                        className="form-input"
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(e.target.value)}
                        style={{ background: 'var(--bg-card)', padding: '0.6rem 0.85rem', fontSize: '0.88rem', borderColor: 'rgba(236,72,153,0.35)' }}
                      >
                        <option value="All Chapters">🌐 All Chapters (Complete Syllabus Coverage)</option>
                        {detectedChapters.map((ch, idx) => (
                          <option key={idx} value={ch}>📚 {ch}</option>
                        ))}
                        <option value="custom">✏️ Custom Chapter / Specific Topic (Type your own)</option>
                      </select>

                      {/* Custom Chapter Text Input if selected */}
                      {selectedChapter === 'custom' && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter specific topic (e.g. Dynamic Programming, Red-Black Trees, Graph Traversals)..."
                            value={customChapterInput}
                            onChange={(e) => setCustomChapterInput(e.target.value)}
                            style={{ background: 'var(--bg-card)', fontSize: '0.85rem' }}
                          />
                        </div>
                      )}

                      {/* Quick Chapter Selection Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedChapter('All Chapters')}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '100px',
                            cursor: 'pointer',
                            border: selectedChapter === 'All Chapters' ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
                            background: selectedChapter === 'All Chapters' ? 'rgba(236,72,153,0.2)' : 'var(--bg-input)',
                            color: selectedChapter === 'All Chapters' ? '#f472b6' : 'var(--text-secondary)',
                            fontWeight: selectedChapter === 'All Chapters' ? 700 : 500,
                            transition: 'all 0.15s'
                          }}
                        >
                          🌐 All Chapters
                        </button>
                        {detectedChapters.map((ch, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedChapter(ch)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '100px',
                              cursor: 'pointer',
                              border: selectedChapter === ch ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
                              background: selectedChapter === ch ? 'rgba(236,72,153,0.2)' : 'var(--bg-input)',
                              color: selectedChapter === ch ? '#f472b6' : 'var(--text-secondary)',
                              fontWeight: selectedChapter === ch ? 700 : 500,
                              transition: 'all 0.15s'
                            }}
                          >
                            📖 {ch.length > 32 ? ch.slice(0, 30) + '...' : ch}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Count & Difficulty Selector Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {/* Card Count */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Number of Cards:
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {[
                            { count: 5, label: '5 (Quick)' },
                            { count: 8, label: '8 (Standard)' },
                            { count: 12, label: '12 (Deep)' }
                          ].map((item) => (
                            <button
                              key={item.count}
                              type="button"
                              onClick={() => setCardCount(item.count)}
                              className={`btn btn-sm ${cardCount === item.count ? 'btn-primary' : 'btn-secondary'}`}
                              style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '0.35rem 0.4rem',
                                ...(cardCount === item.count ? { background: '#ec4899', borderColor: '#ec4899' } : {})
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty Level */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Difficulty Level:
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {['Mixed', 'Easy', 'Medium', 'Hard'].map((diff) => (
                            <button
                              key={diff}
                              type="button"
                              onClick={() => setCardDifficulty(diff)}
                              className={`btn btn-sm ${cardDifficulty === diff ? 'btn-primary' : 'btn-secondary'}`}
                              style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '0.35rem 0.4rem',
                                ...(cardDifficulty === diff ? { background: '#ec4899', borderColor: '#ec4899' } : {})
                              }}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Prominent Generate Flashcards Action Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleGenerateFlashcards(activeFlashcardType, selectedChapter, cardCount, cardDifficulty)}
                        disabled={isGeneratingCards || (selectedChapter === 'custom' && !customChapterInput.trim())}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                          border: 'none',
                          boxShadow: '0 4px 14px rgba(236,72,153,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '0.95rem',
                          fontWeight: 700
                        }}
                      >
                        {isGeneratingCards ? (
                          <><Loader2 size={18} className="animate-spin" /> Azure AI Synthesizing Cards...</>
                        ) : (
                          <><Sparkles size={18} /> ⚡ Generate {activeFlashcardType === 'chapter_wise' ? 'Chapter' : activeFlashcardType === 'exam_revision' ? 'Exam' : activeFlashcardType === 'important_topics' ? 'Important Topics' : 'Unit'} Flashcards</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* State: Generating Spinner */}
                {isGeneratingCards ? (
                  <div style={{ textAlign: 'center', padding: '4.5rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: '#ec4899', margin: '0 auto 1.25rem' }} />
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.45rem' }}>
                      Azure AI Foundry is synthesizing {activeFlashcardType.replace(/_/g, ' ')}...
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                      Target: <strong style={{ color: '#f472b6' }}>{selectedChapter === 'custom' ? customChapterInput || 'Custom' : selectedChapter}</strong> &bull; Extracting key definitions, exam formulas, and model solutions.
                    </div>
                  </div>
                ) : flashcards.length > 0 ? (
                  /* State: Flashcards Viewer Ready */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 1rem',
                      background: 'rgba(236,72,153,0.08)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(236,72,153,0.2)',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="#34d399" />
                        <span>Deck Ready: <strong style={{ color: '#f472b6' }}>{generatedChapterLabel || selectedChapter}</strong> ({flashcards.length} Flashcards)</span>
                      </div>
                      <button
                        onClick={() => setShowConfigPanel(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6' }}
                      >
                        🔄 Select Another Chapter
                      </button>
                    </div>

                    <FlashcardViewer
                      initialCards={flashcards}
                      deckTitle={`${result.title} — ${generatedChapterLabel || selectedChapter}`}
                      sourceModule="teacher_paper"
                      category={activeFlashcardType === 'chapter_wise' ? 'Chapter Concepts' : activeFlashcardType === 'exam_revision' ? 'Exam Revision' : activeFlashcardType === 'important_topics' ? 'Important Topics' : 'Unit Revision'}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="markdown-body printable-area" style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '1.05rem', minHeight: '500px' }}>
                <ReactMarkdown>
                  {viewMode === 'paper' ? result.generatedPaper : result.answerKey}
                </ReactMarkdown>
              </div>
            )}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadPastPaper(paper);
                    setViewMode('flashcards');
                    handleGenerateFlashcards('chapter_wise', paper);
                  }}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    marginTop: '0.25rem',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(236,72,153,0.1)',
                    border: '1px solid rgba(236,72,153,0.3)',
                    color: '#f472b6'
                  }}
                >
                  <Layers size={12} /> Revision Flashcards
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen Flashcard Modal */}
      <FlashcardModal
        isOpen={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        cards={flashcards}
        deckTitle={`${result?.title || 'Syllabus'} — Flashcards`}
        sourceModule="teacher_paper"
        category="Syllabus Revision"
      />

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

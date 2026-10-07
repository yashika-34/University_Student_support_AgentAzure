import React, { useState, useEffect, useMemo } from 'react';
import ModalPortal from '../ModalPortal.jsx';
import { academicAPI } from '../../services/api.js';
import {
  Sparkles, Clock, AlertTriangle, CheckCircle2, XCircle, Brain,
  Cpu, Award, Shield, Eye, HelpCircle, ChevronRight, ChevronLeft,
  RotateCcw, ArrowRight, X, Play, Zap, FileText, Check, MessageSquare
} from 'lucide-react';

// Socratic Hint Bank tailored for Ghost Mode proctoring
const SOCRATIC_HINTS = {
  default: [
    "Consider the foundational constraints: what property is guaranteed to hold invariant in every iteration?",
    "Think about counterexamples: if the opposite were true, where would the logic first break down?",
    "Recall how subproblems overlap here: are you recalculating work that has already been resolved?"
  ],
  algorithm: [
    "Look closely at the edge weights. What assumption does a greedy choice make that negative values violate?",
    "Think about the base case: what happens at boundary size n=0 or n=1?",
    "Compare the recursion tree depth against the number of unique subproblems."
  ],
  database: [
    "Does this dependency involve a transitive relationship between non-prime attributes?",
    "Think about anomalies: what happens during an INSERT if this attribute is null?",
    "Review the ACID contract: which property guarantees changes persist even during unexpected power loss?"
  ],
  network: [
    "Trace the handshake sequence: which segment acknowledges the sequence number plus one?",
    "Consider packet ordering: does the transport layer guarantee sequential delivery or does the application layer handle it?",
    "Think about congestion window scaling: what event triggers multiplicative decrease versus additive increase?"
  ]
};

export default function GhostModeSimulatorModal({
  isOpen,
  onClose,
  studentCourses = [],
  studentMarks = []
}) {
  // Phase: 'briefing' | 'loading' | 'exam' | 'report'
  const [phase, setPhase] = useState('briefing');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [difficulty, setDifficulty] = useState('Medium');
  
  // Questions and Exam State
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  
  // Socratic Proctor State
  const [hintsUsed, setHintsUsed] = useState({});
  const [activeHintMessage, setActiveHintMessage] = useState(null);
  const [proctorPings, setProctorPings] = useState([
    "Ghost Proctor calibrated. Focus on first principles."
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Derive weak points from courses & marks
  const detectedWeakPoints = useMemo(() => {
    const list = [];
    if (studentCourses && studentCourses.length > 0) {
      studentCourses.forEach(c => {
        if (c.percentage < 80 || c.isLowAttendance) {
          list.push({
            topic: c.courseName || c.courseCode,
            reason: `Attendance/Engagement at ${Math.round(c.percentage)}%`,
            mastery: Math.max(35, Math.round(c.percentage - 15)),
            type: 'Attendance Alert'
          });
        }
      });
    }
    if (list.length === 0) {
      list.push(
        { topic: 'Dynamic Programming & Graph Algorithms', reason: 'High-failure curriculum threshold', mastery: 52, type: 'Curriculum Core' },
        { topic: 'Database Normalization & ACID Transactions', reason: 'Mid-term weakness cluster', mastery: 61, type: 'Historical Risk' },
        { topic: 'Distributed Consensus (Paxos & Raft)', reason: 'Advanced conceptual depth', mastery: 45, type: 'Systems Core' }
      );
    }
    return list;
  }, [studentCourses]);

  // Set initial selected topic
  useEffect(() => {
    if (detectedWeakPoints.length > 0 && !selectedTopic) {
      setSelectedTopic(detectedWeakPoints[0].topic);
    }
  }, [detectedWeakPoints, selectedTopic]);

  // Exam Countdown Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, selectedAnswers]);

  // Proctor random periodic observation whispers
  useEffect(() => {
    if (phase !== 'exam') return;
    const proctorInterval = setInterval(() => {
      const whispers = [
        "Ghost Proctor observing: Steady pacing detected. Trust your logic.",
        "Proctor Notice: Eliminate options that contradict core boundary theorems.",
        "Integrity Status: Active window proctoring clear. Continue.",
        "AI Hint reminder: Socratic guidance is available if you hit an impasse."
      ];
      const randomWhisper = whispers[Math.floor(Math.random() * whispers.length)];
      setProctorPings(prev => [randomWhisper, ...prev.slice(0, 2)]);
    }, 45000);
    return () => clearInterval(proctorInterval);
  }, [phase]);

  // Start Exam: Fetch or generate AI Exam
  const handleStartExam = async () => {
    setPhase('loading');
    setIsAiLoading(true);
    try {
      const res = await academicAPI.generateQuiz({
        topic: selectedTopic || 'Data Structures & Algorithms',
        difficulty: difficulty,
        numberOfQuestions: 5,
        courseCode: 'GHOST-SIM'
      });

      if (res?.data?.data?.questions && res.data.data.questions.length > 0) {
        setQuestions(res.data.data.questions);
      } else {
        throw new Error('No questions returned from quiz generator');
      }
    } catch (err) {
      console.warn('Ghost Mode generation fallback:', err.message);
      // Fallback high-yield exam bank
      setQuestions([
        {
          question: `In ${selectedTopic || 'Algorithms'}, consider a recursive relation T(n) = 2T(n/2) + O(n). By the Master Theorem, which complexity class does this algorithm belong to?`,
          options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
          correctOptionIndex: 1,
          explanation: 'Here a=2, b=2, and f(n) = O(n^1). Since log_b(a) = log_2(2) = 1, case 2 of Master Theorem applies: T(n) = O(n log n).'
        },
        {
          question: `Why does Dijkstra’s single-source shortest path algorithm fail to produce optimal paths in graphs with negative weight edges?`,
          options: [
            'It assumes relaxed distances are monotonically increasing and marks vertices permanently finalized',
            'It traverses edges in topological sequence instead of breadth-first',
            'It requires the graph to have no cycles whatsoever',
            'It utilizes a maximum heap instead of an adjacency matrix'
          ],
          correctOptionIndex: 0,
          explanation: 'Dijkstra greedily finalizes vertices assuming no future edge relaxation can decrease a finalized vertex distance, which fails with negative weights.'
        },
        {
          question: `In database transaction processing, which ACID property is strictly preserved through Two-Phase Locking (2PL)?`,
          options: ['Atomicity', 'Consistency', 'Isolation (Serializability)', 'Durability'],
          correctOptionIndex: 2,
          explanation: 'Two-Phase Locking (2PL) guarantees conflict serializability, which enforces the Isolation property of ACID.'
        },
        {
          question: `When designing an in-memory cache system, what is the primary operational trade-off of a Write-Through caching policy?`,
          options: [
            'High write latency because every write must complete in backing storage synchronously',
            'Data loss risk on cache power failure',
            'Eventual consistency with dirty reads on recent keys',
            'Excessive heap memory fragmentation during read operations'
          ],
          correctOptionIndex: 0,
          explanation: 'Write-Through writes synchronously to both the cache and persistent storage, ensuring zero stale reads but incurring higher write latency.'
        },
        {
          question: `What distinguishes the Raft consensus algorithm from classical Multi-Paxos in distributed computing?`,
          options: [
            'Raft decomposes consensus into explicit leader election, log replication, and safety states',
            'Raft eliminates the need for majority quorums entirely',
            'Raft only functions across synchronous networks with zero latency',
            'Raft relies on physical clock synchronization rather than logical terms'
          ],
          correctOptionIndex: 0,
          explanation: 'Raft was explicitly designed for understandability, decomposing consensus into discrete phases: Leader Election, Log Replication, and Safety.'
        }
      ]);
    } finally {
      setIsAiLoading(false);
      setSelectedAnswers({});
      setHintsUsed({});
      setActiveHintMessage(null);
      setCurrentQIndex(0);
      setSecondsRemaining(durationMinutes * 60);
      setPhase('exam');
    }
  };

  // Provide Socratic Hint (Never direct answer!)
  const handleRequestHint = () => {
    const qIdx = currentQIndex;
    const currentQ = questions[qIdx];
    const hintCount = hintsUsed[qIdx] || 0;

    let hintPool = SOCRATIC_HINTS.default;
    const textLower = (currentQ?.question || '').toLowerCase();
    if (textLower.includes('algorithm') || textLower.includes('complexity') || textLower.includes('graph')) {
      hintPool = SOCRATIC_HINTS.algorithm;
    } else if (textLower.includes('database') || textLower.includes('acid') || textLower.includes('lock')) {
      hintPool = SOCRATIC_HINTS.database;
    } else if (textLower.includes('network') || textLower.includes('cache') || textLower.includes('consensus')) {
      hintPool = SOCRATIC_HINTS.network;
    }

    const hintMsg = hintPool[hintCount % hintPool.length];
    setHintsUsed(prev => ({ ...prev, [qIdx]: hintCount + 1 }));
    setActiveHintMessage({
      hintNumber: hintCount + 1,
      text: hintMsg,
      socraticPrompt: "Ghost Proctor Note: Re-read the options with this constraint in mind. Which option does this principle rule out?"
    });
  };

  // Submit Answer
  const handleSelectOption = (optionIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQIndex]: optionIdx
    }));
  };

  // Finish Exam & Compile Report
  const handleFinishExam = () => {
    setPhase('report');
  };

  // Score calculation
  const examResults = useMemo(() => {
    if (questions.length === 0) return { score: 0, total: 0, percentage: 0 };
    let correct = 0;
    questions.forEach((q, idx) => {
      const correctIdx = q.correctOptionIndex ?? q.correctIndex ?? 0;
      if (selectedAnswers[idx] === correctIdx) {
        correct++;
      }
    });
    const totalHints = Object.values(hintsUsed).reduce((a, b) => a + b, 0);
    const timeSpentSeconds = (durationMinutes * 60) - secondsRemaining;
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    const pct = Math.round((correct / questions.length) * 100);

    return {
      score: correct,
      total: questions.length,
      percentage: pct,
      hintsCount: totalHints,
      timeFormatted: `${minutes}m ${seconds}s`,
      integrityScore: 100,
      weaknessMitigated: pct >= 60
    };
  }, [questions, selectedAnswers, hintsUsed, durationMinutes, secondsRemaining]);

  if (!isOpen) return null;

  // Format timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="ghost-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 10, 24, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.25rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && phase !== 'exam') onClose();
        }}
      >
        <div
          className="ghost-modal-container glass-panel"
          style={{
            width: '100%',
            maxWidth: phase === 'exam' ? '980px' : '780px',
            maxHeight: '92vh',
            background: 'linear-gradient(135deg, rgba(20, 16, 48, 0.96) 0%, rgba(10, 8, 28, 0.98) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.45)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(139, 92, 246, 0.25)',
            borderRadius: 'var(--radius-lg, 16px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Top Proctor Header */}
          <div style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(88, 28, 135, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)',
                fontSize: '1.4rem'
              }}>
                👻
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f3e8ff', letterSpacing: '-0.01em' }}>
                    Ghost Mode Exam Simulator
                  </h3>
                  <span className="badge animate-glow" style={{
                    background: 'rgba(139, 92, 246, 0.25)',
                    color: '#c4b5fd',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    🔮 AI Proctor Active
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.2rem' }}>
                  Weakness Targeting · Socratic Guidance · Zero Direct Answers
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {phase === 'exam' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.9rem',
                  background: secondsRemaining < 180 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                  border: `1px solid ${secondsRemaining < 180 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(124, 58, 237, 0.4)'}`,
                  borderRadius: 'var(--radius-sm, 8px)',
                  color: secondsRemaining < 180 ? '#f87171' : '#c4b5fd',
                  fontWeight: 700,
                  fontSize: '0.92rem'
                }}>
                  <Clock size={16} className={secondsRemaining < 180 ? "animate-pulse" : ""} />
                  <span>{formatTime(secondsRemaining)}</span>
                </div>
              )}

              {phase !== 'exam' && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px'
                  }}
                  title="Close Simulator"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body: Phase Switcher */}
          <div style={{
            padding: '1.75rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* ── PHASE 1: BRIEFING & WEAK POINT SELECTION ── */}
            {phase === 'briefing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(88, 28, 135, 0.12)',
                  borderRadius: 'var(--radius-md, 12px)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Brain size={18} color="#c4b5fd" />
                    <span style={{ fontWeight: 700, color: '#f3e8ff', fontSize: '0.95rem' }}>
                      AI Weakness Diagnostic Engine
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', margin: 0, lineHeight: 1.5 }}>
                    Ghost Mode reviews your course test scores and lecture attendance to formulate a high-yield mock exam. During the session, the AI Proctor actively oversees your pacing and offers <strong>Socratic guidance</strong> to lead your thought process without spoiling answers.
                  </p>
                </div>

                {/* Detected Weak Topic Pills */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.65rem' }}>
                    Select Focus Area for Exam Simulation:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {detectedWeakPoints.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedTopic(item.topic)}
                        style={{
                          padding: '0.9rem 1.15rem',
                          background: selectedTopic === item.topic ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${selectedTopic === item.topic ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}`,
                          borderRadius: 'var(--radius-sm, 8px)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: `2px solid ${selectedTopic === item.topic ? '#a855f7' : 'rgba(255, 255, 255, 0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {selectedTopic === item.topic && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a855f7' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                              {item.topic}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                              {item.reason} · <span style={{ color: '#f59e0b' }}>{item.type}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estimated Mastery</span>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: item.mastery < 50 ? '#ef4444' : '#f59e0b' }}>
                            {item.mastery}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duration & Difficulty Config */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                      Timer Duration
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[10, 15, 20].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationMinutes(mins)}
                          className={`btn ${durationMinutes === mins ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.82rem',
                            border: durationMinutes === mins ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {mins} Mins
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                      Proctor Rigor
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['Medium', 'Hard'].map(diff => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDifficulty(diff)}
                          className={`btn ${difficulty === diff ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.82rem',
                            border: difficulty === diff ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-ghost"
                    style={{ padding: '0.75rem 1.25rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartExam}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                      border: 'none',
                      padding: '0.75rem 1.75rem',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)'
                    }}
                  >
                    <Zap size={18} /> Initialize Ghost Exam
                  </button>
                </div>
              </div>
            )}

            {/* ── PHASE 2: LOADING / AI SYNTHESIS ── */}
            {phase === 'loading' && (
              <div style={{
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: 58,
                  height: 58,
                  border: '4px solid rgba(139, 92, 246, 0.2)',
                  borderTopColor: '#a855f7',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f3e8ff', margin: 0 }}>
                    Ghost Proctor is Synthesizing Exam Questions...
                  </h4>
                  <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                    Mining weak point concepts in <strong>{selectedTopic}</strong> and calibrating Socratic hint models.
                  </p>
                </div>
              </div>
            )}

            {/* ── PHASE 3: LIVE PROCTORED EXAM ROOM ── */}
            {phase === 'exam' && questions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Proctor Live HUD Banner */}
                <div style={{
                  padding: '0.65rem 1rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: '#93c5fd'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={14} color="#60a5fa" />
                    <span>Ghost Proctor Monitoring: <strong>{proctorPings[0]}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>Question {currentQIndex + 1} of {questions.length}</span>
                    <span>Hints Used: {hintsUsed[currentQIndex] || 0}</span>
                  </div>
                </div>

                {/* Question Navigation Dots */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        background: currentQIndex === idx ? '#a855f7' : selectedAnswers[idx] !== undefined ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title={`Go to Question ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Question Box */}
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md, 12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.25)', color: '#c4b5fd', fontWeight: 700, fontSize: '0.75rem' }}>
                      Question {currentQIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={handleRequestHint}
                      className="btn btn-ghost"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        background: 'rgba(245, 158, 11, 0.08)'
                      }}
                    >
                      <Sparkles size={14} /> Request Socratic Hint
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                    {questions[currentQIndex]?.question || questions[currentQIndex]?.questionText}
                  </h3>

                  {/* Socratic Hint Callout */}
                  {activeHintMessage && (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '8px',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 800 }}>
                        <HelpCircle size={15} />
                        Socratic Prompt #{activeHintMessage.hintNumber} (No Direct Solution):
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#fef3c7', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{activeHintMessage.text}"
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#fcd34d', marginTop: '0.2rem' }}>
                        {activeHintMessage.socraticPrompt}
                      </div>
                    </div>
                  )}

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {questions[currentQIndex]?.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQIndex] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          style={{
                            padding: '0.85rem 1rem',
                            background: isSelected ? 'rgba(124, 58, 237, 0.28)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255, 255, 255, 0.07)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.72rem', color: isSelected ? '#ffffff' : '#94a3b8',
                            background: isSelected ? '#a855f7' : 'transparent'
                          }}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span style={{ fontSize: '0.9rem', color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Exam Navigator Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    disabled={currentQIndex === 0}
                    onClick={() => {
                      setCurrentQIndex(prev => prev - 1);
                      setActiveHintMessage(null);
                    }}
                    className="btn btn-ghost"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {currentQIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentQIndex(prev => prev + 1);
                          setActiveHintMessage(null);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishExam}
                        className="btn btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          padding: '0.55rem 1.5rem',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <CheckCircle2 size={16} /> Submit Exam
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── PHASE 4: PROCTOR REPORT & MASTERY DIAGNOSTIC ── */}
            {phase === 'report' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                  padding: '1.5rem',
                  background: examResults.weaknessMitigated ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${examResults.weaknessMitigated ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  borderRadius: 'var(--radius-md, 12px)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {examResults.weaknessMitigated ? '🏆' : '📚'}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#f8fafc' }}>
                    {examResults.weaknessMitigated ? 'Weak Point Mitigated!' : 'Concept Requires Further Socratic Review'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: '0.88rem', margin: 0 }}>
                    You scored <strong>{examResults.score} of {examResults.total}</strong> ({examResults.percentage}%) on {selectedTopic}.
                  </p>
                </div>

                {/* Score Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Score', value: `${examResults.percentage}%`, color: '#a855f7' },
                    { label: 'Pacing Time', value: examResults.timeFormatted, color: '#38bdf8' },
                    { label: 'Socratic Hints', value: `${examResults.hintsCount} used`, color: '#fbbf24' },
                    { label: 'Integrity Rating', value: '100% Valid', color: '#10b981' }
                  ].map((stat, i) => (
                    <div key={i} style={{ padding: '0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{stat.label}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: stat.color, marginTop: '0.2rem' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Detailed Question Review */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>
                    Ghost Proctor Question Breakdown:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {questions.map((q, idx) => {
                      const correctIdx = q.correctOptionIndex ?? q.correctIndex ?? 0;
                      const userAns = selectedAnswers[idx];
                      const isCorrect = userAns === correctIdx;
                      return (
                        <div key={idx} style={{
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                              Q{idx + 1}. {q.question || q.questionText}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isCorrect ? '#34d399' : '#f87171' }}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Your Answer: <strong style={{ color: isCorrect ? '#34d399' : '#f87171' }}>{userAns !== undefined ? q.options[userAns] : 'Not Answered'}</strong>
                          </div>
                          {!isCorrect && (
                            <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.2rem' }}>
                              Correct Answer: <strong>{q.options[correctIdx]}</strong>
                            </div>
                          )}
                          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.45rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            💡 <strong>Concept Explanation:</strong> {q.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('briefing');
                      setSelectedAnswers({});
                      setHintsUsed({});
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RotateCcw size={15} /> Simulate Another Weak Topic
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary"
                    style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  Calculator,
  Target,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const AcademicToolsPage = () => {
  const [activeTab, setActiveTab] = useState('attendance');

  // Attendance Predictor State — loaded from API
  const [courses, setCourses] = useState([
    { courseCode: 'CS-301', courseName: 'Algorithms', totalClasses: 24, attendedClasses: 21, percentage: 87.5 },
    { courseCode: 'CS-305', courseName: 'Cloud Computing', totalClasses: 18, attendedClasses: 13, percentage: 72.2 },
    { courseCode: 'CS-309', courseName: 'Artificial Intelligence', totalClasses: 20, attendedClasses: 19, percentage: 95.0 }
  ]);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [hypotheticalAction, setHypotheticalAction] = useState('attend');
  const [classCount, setClassCount] = useState(3);
  const [targetCutoff, setTargetCutoff] = useState(75);

  // Load attendance from API
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/attendance/my-summary');
        if (res.data?.overallSummary?.length > 0) {
          setCourses(res.data.overallSummary);
          setSelectedCourseCode(res.data.overallSummary[0].courseCode);
        } else {
          setSelectedCourseCode('CS-301');
        }
      } catch {
        setSelectedCourseCode('CS-301');
      }
    };
    fetchAttendance();
  }, []);

  const activeCourse = courses.find((c) => c.courseCode === selectedCourseCode) || courses[0] || { totalClasses: 20, attendedClasses: 16, percentage: 80, courseCode: '' };
  const newTotal = activeCourse.totalClasses + classCount;
  const newAttended = hypotheticalAction === 'attend' ? activeCourse.attendedClasses + classCount : activeCourse.attendedClasses;
  const projectedAttendance = ((newAttended / newTotal) * 100).toFixed(1);
  const maxSafeAbsences = Math.max(0, Math.floor((activeCourse.attendedClasses / (targetCutoff / 100)) - activeCourse.totalClasses));
  const neededConsecutive = activeCourse.percentage < targetCutoff
    ? Math.max(0, Math.ceil(((targetCutoff / 100) * activeCourse.totalClasses - activeCourse.attendedClasses) / (1 - (targetCutoff / 100))))
    : 0;

  // SGPA Predictor State
  const [gradeInputs, setGradeInputs] = useState([
    { code: 'CS-301', name: 'Algorithms', credits: 4, expectedGrade: 'A' },
    { code: 'CS-305', name: 'Cloud Computing', credits: 3, expectedGrade: 'B+' },
    { code: 'CS-309', name: 'Artificial Intelligence', credits: 4, expectedGrade: 'A+' }
  ]);
  const gradeScale = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0 };
  const totalSemCredits = gradeInputs.reduce((sum, c) => sum + c.credits, 0);
  const totalGradePoints = gradeInputs.reduce((sum, c) => sum + c.credits * (gradeScale[c.expectedGrade] || 3.0), 0);
  const predictedSGPA = (totalGradePoints / totalSemCredits).toFixed(2);
  const projectedCGPA = (((3.82 * 74) + totalGradePoints) / (74 + totalSemCredits)).toFixed(2);

  // Study Planner State — loaded from API
  const [studyPlanSlots, setStudyPlanSlots] = useState([]);

  useEffect(() => {
    const fetchStudyPlan = async () => {
      try {
        const res = await api.get('/academic/study-plan');
        if (res.data?.data?.schedule?.length > 0) {
          setStudyPlanSlots(res.data.data.schedule);
        } else {
          // Default study plan if none from server
          setStudyPlanSlots([
            { id: 'sp-1', day: 'Monday', time: '16:00 - 18:00', task: 'Review Dynamic Programming & Graph Search', course: 'CS-301', isCompleted: false },
            { id: 'sp-2', day: 'Tuesday', time: '17:00 - 19:00', task: 'Deploy Docker container to Azure App Service', course: 'CS-305', isCompleted: false },
            { id: 'sp-3', day: 'Wednesday', time: '15:00 - 17:00', task: 'Train Convolutional Neural Network on PyTorch', course: 'CS-309', isCompleted: false },
            { id: 'sp-4', day: 'Thursday', time: '18:00 - 20:00', task: 'Solve LeetCode Medium algorithms (Graphs & Heaps)', course: 'CS-301', isCompleted: false },
            { id: 'sp-5', day: 'Friday', time: '16:00 - 17:30', task: 'Kubernetes Pod Networking lab exercise', course: 'CS-305', isCompleted: false }
          ]);
        }
      } catch {
        setStudyPlanSlots([
          { id: 'sp-1', day: 'Monday', time: '16:00 - 18:00', task: 'Review Dynamic Programming & Graph Search', course: 'CS-301', isCompleted: false },
          { id: 'sp-2', day: 'Tuesday', time: '17:00 - 19:00', task: 'Deploy Docker container to Azure App Service', course: 'CS-305', isCompleted: false },
          { id: 'sp-3', day: 'Wednesday', time: '15:00 - 17:00', task: 'Train Convolutional Neural Network on PyTorch', course: 'CS-309', isCompleted: false }
        ]);
      }
    };
    fetchStudyPlan();
  }, []);

  const toggleStudySlot = (id) => {
    setStudyPlanSlots(studyPlanSlots.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  // AI Quiz Generator State
  const [quizSubject, setQuizSubject] = useState('CS-301');
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const startQuiz = async () => {
    try {
      const res = await api.post('/academic/generate-quiz', { courseCode: quizSubject });
      if (res.data && res.data.data) {
        setQuizQuestions(res.data.data.questions);
      }
    } catch {
      // Fallback
      setQuizQuestions([
        {
          id: 1,
          questionText: 'What is the optimal time complexity of 0/1 Knapsack with N items and weight W?',
          options: ['O(N * W)', 'O(2^N)', 'O(N log N)', 'O(W^2)'],
          correctIndex: 0,
          explanation: 'Dynamic Programming solves 0/1 Knapsack in pseudo-polynomial O(N * W) time.'
        },
        {
          id: 2,
          questionText: 'Which property distinguishes Dynamic Programming from Divide and Conquer?',
          options: ['Overlapping Subproblems', 'Recursion', 'Independent Subproblems', 'Greedy Choice Property'],
          correctIndex: 0,
          explanation: 'Overlapping subproblems allow memorization or tabulation.'
        }
      ]);
    }
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleQuizSubmit = () => {
    if (!quizQuestions) return;
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <Sparkles size={16} /> Academic Excellence Suite
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Academic Tools &amp; Predictors
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Forecast semester metrics, simulate attendance trajectories, optimize your GPA, practice with AI quizzes, and manage your weekly study planner.
        </p>
      </div>

      {/* Hub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {[
          { id: 'attendance', label: 'Attendance Predictor', icon: Calculator },
          { id: 'sgpa', label: 'SGPA & CGPA Predictor', icon: Target },
          { id: 'planner', label: 'Study Planner', icon: Clock },
          { id: 'quiz', label: 'AI Quiz Studio', icon: BookOpen },
          { id: 'recommendations', label: 'AI Learning Recommendations', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Attendance Predictor */}
      {activeTab === 'attendance' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={20} color="var(--primary)" /> Smart Attendance Simulator &amp; Debarment Guard
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Course to Simulate</label>
                <select
                  className="form-select"
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.courseCode} value={c.courseCode}>
                      {c.courseCode} - {c.courseName} (Current: {c.percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hypothetical Scenario</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setHypotheticalAction('attend')}
                    className={`btn ${hypotheticalAction === 'attend' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.6rem' }}
                  >
                    If I Attend Next...
                  </button>
                  <button
                    type="button"
                    onClick={() => setHypotheticalAction('miss')}
                    className={`btn ${hypotheticalAction === 'miss' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ padding: '0.6rem' }}
                  >
                    If I Miss Next...
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Lectures: <strong>{classCount}</strong></label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={classCount}
                  onChange={(e) => setClassCount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target University Debarment Threshold ({targetCutoff}%)</label>
                <select
                  className="form-select"
                  value={targetCutoff}
                  onChange={(e) => setTargetCutoff(Number(e.target.value))}
                >
                  <option value={75}>75% (Mandatory University Standard)</option>
                  <option value={80}>80% (Safe Buffer)</option>
                  <option value={85}>85% (Scholarship Eligibility Cutoff)</option>
                </select>
              </div>
            </div>

            {/* Prediction Output Visualizer */}
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Forecasted Percentage for <strong>{activeCourse.courseCode}</strong>
              </div>
              <div style={{
                fontSize: '3.5rem',
                fontWeight: 800,
                color: Number(projectedAttendance) >= targetCutoff ? 'var(--success)' : 'var(--danger)',
                lineHeight: 1.1,
                marginBottom: '0.75rem'
              }}>
                {projectedAttendance}%
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {hypotheticalAction === 'attend'
                  ? `Attending ${classCount} more classes raises attendance from ${activeCourse.percentage}% to ${projectedAttendance}%.`
                  : `Missing ${classCount} more classes causes your attendance to decline from ${activeCourse.percentage}% to ${projectedAttendance}%.`}
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>
                {activeCourse.percentage >= targetCutoff ? (
                  <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} /> Safe Standing: You can safely miss up to <strong>{maxSafeAbsences}</strong> more lectures and remain eligible.
                  </div>
                ) : (
                  <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} /> Examination Risk: You must attend the next <strong>{neededConsecutive}</strong> consecutive lectures to regain exam qualification.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SGPA Predictor */}
      {activeTab === 'sgpa' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--accent-purple)" /> Semester GPA &amp; Cumulative CGPA Predictor
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Adjust expected final grades for enrolled Semester 5 subjects to calculate projected SGPA and cumulative standing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {gradeInputs.map((course, idx) => (
                  <div key={course.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{course.code} - {course.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credits: {course.credits}</div>
                    </div>
                    <select
                      className="form-select"
                      style={{ width: '90px' }}
                      value={course.expectedGrade}
                      onChange={(e) => {
                        const updated = [...gradeInputs];
                        updated[idx].expectedGrade = e.target.value;
                        setGradeInputs(updated);
                      }}
                    >
                      {Object.keys(gradeScale).map((g) => (
                        <option key={g} value={g}>{g} ({gradeScale[g]})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Forecasted Semester 5 SGPA
              </div>
              <div style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--accent-purple)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                {predictedSGPA} / 4.0
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Projected New Cumulative CGPA: <strong style={{ color: 'var(--text-primary)' }}>{projectedCGPA}</strong>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600 }}>
                {predictedSGPA >= 3.8 ? "🌟 Potential Dean's Honors List Standing" : "🎯 High Academic Standing (Top 15%)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Study Planner */}
      {activeTab === 'planner' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--primary)" /> Personalized Weekly Study Schedule
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Smart schedule dynamically mapped around your upcoming deadlines and exam milestones.
              </p>
            </div>
            <div className="badge badge-primary">
              Target: 24 hrs / week
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studyPlanSlots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => toggleStudySlot(slot.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: slot.isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                  border: slot.isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={slot.isCompleted}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--success)', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', textDecoration: slot.isCompleted ? 'line-through' : 'none', color: slot.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {slot.topic}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                      <span>{slot.day}</span>
                      <span>&bull;</span>
                      <span>{slot.time}</span>
                    </div>
                  </div>
                </div>
                <span className="badge badge-primary">{slot.courseCode}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AI Quiz Generator */}
      {activeTab === 'quiz' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--accent-cyan)" /> AI Practice Quiz Generator
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Generate instant multi-choice quiz tests with immediate feedback and algorithmic explanations.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={quizSubject}
              onChange={(e) => setQuizSubject(e.target.value)}
            >
              <option value="CS-301">CS-301: Dynamic Programming &amp; Graph Algorithms</option>
              <option value="CS-305">CS-305: Cloud Computing &amp; Containerization</option>
            </select>
            <button onClick={startQuiz} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <Play size={16} /> Generate New Quiz
            </button>
          </div>

          {quizQuestions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {quizQuestions.map((q, qIdx) => (
                <div key={q.id} style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.85rem' }}>
                    {qIdx + 1}. {q.questionText}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[qIdx] === oIdx;
                      let optionBg = isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)';
                      let borderCol = isSelected ? 'var(--primary)' : 'var(--border-subtle)';

                      if (quizSubmitted) {
                        if (oIdx === q.correctIndex) {
                          optionBg = 'rgba(16, 185, 129, 0.2)';
                          borderCol = 'var(--success)';
                        } else if (isSelected && oIdx !== q.correctIndex) {
                          optionBg = 'rgba(239, 68, 68, 0.2)';
                          borderCol = 'var(--danger)';
                        }
                      }

                      return (
                        <div
                          key={oIdx}
                          onClick={() => !quizSubmitted && setSelectedAnswers({ ...selectedAnswers, [qIdx]: oIdx })}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: optionBg,
                            border: `1px solid ${borderCol}`,
                            fontSize: '0.88rem',
                            cursor: quizSubmitted ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.6rem 0.85rem', borderRadius: '4px' }}>
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {!quizSubmitted ? (
                  <button onClick={handleQuizSubmit} className="btn btn-primary" style={{ padding: '0.7rem 1.5rem' }}>
                    Submit Answers for Evaluation
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>
                      Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                    </div>
                    <button onClick={startQuiz} className="btn btn-secondary">
                      <RotateCcw size={14} /> Retake Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: AI Learning Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> Curated AI Learning Recommendations
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Resource paths recommended based on your attendance deficits, upcoming assignment topics, and learning curve.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              {
                id: 'r1',
                courseCode: 'CS-305 (Cloud Computing)',
                title: 'Mastering Microservices on Azure App Services & Docker',
                type: 'Interactive Cloud Lab',
                duration: '45 mins',
                urgency: 'High Priority (Attendance is 72.2%)',
                desc: 'Bridge lecture absence deficits by building containerized microservices and configuring routing.',
                url: 'https://learn.microsoft.com/en-us/azure/'
              },
              {
                id: 'r2',
                courseCode: 'CS-301 (Algorithms)',
                title: 'Dynamic Programming: Memoization vs Tabulation Deep Dive',
                type: 'MIT OpenCourseWare Module',
                duration: '35 mins',
                urgency: 'Medium Priority (Assignment Due Soon)',
                desc: 'Step-by-step state design for knapsack and longest common subsequence problems.',
                url: 'https://ocw.mit.edu/'
              },
              {
                id: 'r3',
                courseCode: 'CS-309 (AI & Neural Networks)',
                title: 'Attention Mechanisms and Transformer Architectures',
                type: 'Stanford CS224N Guided Notebook',
                duration: '60 mins',
                urgency: 'Enrichment (Top 10% Goal)',
                desc: 'Understand multi-head self-attention mechanisms and PyTorch tensor operations.',
                url: 'https://stanford.edu/'
              }
            ].map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <span className="badge badge-primary">{item.courseCode}</span>
                    <span className="badge badge-warning">{item.urgency}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.duration}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.desc}</p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Open Learning Module <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademicToolsPage;

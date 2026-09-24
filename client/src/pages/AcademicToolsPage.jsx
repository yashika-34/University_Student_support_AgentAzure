import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { academicAPI } from '../services/api.js';
import ModalPortal from '../components/ModalPortal.jsx';
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
  ExternalLink,
  History,
  X,
  Award,
  XCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  Layers,
  BrainCircuit,
  BarChart3
} from 'lucide-react';

const QUIZ_SUBJECTS = [
  { id: 'DNN', label: 'DNN (Deep Neural Networks)', desc: 'Backprop, CNNs, RNNs, Transformers, Optimizers' },
  { id: 'CNDC', label: 'CNDC (Computer Networks & Data Communication)', desc: 'OSI/TCP-IP, Routing, Sockets, Congestion Control' },
  { id: 'Programming Abstractions', label: 'Programming Abstractions', desc: 'OOP, Functional, Memory, Concurrency, Patterns' },
  { id: 'System Design', label: 'System Design', desc: 'Scalability, Microservices, Caching, CAP, Sharding' },
  { id: 'Data Structures & Algorithms', label: 'Data Structures & Algorithms', desc: 'Trees, Graphs, DP, Heaps, Complexity' },
  { id: 'custom', label: 'Custom Technical Topic...', desc: 'Enter any custom computer science or engineering topic' }
];

const AcademicToolsPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'attendance';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab if query param changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['attendance', 'sgpa', 'planner', 'quiz', 'recommendations'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  /* ── 1. Attendance Predictor State ──────────────────────────────── */
  const [courses, setCourses] = useState([
    { courseCode: 'CS-301', courseName: 'Algorithms', totalClasses: 24, attendedClasses: 21, percentage: 87.5 },
    { courseCode: 'CS-305', courseName: 'Cloud Computing', totalClasses: 18, attendedClasses: 13, percentage: 72.2 },
    { courseCode: 'CS-309', courseName: 'Artificial Intelligence', totalClasses: 20, attendedClasses: 19, percentage: 95.0 }
  ]);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [hypotheticalAction, setHypotheticalAction] = useState('attend');
  const [classCount, setClassCount] = useState(3);
  const [targetCutoff, setTargetCutoff] = useState(75);

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

  /* ── 2. SGPA & CGPA Predictor State ─────────────────────────────── */
  const [gradeInputs, setGradeInputs] = useState([
    { code: 'CS-301', name: 'Algorithms', credits: 4, expectedGrade: 'A' },
    { code: 'CS-305', name: 'Cloud Computing', credits: 3, expectedGrade: 'B+' },
    { code: 'CS-309', name: 'Artificial Intelligence', credits: 4, expectedGrade: 'A+' }
  ]);
  const gradeScale = { 'A+': 10.0, 'A': 9.0, 'A-': 8.5, 'B+': 8.0, 'B': 7.0, 'B-': 6.5, 'C+': 6.0, 'C': 5.0, 'D': 4.0, 'F': 0.0 };
  const totalSemCredits = gradeInputs.reduce((sum, c) => sum + c.credits, 0);
  const totalGradePoints = gradeInputs.reduce((sum, c) => sum + c.credits * (gradeScale[c.expectedGrade] || 8.0), 0);
  const predictedSGPA = (totalGradePoints / totalSemCredits).toFixed(2);
  const projectedCGPA = (((8.65 * 74) + totalGradePoints) / (74 + totalSemCredits)).toFixed(2);

  /* ── 3. Study Planner State ─────────────────────────────────────── */
  const [studyPlanSlots, setStudyPlanSlots] = useState([]);
  useEffect(() => {
    const fetchStudyPlan = async () => {
      try {
        const res = await api.get('/academic/study-plan');
        if (res.data?.data?.schedule?.length > 0) {
          setStudyPlanSlots(res.data.data.schedule);
        } else {
          setStudyPlanSlots([
            { id: 'sp-1', day: 'Monday', time: '16:00 - 18:00', topic: 'Review Dynamic Programming & Graph Search', courseCode: 'CS-301', isCompleted: false },
            { id: 'sp-2', day: 'Tuesday', time: '17:00 - 19:00', topic: 'Deploy Docker container to Azure App Service', courseCode: 'CS-305', isCompleted: false },
            { id: 'sp-3', day: 'Wednesday', time: '15:00 - 17:00', topic: 'Train Convolutional Neural Network on PyTorch', courseCode: 'CS-309', isCompleted: false },
            { id: 'sp-4', day: 'Thursday', time: '18:00 - 20:00', topic: 'Solve LeetCode Medium algorithms (Graphs & Heaps)', courseCode: 'CS-301', isCompleted: false },
            { id: 'sp-5', day: 'Friday', time: '16:00 - 17:30', topic: 'Kubernetes Pod Networking lab exercise', courseCode: 'CS-305', isCompleted: false }
          ]);
        }
      } catch {
        setStudyPlanSlots([
          { id: 'sp-1', day: 'Monday', time: '16:00 - 18:00', topic: 'Review Dynamic Programming & Graph Search', courseCode: 'CS-301', isCompleted: false },
          { id: 'sp-2', day: 'Tuesday', time: '17:00 - 19:00', topic: 'Deploy Docker container to Azure App Service', courseCode: 'CS-305', isCompleted: false },
          { id: 'sp-3', day: 'Wednesday', time: '15:00 - 17:00', topic: 'Train Convolutional Neural Network on PyTorch', courseCode: 'CS-309', isCompleted: false }
        ]);
      }
    };
    fetchStudyPlan();
  }, []);

  const toggleStudySlot = (id) => {
    setStudyPlanSlots(studyPlanSlots.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s)));
  };

  /* ── 4. AI Quiz Studio State (Azure AI Foundry GPT-4.1-mini) ────── */
  const [selectedSubject, setSelectedSubject] = useState('DNN');
  const [customTopic, setCustomTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  const [currentQuiz, setCurrentQuiz] = useState(null); // { quizId, topic, difficulty, questions, courseCode }
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: optIdx }
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null); // { totalScore, score, correctAnswers, wrongAnswers, percentage, evaluatedQuestions }

  // Quiz History
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Generate AI Quiz with Azure OpenAI
  const handleGenerateQuiz = async () => {
    const topicToUse = selectedSubject === 'custom' ? customTopic.trim() : selectedSubject;
    if (!topicToUse) {
      setQuizError('Please enter a topic for the quiz.');
      return;
    }

    setIsGeneratingQuiz(true);
    setQuizError('');
    setCurrentQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});

    try {
      const res = await academicAPI.generateQuiz({
        topic: topicToUse,
        difficulty: quizDifficulty,
        numberOfQuestions: quizNumQuestions,
        courseCode: selectedSubject !== 'custom' ? selectedSubject : 'CS-AI'
      });

      if (res.data?.success && res.data?.data) {
        setCurrentQuiz(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Unable to generate quiz questions.');
      }
    } catch (err) {
      console.error('Quiz Generation Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to connect to Azure AI Foundry. Please try again.';
      setQuizError(msg);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return;
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalCount = currentQuiz.questions.length;

    if (answeredCount < totalCount) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalCount} questions. Unanswered questions will be counted as incorrect. Do you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmittingQuiz(true);
    try {
      const res = await academicAPI.submitQuiz({
        quizId: currentQuiz.quizId,
        selectedAnswers
      });

      if (res.data?.success && res.data?.data) {
        setQuizResult(res.data.data);
      }
    } catch (err) {
      console.error('Quiz Submit Error:', err);
      // Fallback local score calculation if endpoint error
      let correct = 0;
      const evaluated = currentQuiz.questions.map((q, idx) => {
        const userPick = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
        const isCorrect = userPick === q.correctIndex;
        if (isCorrect) correct++;
        return {
          index: idx,
          questionText: q.questionText || q.question,
          options: q.options,
          selectedOptionIndex: userPick,
          correctOptionIndex: q.correctIndex,
          isCorrect,
          explanation: q.explanation
        };
      });

      setQuizResult({
        quizId: currentQuiz.quizId,
        topic: currentQuiz.topic,
        difficulty: currentQuiz.difficulty,
        totalQuestions: totalCount,
        totalScore: `${correct} / ${totalCount}`,
        score: correct,
        correctAnswers: correct,
        wrongAnswers: totalCount - correct,
        percentage: Number(((correct / totalCount) * 100).toFixed(1)),
        evaluatedQuestions: evaluated
      });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Fetch Quiz History
  const handleOpenHistory = async () => {
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await academicAPI.getQuizHistory();
      if (res.data?.data) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load quiz history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Retake current quiz
  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setQuizResult(null);
  };

  // Reset to create another quiz
  const handleResetQuiz = () => {
    setCurrentQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setQuizError('');
  };

  /* ── 5. AI Project Architect State ──────────────────────────────── */
  const [architectInterests, setArchitectInterests] = useState('');
  const [architectComplexity, setArchitectComplexity] = useState('Advanced');
  const [architectTech, setArchitectTech] = useState('');
  const [architectLoading, setArchitectLoading] = useState(false);
  const [architectResult, setArchitectResult] = useState(null);
  const [architectError, setArchitectError] = useState('');

  const handleGenerateProject = async () => {
    if (!architectInterests.trim()) {
      setArchitectError('Please provide your project interests/domain.');
      return;
    }
    setArchitectLoading(true);
    setArchitectError('');
    setArchitectResult(null);

    try {
      // You can define a new API call in your services/api.js, or just use api.post
      const res = await api.post('/academic/project-architect', {
        interests: architectInterests,
        complexity: architectComplexity,
        techPreferences: architectTech
      });
      if (res.data?.success && res.data?.data) {
        setArchitectResult(res.data.data.proposal);
      }
    } catch (err) {
      console.error('Project generation failed:', err);
      setArchitectError('Failed to generate project architecture. Please try again.');
    } finally {
      setArchitectLoading(false);
    }
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
          Forecast semester metrics, simulate attendance trajectories, optimize your GPA, practice with AI Quiz Studio, and manage your weekly schedule.
        </p>
      </div>

      {/* Hub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {[
          { id: 'attendance', label: 'Attendance Predictor', icon: Calculator },
          { id: 'sgpa', label: 'SGPA & CGPA Predictor', icon: Target },
          { id: 'planner', label: 'Study Planner', icon: Clock },
          { id: 'quiz', label: 'AI Quiz Studio (Azure OpenAI)', icon: BrainCircuit },
          { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
          { id: 'architect', label: 'AI Project Architect', icon: Layers }
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

      {/* ── TAB 1: Attendance Predictor ─────────────────────────────── */}
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
                <label className="form-label">Target University Cutoff ({targetCutoff}%)</label>
                <select
                  className="form-select"
                  value={targetCutoff}
                  onChange={(e) => setTargetCutoff(Number(e.target.value))}
                >
                  <option value={75}>75% (Mandatory University Cutoff)</option>
                  <option value={80}>80% (Safe Buffer)</option>
                  <option value={85}>85% (Scholarship Threshold)</option>
                </select>
              </div>
            </div>

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
                    <CheckCircle2 size={16} />
                    <span>You can safely miss up to <strong>{maxSafeAbsences}</strong> classes without dropping below {targetCutoff}%.</span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} />
                    <span>You must attend <strong>{neededConsecutive}</strong> consecutive classes to cross {targetCutoff}%.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SGPA & CGPA Predictor ────────────────────────────── */}
      {activeTab === 'sgpa' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--accent-purple)" /> SGPA &amp; CGPA Goal Predictor
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Simulate your expected course grades on a 10.0 CGPA scale to project semester and cumulative GPA trajectories.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {gradeInputs.map((item, idx) => (
                  <div key={item.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.code} &bull; {item.credits} Credits</div>
                    </div>
                    <select
                      className="form-select"
                      style={{ width: '90px', padding: '0.4rem 0.6rem' }}
                      value={item.expectedGrade}
                      onChange={(e) => {
                        const next = [...gradeInputs];
                        next[idx].expectedGrade = e.target.value;
                        setGradeInputs(next);
                      }}
                    >
                      {Object.keys(gradeScale).map((gr) => (
                        <option key={gr} value={gr}>{gr} ({gradeScale[gr]})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Forecasted Semester SGPA
              </div>
              <div style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--accent-purple)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                {predictedSGPA} / 10.0
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Projected New Cumulative CGPA: <strong style={{ color: 'var(--text-primary)' }}>{projectedCGPA} / 10.0</strong>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600 }}>
                {Number(predictedSGPA) >= 8.5 ? "🌟 Potential Dean's Honors Standing" : "🎯 Strong Academic Performance"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Study Planner ────────────────────────────────────── */}
      {activeTab === 'planner' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--primary)" /> Personalized Weekly Study Schedule
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Smart schedule mapped around your upcoming deadlines and exam milestones.
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

      {/* ── TAB 4: AI Quiz Studio (Azure AI Foundry GPT-4.1-mini) ──── */}
      {activeTab === 'quiz' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BrainCircuit size={22} color="var(--primary)" /> AI Quiz Studio
                </h2>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.3)', fontSize: '0.72rem' }}>
                  Powered by Azure AI Foundry (gpt-4.1-mini)
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Generate high-yield computer science practice questions tailored to your coursework with instant algorithmic evaluation.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleOpenHistory}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
              >
                <History size={16} /> Quiz History
              </button>
              {(currentQuiz || quizResult) && (
                <button
                  onClick={handleResetQuiz}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  <RefreshCw size={14} /> New Configuration
                </button>
              )}
            </div>
          </div>

          {/* Configuration Form (shown when no quiz is currently active or user wants new config) */}
          {!currentQuiz && !isGeneratingQuiz && (
            <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--primary)" /> Configure Quiz Generation
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Subject Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Target Subject / Domain</label>
                  <select
                    className="form-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    {QUIZ_SUBJECTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {QUIZ_SUBJECTS.find((s) => s.id === selectedSubject)?.desc}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Difficulty Level</label>
                  <select
                    className="form-select"
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy (Core Definitions &amp; Syntax)</option>
                    <option value="Medium">Medium (Algorithmic Logic &amp; Scenarios)</option>
                    <option value="Hard">Hard (Deep Theory, Edge Cases &amp; Complexity)</option>
                  </select>
                </div>

                {/* Number of Questions */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Number of Questions</label>
                  <select
                    className="form-select"
                    value={quizNumQuestions}
                    onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                  >
                    <option value={3}>3 Questions (Quick Sprint)</option>
                    <option value={5}>5 Questions (Recommended)</option>
                    <option value={8}>8 Questions (In-depth Practice)</option>
                    <option value={10}>10 Questions (Full Assessment)</option>
                  </select>
                </div>
              </div>

              {/* Custom Topic Input if selected */}
              {selectedSubject === 'custom' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Custom Technical Topic</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Distributed Consensus (Raft & Paxos), Kubernetes Networking, B-Trees..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                  />
                </div>
              )}

              {/* Error Display */}
              {quizError && (
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>{quizError}</span>
                  </div>
                  <button onClick={handleGenerateQuiz} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    Retry
                  </button>
                </div>
              )}

              <button
                onClick={handleGenerateQuiz}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Sparkles size={18} /> Generate AI Quiz with Azure OpenAI
              </button>
            </div>
          )}

          {/* Loading State */}
          {isGeneratingQuiz && (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                <Loader2 size={56} className="animate-spin" color="var(--primary)" />
                <BrainCircuit size={24} color="var(--primary)" style={{ position: 'absolute', top: '16px', left: '16px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Synthesizing MCQs with Azure AI Foundry...
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto' }}>
                  Model <strong>gpt-4.1-mini</strong> is formulating {quizNumQuestions} verified multiple-choice questions on <em>{selectedSubject === 'custom' ? customTopic : selectedSubject}</em> with algorithmic explanations.
                </p>
              </div>
              <span className="badge badge-primary" style={{ animation: 'pulse 2s infinite' }}>
                Verifying strict JSON schema &amp; answer keys
              </span>
            </div>
          )}

          {/* Active Quiz Question Flow */}
          {currentQuiz && !quizResult && !isGeneratingQuiz && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Quiz Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{currentQuiz.courseCode || currentQuiz.topic}</span>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                    {currentQuiz.difficulty} Difficulty
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Answered: <strong>{Object.keys(selectedAnswers).length}</strong> / {currentQuiz.questions.length}
                  </span>
                </div>
                <button onClick={handleResetQuiz} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Change Topic
                </button>
              </div>

              {/* Question Cards */}
              {currentQuiz.questions.map((q, qIdx) => {
                const questionText = q.questionText || q.question;
                return (
                  <div
                    key={q.questionId || qIdx}
                    style={{
                      padding: '1.5rem',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--primary)', marginRight: '0.4rem' }}>Q{qIdx + 1}.</span>
                        {questionText}
                      </div>
                      <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        Question {qIdx + 1} of {currentQuiz.questions.length}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === oIdx;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: oIdx })}
                            style={{
                              padding: '0.85rem 1.15rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                              border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                                color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                              }}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span style={{ flex: 1, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {opt}
                            </span>
                            {isSelected && <CheckCircle2 size={18} color="var(--primary)" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Submission Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', padding: '1rem 0' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Questions answered: <strong>{Object.keys(selectedAnswers).length}</strong> of {currentQuiz.questions.length}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSubmittingQuiz ? (
                      <><Loader2 size={16} className="animate-spin" /> Evaluating Answers...</>
                    ) : (
                      <><CheckCircle2 size={16} /> Submit Answers for Evaluation</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Post-Submission Result View */}
          {quizResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Scorecard Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.12) 100%)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  padding: '2rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                {/* Total Score */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Total Score
                  </div>
                  <div style={{ fontSize: '2.6rem', fontWeight: 800, color: quizResult.percentage >= 70 ? 'var(--success)' : quizResult.percentage >= 40 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>
                    {quizResult.totalScore || `${quizResult.score} / ${quizResult.totalQuestions}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    {quizResult.percentage >= 80 ? '🏆 Outstanding Mastery!' : quizResult.percentage >= 60 ? '👍 Solid Understanding' : '📚 Needs Review'}
                  </div>
                </div>

                {/* Percentage */}
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Accuracy Percentage
                  </div>
                  <div style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                    {quizResult.percentage}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    {quizResult.topic} &bull; {quizResult.difficulty}
                  </div>
                </div>

                {/* Correct vs Wrong Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} /> Correct Answers
                    </span>
                    <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{quizResult.correctAnswers}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <XCircle size={16} /> Wrong Answers
                    </span>
                    <strong style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>{quizResult.wrongAnswers}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="var(--primary)" /> Detailed Answer Explanations
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleRetakeQuiz} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RotateCcw size={15} /> Retake This Quiz
                  </button>
                  <button onClick={handleResetQuiz} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} /> Generate New Quiz
                  </button>
                </div>
              </div>

              {/* Detailed Question Review */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {(quizResult.evaluatedQuestions || []).map((q, idx) => {
                  return (
                    <div
                      key={q.questionId || idx}
                      style={{
                        padding: '1.5rem',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${q.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--primary)', marginRight: '0.4rem' }}>Q{idx + 1}.</span>
                          {q.questionText}
                        </div>
                        <span className={`badge ${q.isCorrect ? 'badge-success' : 'badge-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {q.isCorrect ? <><CheckCircle2 size={12} /> Correct (+1)</> : <><XCircle size={12} /> Incorrect</>}
                        </span>
                      </div>

                      {/* Options with correctness highlights */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        {q.options.map((opt, oIdx) => {
                          const isCorrectOption = oIdx === q.correctOptionIndex;
                          const isSelectedByStudent = oIdx === q.selectedOptionIndex;

                          let bg = 'rgba(255,255,255,0.02)';
                          let border = 'var(--border-subtle)';
                          let textCol = 'var(--text-secondary)';

                          if (isCorrectOption) {
                            bg = 'rgba(16, 185, 129, 0.15)';
                            border = 'var(--success)';
                            textCol = 'var(--success)';
                          } else if (isSelectedByStudent && !isCorrectOption) {
                            bg = 'rgba(239, 68, 68, 0.15)';
                            border = 'var(--danger)';
                            textCol = 'var(--danger)';
                          }

                          return (
                            <div
                              key={oIdx}
                              style={{
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                background: bg,
                                border: `1px solid ${border}`,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <span style={{ color: textCol }}>{opt}</span>
                              </div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                {isCorrectOption && <span style={{ color: 'var(--success)' }}>✓ Correct Answer</span>}
                                {isSelectedByStudent && !isCorrectOption && <span style={{ color: 'var(--danger)' }}>✗ Your Answer</span>}
                                {isSelectedByStudent && isCorrectOption && <span style={{ color: 'var(--success)' }}>✓ Your Answer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* AI Algorithmic Explanation */}
                      <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.84rem', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.4rem' }}>
                          <HelpCircle size={14} /> Explanation:
                        </strong>
                        <span style={{ color: 'var(--text-secondary)' }}>{q.explanation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Generate New Quiz Banner */}
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Ready to test another concept?
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Generate a new quiz in DNN, CNDC, System Design, or customize your own topic with Azure AI.
                </p>
                <button onClick={handleResetQuiz} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
                  <Sparkles size={16} /> Generate New Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: AI Learning Recommendations ─────────────────────── */}
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

      {/* ── Quiz History Modal ──────────────────────────────────────── */}
      <ModalPortal isOpen={historyModalOpen}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #131722)',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Your AI Quiz History</h3>
              </div>
              <button className="icon-btn" onClick={() => setHistoryModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 size={32} className="animate-spin" color="var(--primary)" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading quiz history...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <BrainCircuit size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p>No past quizzes found. Generate your first quiz using Azure OpenAI!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {historyList.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span className="badge badge-primary">{item.topic || item.courseCode}</span>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>{item.difficulty}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {item.numberOfQuestions} questions &bull; Created by {item.createdBy || 'Azure OpenAI'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {item.attempt ? (
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: item.attempt.percentage >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                              {item.attempt.score} / {item.attempt.totalQuestions} ({item.attempt.percentage}%)
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Completed</span>
                          </div>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Unattempted</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ── TAB 5: AI Project Architect (Azure OpenAI GPT-4.1-mini) ── */}
      {activeTab === 'architect' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={22} color="var(--primary)" /> AI Capstone Project Architect
                </h2>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.3)', fontSize: '0.72rem' }}>
                  Powered by Azure AI Foundry
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Generate a complete final-year project proposal including Tech Stack, Database Schema, and a week-by-week implementation roadmap based on your interests.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.5rem', background: 'var(--bg-input)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>What are your core interests? (e.g., Healthcare, IoT, EdTech, Blockchain)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AI-based healthcare diagnostic tool using Medical Imaging"
                value={architectInterests}
                onChange={(e) => setArchitectInterests(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Project Complexity</label>
                <select className="form-select" value={architectComplexity} onChange={(e) => setArchitectComplexity(e.target.value)}>
                  <option value="Beginner">Beginner (Basic CRUD, Simple UI)</option>
                  <option value="Intermediate">Intermediate (Authentication, API Integrations, Medium Data)</option>
                  <option value="Advanced">Advanced (Microservices, AI Integration, Real-time, Scalable)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Preferred Tech Stack (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MERN, Python Django, Azure Services"
                  value={architectTech}
                  onChange={(e) => setArchitectTech(e.target.value)}
                />
              </div>
            </div>

            {architectError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                {architectError}
              </div>
            )}

            <button
              onClick={handleGenerateProject}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', marginTop: '0.5rem' }}
              disabled={architectLoading}
            >
              {architectLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Architecting Project...</>
              ) : (
                <><Sparkles size={18} /> Generate Project Blueprint</>
              )}
            </button>
          </div>

          {architectResult && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '2rem',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <div dangerouslySetInnerHTML={{ __html: architectResult.replace(/\n/g, '<br/>').replace(/### (.*?)(<br\/>|$)/g, '<h3>$1</h3>').replace(/# (.*?)(<br\/>|$)/g, '<h2>$1</h2>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AcademicToolsPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { flashcardAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ModalPortal from '../components/ModalPortal.jsx';
import AIJobPortal from '../components/AIJobPortal.jsx';
import FlashcardModal from '../components/flashcards/FlashcardModal.jsx';
import {
  Briefcase,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  Award,
  Upload,
  AlertCircle,
  X,
  Clock,
  MapPin,
  Users,
  Target,
  Star,
  TrendingUp,
  BookOpen,
  Zap,
  GraduationCap,
  RefreshCw,
  ChevronRight,
  DollarSign,
  BarChart3,
  MessageSquare,
  Loader2,
  Bot,
  History,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

/* ─── Shared Modal Overlay Style ───────────────────────────────────── */
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1.5rem',
  animation: 'fadeIn 0.25s ease'
};
const modalBoxStyle = {
  background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-subtle)', width: '100%',
  maxWidth: '680px', maxHeight: '90vh', display: 'flex',
  flexDirection: 'column', animation: 'scaleIn 0.25s ease',
  boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
};
const modalHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)',
  position: 'sticky', top: 0, background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', zIndex: 1
};
const modalBodyStyle = {
  padding: '1.5rem', overflowY: 'auto', flex: 1
};

/* ─── Spinner Component ─────────────────────────────────────────────── */
const Spinner = ({ text = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem', color: 'var(--text-muted)' }}>
    <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
    <span style={{ fontSize: '0.9rem' }}>{text}</span>
  </div>
);

/* ─── Stat Card ──────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{
    padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', flex: 1, minWidth: '160px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
      <Icon size={16} color={color || 'var(--primary)'} />
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color || 'var(--primary)', lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   CAREER HUB PAGE — Main Component
   ═══════════════════════════════════════════════════════════════════════ */
const CareerHubPage = ({ defaultTab }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(defaultTab || tabFromQuery || 'placement');

  // Keep activeTab in sync with query param or prop
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (tabFromQuery && ['placement', 'resume', 'counselor', 'interview'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [defaultTab, tabFromQuery]);

  /* ── Placement State ───────────────────────────────────────────────── */
  const [studentCgpa, setStudentCgpa] = useState('');
  const [studentBacklogs, setStudentBacklogs] = useState('0');
  const [placements, setPlacements] = useState([]);
  const [placementsLoading, setPlacementsLoading] = useState(false);
  const [placementError, setPlacementError] = useState('');
  const [eligibleCount, setEligibleCount] = useState(0);
  const [totalDrives, setTotalDrives] = useState(0);

  // Registration modal & persistence
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [registerModal, setRegisterModal] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  /* ── Resume Analyzer State ─────────────────────────────────────────── */
  const [resumeMode, setResumeMode] = useState('pdf'); // 'pdf' | 'paste'
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Fullstack Cloud Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [resumeError, setResumeError] = useState('');

  /* ── Career Counselor State (Azure AI Foundry GPT-4.1-mini + MongoDB) ── */
  const [counselorInterest, setCounselorInterest] = useState('Cloud & AI Architecture');
  const [counselorSemester, setCounselorSemester] = useState('5');
  const [counselorSkills, setCounselorSkills] = useState('Python, React, Docker, SQL');
  const [counselorGoals, setCounselorGoals] = useState('Secure an Azure Cloud & AI Architect role in Tier-1 company');
  const [counselorInput, setCounselorInput] = useState('');
  const [counselorMessages, setCounselorMessages] = useState([]);
  const [counselorSessionId, setCounselorSessionId] = useState(() => 'counsel-' + Math.random().toString(36).substring(2, 10));
  const [counselorLoading, setCounselorLoading] = useState(false);
  const [counselorSessionsList, setCounselorSessionsList] = useState([]);
  const [counselorShowSessions, setCounselorShowSessions] = useState(false);
  const [counselorRoadmapLoading, setCounselorRoadmapLoading] = useState(false);
  const [counselorData, setCounselorData] = useState(null);
  const [counselorModalOpen, setCounselorModalOpen] = useState(false);
  const counselorChatEndRef = useRef(null);

  /* ── Mock Interview State (Fully Dynamic — Azure AI) ──────────────── */
  const [interviewRole, setInterviewRole] = useState('Fullstack Engineer');
  const [interviewDifficulty, setInterviewDifficulty] = useState('Junior');
  const [interviewCategory, setInterviewCategory] = useState('Technical Concepts');
  const [currentQuestion, setCurrentQuestion] = useState(null);  // AI-generated question object
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState([]); // avoid repeats
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewResult, setInterviewResult] = useState(null);
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  
  // New Enhancements
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const maxQuestions = 5;

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  /* ── Smart Flashcards State (Azure AI Powered) ────────────────────────── */
  const [hubFlashcardModalOpen, setHubFlashcardModalOpen] = useState(false);
  const [hubFlashcards, setHubFlashcards] = useState([]);
  const [hubFlashcardTitle, setHubFlashcardTitle] = useState('');
  const [hubFlashcardModule, setHubFlashcardModule] = useState('mock_interview');
  const [hubFlashcardCategory, setHubFlashcardCategory] = useState('Interview');
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // 1. Generate "Revise Before Next Interview" Flashcards
  const generateMockInterviewRevisionDeck = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const weakItems = interviewHistory.filter(h => h.score < 80);
      const res = await flashcardAPI.generate({
        sourceModule: 'mock_interview',
        type: 'interview_revise_before_next',
        title: `Revise Before Next Interview: ${interviewRole}`,
        context: {
          role: interviewRole,
          difficulty: interviewDifficulty,
          category: interviewCategory,
          weakAnswers: weakItems.map(w => ({ question: w.question, score: w.score, answer: w.answer })),
          allQuestions: interviewHistory.map(h => ({ question: h.question, score: h.score })),
          missedConcepts: [...new Set(weakItems.map(w => w.category))]
        },
        count: 8,
        save: true
      });
      if (res.data?.data?.cards) {
        setHubFlashcards(res.data.data.cards);
        setHubFlashcardTitle(`Revise Before Next Interview (${interviewRole})`);
        setHubFlashcardModule('mock_interview');
        setHubFlashcardCategory('Interview Prep');
        setHubFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate interview revision flashcards:', err);
      alert('Failed to generate interview flashcards. Please try again.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // 2. Generate ATS & Resume Weakness Flashcards
  const generateResumeFlashcards = async () => {
    if (!atsAnalysis) return;
    setIsGeneratingFlashcards(true);
    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'resume_analyzer',
        type: 'ats_improvement',
        title: `ATS & Skill-Gap Flashcards: ${targetRole}`,
        context: {
          targetRole,
          atsScore: atsAnalysis.score,
          weaknesses: atsAnalysis.weaknesses || atsAnalysis.feedback || [],
          missingKeywords: atsAnalysis.missing || atsAnalysis.missingKeywords || [],
          matchedKeywords: atsAnalysis.matched || atsAnalysis.matchedKeywords || [],
          skillGaps: atsAnalysis.jobDescriptionComparison?.missingRequirements || [],
          sectionFeedback: atsAnalysis.sectionFeedback || {}
        },
        count: 10,
        save: true
      });
      if (res.data?.data?.cards) {
        setHubFlashcards(res.data.data.cards);
        setHubFlashcardTitle(`ATS Optimization & Skill-Gap Deck (${targetRole})`);
        setHubFlashcardModule('resume_analyzer');
        setHubFlashcardCategory('ATS & Career');
        setHubFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate resume flashcards:', err);
      alert('Failed to generate resume flashcards.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // 3. Generate Career Guidance Roadmap Flashcards
  const generateCareerGuidanceFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'career_guidance',
        type: 'career_roadmap',
        title: `${counselorInterest} — Roadmap & Placement Deck`,
        context: {
          targetDomain: counselorInterest,
          semester: counselorSemester,
          skills: counselorSkills,
          goals: counselorGoals,
          competencies: counselorData?.keyCompetencies || [],
          certifications: counselorData?.certificationsRecommended || [],
          milestones: counselorData?.milestones || []
        },
        count: 10,
        save: true
      });
      if (res.data?.data?.cards) {
        setHubFlashcards(res.data.data.cards);
        setHubFlashcardTitle(`${counselorInterest} — Career Roadmap Deck`);
        setHubFlashcardModule('career_guidance');
        setHubFlashcardCategory('Roadmap & Placement');
        setHubFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate career guidance flashcards:', err);
      alert('Failed to generate career guidance flashcards.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  /* ── Placement Fetch ───────────────────────────────────────────────── */
  const fetchPlacements = useCallback(async () => {
    setPlacementsLoading(true);
    setPlacementError('');
    try {
      const cgpaVal = parseFloat(studentCgpa) || 0;
      const backlogVal = parseInt(studentBacklogs, 10) || 0;
      const res = await api.post('/career/check-placement', {
        cgpa: cgpaVal,
        backlogs: backlogVal,
        department: user?.profile?.department || 'Computer Science'
      });
      if (res.data?.data?.companies) {
        setPlacements(res.data.data.companies);
        setEligibleCount(res.data.data.eligibleCount || 0);
        setTotalDrives(res.data.data.totalDrives || 0);
      }
    } catch (err) {
      console.error('Failed to fetch placements:', err);
      setPlacementError('Unable to load placement drives. Please try again.');
    } finally {
      setPlacementsLoading(false);
    }
  }, [studentCgpa, studentBacklogs, user]);

  // Auto-fetch on mount and when CGPA/backlogs change (debounced)
  useEffect(() => {
    // Set initial CGPA from user profile
    if (user?.profile?.cgpa && !studentCgpa) {
      const raw = Number(user.profile.cgpa);
      const val = raw <= 4.0 ? (raw * 2.5).toFixed(2) : String(raw);
      setStudentCgpa(val);
    } else if (!studentCgpa) {
      setStudentCgpa('8.65');
    }
  }, [user]);

  // Fetch existing registrations on mount / user change
  useEffect(() => {
    if (!user) return;
    api.get('/career/my-registrations')
      .then((res) => {
        if (res.data?.data?.registeredIds) {
          setRegisteredIds(new Set(res.data.data.registeredIds.map(String)));
        }
      })
      .catch(() => {});
  }, [user]);

  /* ── Resume ATS Analysis (PDF / Text) ──────────────────────────────── */
  const handleAnalyzeResume = async () => {
    setResumeError('');
    if (resumeMode === 'pdf') {
      if (!resumeFile) {
        setResumeError('Please select a PDF or DOCX resume file to upload.');
        return;
      }
      setIsAnalyzingResume(true);
      try {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('targetRole', targetRole);
        if (jobDescription.trim()) formData.append('jobDescription', jobDescription);

        const res = await api.post('/career/upload-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data?.data) {
          const d = res.data.data;
          setAtsAnalysis({
            score: d.atsScore,
            grade: d.grade,
            resumeSummary: d.resumeSummary || '',
            matched: d.matchedKeywords || d.keywordMatchAnalysis?.matchedKeywords || [],
            missing: d.missingKeywords || d.keywordMatchAnalysis?.missingKeywords || [],
            suggestedKeywords: d.keywordMatchAnalysis?.suggestedKeywords || [],
            feedback: d.feedback || d.improvementSuggestions || [],
            strengths: d.strengths || [],
            weaknesses: d.weaknesses || [],
            improvementSuggestions: d.improvementSuggestions || [],
            skillsDetected: d.skillsDetected || [],
            missingSkills: d.missingSkills || [],
            sectionFeedback: d.sectionFeedback || {},
            experienceAnalysis: d.experienceAnalysis || null,
            educationAnalysis: d.educationAnalysis || null,
            careerRecommendations: d.careerRecommendations || null,
            jobDescriptionComparison: d.jobDescriptionComparison || null,
            keywordMatchAnalysis: d.keywordMatchAnalysis || null,
            wordCount: d.wordCount || 0,
            analyzedBy: d.analyzedBy || 'Azure OpenAI',
            fileName: d.fileName || resumeFile.name,
            targetRole
          });
          setAtsModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to analyze uploaded resume:', err);
        setResumeError(err.response?.data?.message || 'We could not extract text from your PDF (it might be scanned or complex). Please switch to the "Paste Text" tab to continue.');
      } finally {
        setIsAnalyzingResume(false);
      }
    } else {
      if (!resumeText.trim()) {
        setResumeError('Please paste your resume content to analyze.');
        return;
      }
      setIsAnalyzingResume(true);
      try {
        const res = await api.post('/career/analyze-resume', {
          resumeText,
          targetRole,
          jobDescription: jobDescription.trim() || undefined
        });
        if (res.data?.data) {
          const d = res.data.data;
          setAtsAnalysis({
            score: d.atsScore,
            grade: d.grade,
            resumeSummary: d.resumeSummary || '',
            matched: d.matchedKeywords || d.keywordMatchAnalysis?.matchedKeywords || [],
            missing: d.missingKeywords || d.keywordMatchAnalysis?.missingKeywords || [],
            suggestedKeywords: d.keywordMatchAnalysis?.suggestedKeywords || [],
            feedback: d.feedback || d.improvementSuggestions || [],
            strengths: d.strengths || [],
            weaknesses: d.weaknesses || [],
            improvementSuggestions: d.improvementSuggestions || [],
            skillsDetected: d.skillsDetected || [],
            missingSkills: d.missingSkills || [],
            sectionFeedback: d.sectionFeedback || {},
            experienceAnalysis: d.experienceAnalysis || null,
            educationAnalysis: d.educationAnalysis || null,
            careerRecommendations: d.careerRecommendations || null,
            jobDescriptionComparison: d.jobDescriptionComparison || null,
            keywordMatchAnalysis: d.keywordMatchAnalysis || null,
            wordCount: d.wordCount || 0,
            analyzedBy: d.analyzedBy || 'Azure OpenAI',
            targetRole
          });
          setAtsModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to analyze resume text:', err);
        setResumeError('Analysis failed. Please check your connection and try again.');
      } finally {
        setIsAnalyzingResume(false);
      }
    }
  };

  /* ── Career Counselor Handlers (Azure AI Foundry + MongoDB) ────────── */
  const fetchCounselorSessions = useCallback(async () => {
    try {
      const res = await api.get('/career/counselor/sessions');
      if (res.data?.data) {
        setCounselorSessionsList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load counselor sessions:', err);
    }
  }, []);

  // Initialize counselor chat and load past sessions on tab switch
  useEffect(() => {
    if (activeTab === 'counselor') {
      fetchCounselorSessions();
      if (counselorMessages.length === 0) {
        setCounselorMessages([
          {
            messageId: 'welcome-advisor',
            sender: 'assistant',
            content: `👋 **Welcome to your AI Career Counselor powered by Azure AI Foundry (GPT-4.1-mini)!**\n\nI am your personalized university career strategist, tuned to current corporate recruitment bars, technical skill matrices, and semester milestones.\n\n*Review your skills and goal in the banner above, or choose a prompt below to begin your dynamic guidance session.*`,
            suggestedNextSteps: [
              `Review high-priority skills for ${counselorInterest}`,
              `Explore recommended certifications for Semester ${counselorSemester}`,
              `Generate a 6-month placement roadmap`
            ],
            recommendedRoles: [counselorInterest, 'Cloud Solutions Associate', 'Software Engineer'],
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [activeTab, fetchCounselorSessions, counselorInterest, counselorSemester]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'counselor') {
      counselorChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [counselorMessages, counselorLoading, activeTab]);

  const handleSendCounselorMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : counselorInput.trim();
    if (!textToSend || counselorLoading) return;

    const userMsg = {
      messageId: 'usr-' + Date.now(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setCounselorMessages(prev => [...prev, userMsg]);
    setCounselorInput('');
    setCounselorLoading(true);

    try {
      const parsedSkills = counselorSkills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/career/counselor/message', {
        sessionId: counselorSessionId,
        message: textToSend,
        interests: [counselorInterest],
        skills: parsedSkills,
        careerGoals: counselorGoals,
        targetDomain: counselorInterest,
        semester: parseInt(counselorSemester, 10) || 5,
        cgpa: studentCgpa || ''
      });

      if (res.data?.data) {
        const { message: aiMsg, sessionId: returnedSessionId } = res.data.data;
        if (returnedSessionId) setCounselorSessionId(returnedSessionId);
        setCounselorMessages(prev => [...prev, aiMsg]);
        fetchCounselorSessions();
      }
    } catch (err) {
      console.error('Career counselor message failed:', err);
      setCounselorMessages(prev => [
        ...prev,
        {
          messageId: 'err-' + Date.now(),
          sender: 'assistant',
          content: '⚠️ I encountered an error connecting to Azure AI Foundry. Please check your network or try asking again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setCounselorLoading(false);
    }
  };

  const handleLoadCounselorSession = async (sessId) => {
    try {
      setCounselorLoading(true);
      const res = await api.get(`/career/counselor/sessions/${sessId}`);
      if (res.data?.data) {
        const s = res.data.data;
        setCounselorSessionId(s.sessionId);
        if (s.targetDomain) setCounselorInterest(s.targetDomain);
        if (s.semester) setCounselorSemester(String(s.semester));
        if (s.skills?.length) setCounselorSkills(s.skills.join(', '));
        if (s.careerGoals) setCounselorGoals(s.careerGoals);
        if (s.messages?.length) {
          setCounselorMessages(s.messages);
        }
        setCounselorShowSessions(false);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setCounselorLoading(false);
    }
  };

  const handleStartNewCounselorSession = () => {
    const newId = 'counsel-' + Math.random().toString(36).substring(2, 10);
    setCounselorSessionId(newId);
    setCounselorMessages([
      {
        messageId: 'welcome-new',
        sender: 'assistant',
        content: `🎯 **New Career Counseling Session Started!**\n\nTargeting **${counselorInterest}** in **Semester ${counselorSemester}** with skills in **${counselorSkills}**.\n\n*What specific guidance, placement questions, or roadmap milestones would you like to explore today?*`,
        suggestedNextSteps: [
          'Identify missing technical skills',
          'Explore Tier-1 placement cutoffs and expectations',
          'Build an impactful capstone project'
        ],
        recommendedRoles: [counselorInterest],
        timestamp: new Date()
      }
    ]);
    setCounselorShowSessions(false);
  };

  const handleDeleteCounselorSession = async (sessId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/career/counselor/sessions/${sessId}`);
      setCounselorSessionsList(prev => prev.filter(s => s.sessionId !== sessId));
      if (counselorSessionId === sessId) {
        handleStartNewCounselorSession();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  /* ── Dynamic Roadmap Fetch (Azure AI GPT-4.1-mini) ──────────────────── */
  const handleFetchCounseling = async () => {
    setCounselorRoadmapLoading(true);
    try {
      const parsedSkills = counselorSkills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/career/career-counseling', {
        primaryInterest: counselorInterest,
        semester: parseInt(counselorSemester, 10) || 5,
        skills: parsedSkills,
        careerGoals: counselorGoals
      });
      if (res.data?.data) {
        setCounselorData(res.data.data);
        setCounselorModalOpen(true);
      }
    } catch (err) {
      console.error('Career counseling roadmap failed:', err);
    } finally {
      setCounselorRoadmapLoading(false);
    }
  };

  /* ── Mock Interview — Dynamic AI Question Generation ──────────────── */
  const handleGenerateQuestion = async (followUp = false) => {
    setIsGeneratingQuestion(true);
    setCurrentQuestion(null);
    setInterviewAnswer('');
    setInterviewResult(null);
    setTimerActive(false);
    setTimeLeft(180);
    
    try {
      const payload = {
        role: interviewRole,
        difficulty: interviewDifficulty,
        category: interviewCategory,
        previousQuestions: previousQuestions.slice(-5)
      };

      if (followUp && interviewHistory.length > 0) {
        payload.isFollowUp = true;
        payload.lastAnswer = interviewHistory[interviewHistory.length - 1].answer;
      }

      const res = await api.post('/career/interview/generate-question', payload);
      if (res.data?.data) {
        setCurrentQuestion(res.data.data);
        setPreviousQuestions(prev => [...prev, res.data.data.question]);
        setInterviewStarted(true);
        setTimerActive(true);
        setIsFollowUp(followUp);
      }
    } catch (err) {
      console.error('Failed to generate question:', err);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  /* ── Mock Interview — Dynamic AI Evaluation ──────────────────────── */
  const handleEvaluateInterview = async () => {
    if (!interviewAnswer.trim() || !currentQuestion) return;
    setIsEvaluatingInterview(true);
    setTimerActive(false);
    try {
      const res = await api.post('/career/simulate-interview', {
        role: interviewRole,
        question: currentQuestion.question,
        category: currentQuestion.category,
        difficulty: interviewDifficulty,
        answerText: interviewAnswer
      });
      if (res.data?.data) {
        setInterviewResult(res.data.data);
        const newHistory = [...interviewHistory, {
          question: currentQuestion.question,
          category: currentQuestion.category,
          difficulty: interviewDifficulty,
          score: res.data.data.score,
          communicationScore: res.data.data.communicationScore,
          technicalScore: res.data.data.technicalScore,
          problemSolvingScore: res.data.data.problemSolvingScore,
          grade: res.data.data.grade,
          answer: interviewAnswer
        }];
        setInterviewHistory(newHistory);
        setInterviewModalOpen(true);
        
        if (newHistory.length >= maxQuestions) {
          setSessionCompleted(true);
        }
      }
    } catch (err) {
      console.error('Failed to evaluate interview:', err);
    } finally {
      setIsEvaluatingInterview(false);
    }
  };

  const handleNextQuestion = (followUp = false) => {
    setInterviewAnswer('');
    setInterviewResult(null);
    setInterviewModalOpen(false);
    if (sessionCompleted && !followUp) return;
    handleGenerateQuestion(followUp);
  };
  
  const handleEndSession = () => {
    setSessionCompleted(true);
    setCurrentQuestion(null);
    setTimerActive(false);
  };

  const getAvgScore = (key = 'score') => {
    if (interviewHistory.length === 0) return 0;
    return Math.round(interviewHistory.reduce((s, h) => s + (h[key] || h.score), 0) / interviewHistory.length);
  };

  /* ── Registration Modal & DB-Backed Handlers ───────────────────────── */
  const handleRegister = (drive) => {
    if (registeredIds.has(String(drive.id))) {
      alert(`You are already registered for ${drive.name}.`);
      return;
    }
    setRegisterModal(drive);
    setRegisterSuccess(false);
    setRegisterError('');
  };

  const confirmRegistration = async () => {
    if (!registerModal) return;
    setRegisterLoading(true);
    setRegisterError('');
    try {
      const res = await api.post(`/career/placements/${registerModal.id}/register`);
      if (res.data?.success) {
        setRegisteredIds((prev) => new Set([...prev, String(registerModal.id)]));
        setRegisterSuccess(true);
        setTimeout(() => {
          setRegisterModal(null);
          setRegisterSuccess(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      if (err.response?.status === 409 || err.response?.data?.alreadyRegistered) {
        setRegisteredIds((prev) => new Set([...prev, String(registerModal.id)]));
        setRegisterError('You are already registered for this placement drive.');
      } else {
        setRegisterError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  /* ── Tab Configuration ─────────────────────────────────────────────── */
  const tabs = [
    { id: 'placement', label: 'Placement Eligibility', icon: Briefcase },
    { id: 'resume', label: 'ATS Resume Analyzer', icon: Upload },
    { id: 'counselor', label: 'AI Career Counselor', icon: Compass },
    { id: 'interview', label: 'Mock Interview', icon: Sparkles },
    { id: 'jobs', label: 'AI Job Matches', icon: Briefcase }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <Briefcase size={16} /> Corporate Placement &amp; Career Gateway
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Career &amp; Placement Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Evaluate corporate eligibility cutoffs, analyze your resume with ATS scoring, chart career roadmaps, and practice with AI mock interviews.
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.1rem', borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         TAB 1 — Placement Eligibility Checker
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'placement' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="var(--primary)" /> On-Campus Recruitment Drives
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Screening based on verified academic credentials, CGPA cutoffs, and active backlog allowances.
              </p>
            </div>
          </div>

          {/* Editable CGPA / Backlogs Inputs */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: '0 0 170px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Your CGPA (out of 10.0)</label>
              <input
                type="number"
                className="form-input"
                value={studentCgpa}
                onChange={(e) => setStudentCgpa(e.target.value)}
                min="0" max="10" step="0.01"
                placeholder="e.g. 8.65"
                style={{ fontSize: '1rem', fontWeight: 700 }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, flex: '0 0 160px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Active Backlogs</label>
              <input
                type="number"
                className="form-input"
                value={studentBacklogs}
                onChange={(e) => setStudentBacklogs(e.target.value)}
                min="0" max="20"
                style={{ fontSize: '1rem', fontWeight: 700 }}
              />
            </div>
            <button onClick={fetchPlacements} className="btn btn-primary" style={{ height: '42px' }} disabled={placementsLoading}>
              <RefreshCw size={14} /> Check Eligibility
            </button>
          </div>

          {/* Summary Stats */}
          {!placementsLoading && placements.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <StatCard icon={Briefcase} label="Total Drives" value={totalDrives} color="var(--primary)" sub="Active on-campus drives" />
              <StatCard icon={CheckCircle2} label="Eligible" value={eligibleCount} color="var(--success)" sub="You can apply" />
              <StatCard icon={XCircle} label="Not Eligible" value={totalDrives - eligibleCount} color="var(--danger)" sub="Cutoff unmet" />
              <StatCard icon={TrendingUp} label="Match Rate" value={`${totalDrives > 0 ? Math.round((eligibleCount / totalDrives) * 100) : 0}%`} color="var(--accent-purple)" sub="Eligibility percentage" />
            </div>
          )}

          {/* Error / Loading / Drives List */}
          {placementError && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} /> {placementError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {placementsLoading ? (
              <Spinner text="Fetching placement drives from database..." />
            ) : placements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p>No placement drives found. Check back soon or contact the placement cell.</p>
              </div>
            ) : placements.map((drive) => {
              const isEligible = drive.isEligible;
              const isRegistered = registeredIds.has(String(drive.id));
              const packageDisplay = drive.packageLPA ? `${drive.packageLPA} LPA` : 'Competitive';
              return (
                <div
                  key={drive.id}
                  style={{
                    padding: '1.5rem', background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isRegistered ? 'rgba(99,102,241,0.4)' : isEligible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '1.25rem',
                    transition: 'all 0.2s',
                    cursor: isEligible && !isRegistered ? 'pointer' : 'default'
                  }}
                  onClick={() => isEligible && !isRegistered && handleRegister(drive)}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{drive.tier}</span>
                      <span
                        className={`badge ${isRegistered ? '' : isEligible ? 'badge-success' : 'badge-danger'}`}
                        style={isRegistered ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' } : {}}
                      >
                        {isRegistered ? '✅ Registered' : isEligible ? '✅ Eligible' : '❌ Cutoff Unmet'}
                      </span>
                      {drive.openPositions && (
                        <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', fontSize: '0.7rem' }}>
                          <Users size={11} /> {drive.openPositions} positions
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.2rem' }}>{drive.name}</h3>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                      {drive.role} &bull; <span style={{ color: 'var(--success)' }}>₹{packageDisplay}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>Min CGPA: <strong>{drive.minCgpa} / 10</strong></span>
                      <span>Max Backlogs: <strong>{drive.maxBacklogs ?? 'N/A'}</strong></span>
                      <span><Clock size={12} /> Deadline: {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    {drive.statusReason && !isEligible && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--danger)', fontStyle: 'italic' }}>
                        ⚠️ {drive.statusReason}
                      </div>
                    )}
                  </div>

                  <div>
                    {isRegistered ? (
                      <button
                        disabled
                        style={{
                          padding: '0.65rem 1.4rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(99,102,241,0.4)',
                          background: 'rgba(99,102,241,0.12)',
                          color: '#818cf8',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <CheckCircle2 size={16} /> Registered
                      </button>
                    ) : isEligible ? (
                      <button className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }} onClick={(e) => { e.stopPropagation(); handleRegister(drive); }}>
                        <CheckCircle2 size={16} /> Register
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                        <XCircle size={16} /> Ineligible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         TAB 2 — ATS Resume Analyzer
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'resume' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={20} color="var(--primary)" /> Intelligent Resume ATS Parser &amp; Scoring
            </h2>
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setResumeMode('pdf')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: resumeMode === 'pdf' ? 'var(--primary-gradient)' : 'transparent',
                  color: resumeMode === 'pdf' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Upload PDF Resume
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('paste')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: resumeMode === 'paste' ? 'var(--primary-gradient)' : 'transparent',
                  color: resumeMode === 'paste' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Paste Text
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Upload your PDF resume or paste text to evaluate keyword match index, industry phrasing, and ATS rejection risks.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* Target Role */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target Role</label>
              <select
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="Fullstack Cloud Engineer">Fullstack Cloud Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Cloud Architect">Cloud Architect</option>
                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                <option value="Software Development Engineer">Software Development Engineer</option>
              </select>
            </div>

            {/* Resume Input Mode: PDF vs Paste */}
            {resumeMode === 'pdf' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Upload Resume (PDF or DOCX)</label>
                <div
                  style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: resumeFile ? 'rgba(16,185,129,0.06)' : 'var(--bg-input)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    id="resume-file-input"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResumeFile(e.target.files[0]);
                        setResumeError('');
                      }
                    }}
                  />
                  {resumeFile ? (
                    <div>
                      <CheckCircle2 size={44} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {resumeFile.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {(resumeFile.size / 1024).toFixed(1)} KB &bull; Ready for backend parsing
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeFile(null);
                        }}
                        className="btn btn-secondary"
                        style={{ marginTop: '1rem', padding: '0.35rem 0.85rem', fontSize: '0.78rem', position: 'relative', zIndex: 3 }}
                      >
                        Choose Different File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={44} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '0.75rem' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                        Click to select or drag and drop your resume file
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Supports PDF and DOCX files up to 5MB
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Resume Content / Experience Summary</label>
                <textarea
                  rows={10}
                  className="form-textarea"
                  value={resumeText}
                  onChange={(e) => { setResumeText(e.target.value); setResumeError(''); }}
                  placeholder="Paste your full resume text here... Include your skills, experience, projects, education, and certifications for the most accurate ATS analysis."
                  style={{ fontSize: '0.88rem', lineHeight: 1.6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {resumeText.length} characters • {resumeText.split(/\s+/).filter(Boolean).length} words
                  </span>
                  {resumeText.length > 0 && resumeText.length < 200 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                      ⚠️ Add more content for accurate analysis (min 200 chars)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Job Description (optional) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={14} color="var(--accent-purple)" />
                Job Description <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional — paste JD to get a targeted match score)</span>
              </label>
              <textarea
                rows={4}
                className="form-textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here to get a precise JD match score and tailored keyword recommendations..."
                style={{ fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical' }}
              />
            </div>

            {resumeError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={14} /> {resumeError}
              </div>
            )}

            <button onClick={handleAnalyzeResume} className="btn btn-primary" disabled={isAnalyzingResume} style={{ width: '100%', padding: '0.85rem' }}>
              {isAnalyzingResume ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing with Azure AI (GPT-4.1-mini)...</>
              ) : (
                <><BarChart3 size={16} /> Run Full ATS Analysis with Azure AI</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         TAB 3 — AI Career Counselor (Azure AI Foundry GPT-4.1-mini)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'counselor' && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                <Sparkles size={14} /> Powered by Azure AI Foundry (gpt-4.1-mini)
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={22} color="var(--accent-purple)" /> AI Career Counselor &amp; Roadmap Strategist
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Dynamic 1-on-1 career guidance tailored to your semester, skillset, and corporate placement ambitions.
              </p>
            </div>

            {/* Session Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleStartNewCounselorSession}
                className="btn"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem'
                }}
              >
                <Plus size={14} /> New Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setCounselorShowSessions(!counselorShowSessions);
                  fetchCounselorSessions();
                }}
                className="btn"
                style={{
                  background: counselorShowSessions ? 'var(--primary-gradient)' : 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: counselorShowSessions ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem'
                }}
              >
                <History size={14} /> Saved Sessions ({counselorSessionsList.length})
              </button>
            </div>
          </div>

          {/* Collapsible Past Sessions Drawer */}
          {counselorShowSessions && (
            <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📁 Previous Counseling Sessions (MongoDB)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click any session to restore chat history
                </span>
              </div>
              {counselorSessionsList.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  No saved counseling sessions yet. Start chatting below to automatically persist your sessions.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {counselorSessionsList.map((s) => (
                    <div
                      key={s.sessionId}
                      onClick={() => handleLoadCounselorSession(s.sessionId)}
                      style={{
                        padding: '0.85rem 1rem',
                        background: counselorSessionId === s.sessionId ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                        border: counselorSessionId === s.sessionId ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {s.targetDomain} • {s.messageCount} msg{s.messageCount !== 1 ? 's' : ''} • Sem {s.semester}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCounselorSession(s.sessionId, e)}
                        title="Delete session"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Student Profile Configuration Bar */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={15} /> Your Counseling Profile &amp; Focus Area
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Azure AI customizes all roadmaps and recommendations to these parameters
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Target Domain / Field</label>
                <select
                  className="form-input"
                  value={counselorInterest}
                  onChange={(e) => setCounselorInterest(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="Cloud & AI Architecture">Cloud &amp; AI Architecture</option>
                  <option value="Fullstack Software Engineering">Fullstack Software Engineering</option>
                  <option value="Frontend Engineering">Frontend Engineering</option>
                  <option value="Backend Engineering">Backend Engineering</option>
                  <option value="Data Science & Machine Learning">Data Science &amp; Machine Learning</option>
                  <option value="Cybersecurity & Defense">Cybersecurity &amp; Defense</option>
                  <option value="DevOps & Site Reliability Engineering">DevOps &amp; Site Reliability Engineering</option>
                  <option value="Product Management">Product Management</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Current Semester</label>
                <select
                  className="form-input"
                  value={counselorSemester}
                  onChange={(e) => setCounselorSemester(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Current Skills (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={counselorSkills}
                  onChange={(e) => setCounselorSkills(e.target.value)}
                  placeholder="e.g. Python, React, Docker, SQL"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Career Goal</label>
                <input
                  type="text"
                  className="form-input"
                  value={counselorGoals}
                  onChange={(e) => setCounselorGoals(e.target.value)}
                  placeholder="e.g. Tier-1 placement as an Azure Cloud Architect"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Quick Roadmap Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Tip: Hit roadmap generation to get formal AI salary ranges, electives, and semester milestones.
              </div>
              <button
                type="button"
                onClick={handleFetchCounseling}
                className="btn btn-primary"
                disabled={counselorRoadmapLoading}
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {counselorRoadmapLoading ? (
                  <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating AI Roadmap...</>
                ) : (
                  <><Compass size={14} /> Generate Full Semester Roadmap Modal</>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Chat Messages Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '380px',
              maxHeight: '520px',
              overflowY: 'auto',
              padding: '1.25rem',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              gap: '1.2rem'
            }}
          >
            {counselorMessages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.messageId || idx}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isUser ? '#334155' : 'var(--primary-gradient)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    {isUser ? <Users size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div
                      style={{
                        padding: '0.9rem 1.15rem',
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isUser ? 'var(--primary-gradient)' : 'var(--bg-card)',
                        color: isUser ? '#ffffff' : 'var(--text-primary)',
                        border: isUser ? 'none' : '1px solid var(--border-subtle)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        boxShadow: isUser ? '0 4px 14px rgba(59, 130, 246, 0.25)' : 'var(--shadow-sm)'
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Metadata Badges from AI (Recommended Roles & Action Steps) */}
                    {!isUser && (
                      <>
                        {msg.recommendedRoles?.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Suggested Roles:</span>
                            {msg.recommendedRoles.map((role, rIdx) => (
                              <span key={rIdx} className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                                <Briefcase size={11} /> {role}
                              </span>
                            ))}
                          </div>
                        )}
                        {msg.suggestedNextSteps?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Action Checklist:</span>
                            {msg.suggestedNextSteps.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.25rem 0.6rem',
                                  background: 'rgba(59, 130, 246, 0.06)',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(59, 130, 246, 0.15)'
                                }}
                              >
                                <Check size={12} color="var(--success)" /> {step}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: isUser ? 'right' : 'left' }}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {counselorLoading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Bot size={16} />
                </div>
                <div style={{ padding: '0.65rem 1rem', borderRadius: '14px 14px 14px 2px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={14} className="animate-spin" color="var(--primary)" />
                  <span>Azure AI Foundry GPT-4.1-mini is analyzing your profile...</span>
                </div>
              </div>
            )}

            <div ref={counselorChatEndRef} />
          </div>

          {/* Quick Prompt Suggestion Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
            {[
              `What skills should I prioritize in Semester ${counselorSemester}?`,
              `Recommend 3 impressive capstone projects for ${counselorInterest}`,
              `Which certifications are most respected by hiring managers?`,
              `Evaluate my current skillset and highlight gaps for campus placements`,
              `How should I prepare for technical interviews in this domain?`
            ].map((promptText, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendCounselorMessage(promptText)}
                disabled={counselorLoading}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                💡 {promptText}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCounselorMessage();
            }}
            style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}
          >
            <input
              type="text"
              className="form-input"
              value={counselorInput}
              onChange={(e) => setCounselorInput(e.target.value)}
              placeholder={`Ask anything regarding career roadmaps, skill gaps, or campus drive preparation...`}
              disabled={counselorLoading}
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.88rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={counselorLoading || !counselorInput.trim()}
              style={{ padding: '0.75rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {counselorLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>Send</span>
            </button>
          </form>

          {/* Live Market Benchmark Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
            <StatCard icon={DollarSign} label="Target Starting Salary" value="₹18-32 LPA" color="var(--success)" sub={`${counselorInterest} Tier-1`} />
            <StatCard icon={TrendingUp} label="Market Demand Growth" value="+34%" color="var(--primary)" sub="5-year projected trajectory" />
            <StatCard icon={Award} label="Core High-Impact Skill" value="Cloud & AI" color="var(--accent-purple)" sub="Top requested capability" />
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         TAB 4 — AI Mock Interview Simulator (Fully Dynamic with Azure AI)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'interview' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> Interactive AI Mock Interview Studio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            AI-powered interview simulation. Every question is dynamically generated by Azure GPT-4.1-mini based on your chosen role, difficulty, and category.
          </p>

          {/* ── Interview Configuration ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target Role</label>
              <select className="form-input" value={interviewRole} onChange={(e) => setInterviewRole(e.target.value)}>
                <option value="Fullstack Engineer">Fullstack Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Cloud Engineer">Cloud Engineer</option>
                <option value="Data Engineer">Data Engineer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="ML Engineer">ML Engineer</option>
                <option value="Mobile Developer">Mobile Developer</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Difficulty</label>
              <select className="form-input" value={interviewDifficulty} onChange={(e) => setInterviewDifficulty(e.target.value)}>
                <option value="Junior">Junior (Foundational)</option>
                <option value="Mid">Mid (Edge Cases & Performance)</option>
                <option value="Senior">Senior (System Architecture)</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-input" value={interviewCategory} onChange={(e) => setInterviewCategory(e.target.value)}>
                <option value="Technical Concepts">Technical Concepts</option>
                <option value="System Design">System Design</option>
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Behavioral / Leadership">Behavioral / Leadership</option>
                <option value="Problem Solving">Problem Solving</option>
                <option value="Database Design">Database Design</option>
                <option value="API Design & Security">API Design & Security</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
              </select>
            </div>
          </div>

          {/* ── Progress Tracker & Session Overview ── */}
          {(interviewStarted || sessionCompleted) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Interview Progress</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '150px', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(interviewHistory.length / maxQuestions) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{interviewHistory.length} / {maxQuestions}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Role Context</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <span className="badge" style={{ background: 'var(--bg-input)' }}>{interviewRole}</span>
                  <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}>{interviewCategory}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Session Completed Summary ── */}
          {sessionCompleted && (
            <div className="animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', marginBottom: '1.5rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(59,130,246,0.1)' }}>
              <Award size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Interview Complete!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>You've successfully answered {interviewHistory.length} questions. Here is your AI performance analysis.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon={Target} label="Overall Score" value={`${getAvgScore('score')}/100`} color="var(--primary)" />
                <StatCard icon={MessageSquare} label="Communication" value={`${getAvgScore('communicationScore')}/100`} color="var(--accent-purple)" />
                <StatCard icon={TrendingUp} label="Technical" value={`${getAvgScore('technicalScore')}/100`} color="var(--success)" />
                <StatCard icon={Zap} label="Problem Solving" value={`${getAvgScore('problemSolvingScore')}/100`} color="#f59e0b" />
              </div>

              {/* History list inside Summary */}
              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Question Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {interviewHistory.map((h, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <span style={{
                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: h.score >= 80 ? 'rgba(16,185,129,0.15)' : h.score >= 60 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                        color: h.score >= 80 ? 'var(--success)' : h.score >= 60 ? 'var(--primary)' : 'var(--danger, #ef4444)',
                        fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                      }}>
                        {h.score}
                      </span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: 600 }}>{h.question}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.category} • {h.difficulty}</div>
                      </div>
                      <span className="badge" style={{
                        background: h.score >= 80 ? 'rgba(16,185,129,0.15)' : h.score >= 60 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                        color: h.score >= 80 ? 'var(--success)' : h.score >= 60 ? 'var(--primary)' : 'var(--danger, #ef4444)',
                      }}>
                        {h.grade || (h.score >= 80 ? 'Strong' : h.score >= 60 ? 'Good' : 'Needs Work')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Action Plan */}
              <div style={{ textAlign: 'left', background: 'rgba(59,130,246,0.05)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', border: '1px solid rgba(59,130,246,0.15)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} /> Personalized Preparation Plan
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Top Topics to Revise</div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      {[...new Set(interviewHistory.filter(h => h.score < 80).map(h => h.category))].slice(0, 5).map((topic, i) => (
                        <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{topic}</li>
                      ))}
                      {interviewHistory.filter(h => h.score < 80).length === 0 && (
                        <li style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.3rem' }}>Great job! Focus on advanced System Design.</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Next Steps</div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Practice answering within 3 minutes.</li>
                      <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Use the STAR method for behavioral questions.</li>
                      <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Focus on explaining edge cases dynamically.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={generateMockInterviewRevisionDeck}
                  disabled={isGeneratingFlashcards}
                  className="btn"
                  style={{
                    padding: '0.85rem 1.8rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isGeneratingFlashcards ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGeneratingFlashcards ? 'Generating Deck...' : '🎴 Revise Before Next Interview (Smart Flashcards)'}
                </button>
                <button onClick={() => { setSessionCompleted(false); setInterviewHistory([]); setInterviewStarted(false); }} className="btn btn-primary" style={{ padding: '0.85rem 1.8rem' }}>
                  <RefreshCw size={16} /> Start New Session
                </button>
              </div>
            </div>
          )}

          {/* ── Not Started State / Generate First Question ── */}
          {!interviewStarted && !currentQuestion && !isGeneratingQuestion && !sessionCompleted && (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)', marginBottom: '1.5rem', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Sparkles size={40} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ready to Practice?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Configure your target role, difficulty, and focus area. You will face {maxQuestions} AI-generated questions mirroring real-world placement scenarios.
              </p>
              <button onClick={() => handleGenerateQuestion(false)} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.05rem', fontWeight: 600 }}>
                <Target size={18} /> Start {maxQuestions}-Question Interview Session
              </button>
            </div>
          )}

          {/* ── Loading Question ── */}
          {isGeneratingQuestion && !sessionCompleted && (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <Loader2 size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Azure AI is crafting your {isFollowUp ? 'follow-up' : 'next'} question...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Tailoring to your {interviewDifficulty}-level {interviewCategory} profile for {interviewRole}
              </p>
            </div>
          )}

          {/* ── Current AI-Generated Question ── */}
          {currentQuestion && !isGeneratingQuestion && !sessionCompleted && (
            <div className="animate-fade-in">
              <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question {interviewHistory.length + 1}
                    </span>
                    {isFollowUp && (
                      <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>
                        Follow-Up
                      </span>
                    )}
                  </div>
                  
                  {/* Timer Display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', background: timeLeft <= 30 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.05)', color: timeLeft <= 30 ? 'var(--danger)' : 'var(--text-primary)', border: `1px solid ${timeLeft <= 30 ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`, transition: 'all 0.3s ease' }}>
                    <Clock size={14} className={timeLeft <= 30 ? "animate-pulse" : ""} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                  "{currentQuestion.question}"
                </div>

                {/* Expected Key Points */}
                {currentQuestion.expectedKeyPoints && currentQuestion.expectedKeyPoints.length > 0 && (
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Keywords to Include:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {currentQuestion.expectedKeyPoints.map((kp, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {kp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Tip / STAR Hint */}
                {currentQuestion.tip && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.8rem 1rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Zap size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', lineHeight: 1.5 }}>
                      <strong>Pro Tip:</strong> {currentQuestion.tip}
                      {currentQuestion.category.includes('Behavioral') && " Remember to use the STAR method: Situation, Task, Action, Result."}
                    </span>
                  </div>
                )}
              </div>

              {/* Answer Textarea */}
              <div className="form-group" style={{ margin: '0 0 1.5rem 0' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Your Response</span>
                  {interviewAnswer.length > 50 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>Analyzing confidence...</span>
                  )}
                </label>
                <textarea
                  rows={8}
                  className="form-textarea"
                  placeholder="Structure your answer clearly. Discuss trade-offs, provide real-world examples, and handle edge cases..."
                  value={interviewAnswer}
                  onChange={(e) => setInterviewAnswer(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '160px', fontSize: '0.95rem', lineHeight: 1.6, padding: '1rem', background: 'var(--bg-card)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span>{interviewAnswer.length} characters</span>
                  <span style={{ fontWeight: 600, color: interviewAnswer.length < 50 ? 'var(--danger)' : interviewAnswer.length < 150 ? 'var(--primary)' : 'var(--success)' }}>
                    {interviewAnswer.length < 50 ? '⚠️ Too short (aim for 150+ chars)' : interviewAnswer.length < 150 ? '📝 Good start (keep adding details)' : '✅ Excellent detail depth'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={handleEvaluateInterview} className="btn btn-primary" disabled={isEvaluatingInterview || !interviewAnswer.trim() || timeLeft === 0} style={{ flex: 2, padding: '1rem', fontSize: '1rem' }}>
                  {isEvaluatingInterview ? (
                    <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating with Azure AI...</>
                  ) : (
                    <><Send size={18} /> Submit for AI Critique</>
                  )}
                </button>
                <button onClick={() => handleNextQuestion(false)} className="btn" disabled={isGeneratingQuestion} style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '1rem' }}>
                  {isGeneratingQuestion ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</>
                  ) : (
                    <><ChevronRight size={16} /> Skip Question</>
                  )}
                </button>
                <button onClick={handleEndSession} className="btn" style={{ flex: '0 0 auto', padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none' }}>
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — Placement Registration
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={!!registerModal}>
        {registerModal && (
          <div style={overlayStyle} onClick={() => setRegisterModal(null)}>
            <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} color="var(--primary)" />
                  {registerSuccess ? 'Registration Confirmed!' : 'Register for Placement Drive'}
                </h3>
                <button className="icon-btn" onClick={() => setRegisterModal(null)} style={{ width: 32, height: 32 }}>
                  <X size={16} />
                </button>
              </div>
              <div style={modalBodyStyle}>
                {registerSuccess ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <CheckCircle2 size={56} color="var(--success)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--success)' }}>
                      Successfully Registered!
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      You have been registered for <strong>{registerModal.name}</strong>. Check your email for further instructions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '1.25rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>{registerModal.name}</h4>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{registerModal.role}</div>
                      <span className="badge badge-success">₹{registerModal.packageLPA} LPA</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min CGPA Required</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.minCgpa} / 10.0</div>
                      </div>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Backlogs</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.maxBacklogs}</div>
                      </div>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open Positions</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.openPositions || 'N/A'}</div>
                      </div>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deadline</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.deadline ? new Date(registerModal.deadline).toLocaleDateString() : 'TBD'}</div>
                      </div>
                    </div>

                    {registerModal.requiredSkills && registerModal.requiredSkills.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Required Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {registerModal.requiredSkills.map((skill) => (
                            <span key={skill} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} /> <strong>You meet all eligibility criteria for this drive.</strong>
                      </div>
                    </div>

                    <button onClick={confirmRegistration} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} /> Confirm Registration
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — ATS Resume Analysis Results (Full Azure AI Output)
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={atsModalOpen}>
        <div style={overlayStyle} onClick={() => setAtsModalOpen(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>ATS Analysis Report</h3>
                {atsAnalysis?.analyzedBy && (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 600 }}>
                    {atsAnalysis.analyzedBy}
                  </span>
                )}
              </div>
              <button className="icon-btn" onClick={() => setAtsModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              {atsAnalysis && (
                <>
                  {/* ── Hero Score Block ── */}
                  <div style={{
                    display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.5rem', borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                    border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1.5rem', flexWrap: 'wrap'
                  }}>
                    <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ATS Score</div>
                      <div style={{
                        fontSize: '4rem', fontWeight: 800, lineHeight: 1,
                        background: atsAnalysis.score >= 75 ? 'linear-gradient(135deg, #10b981, #34d399)' : atsAnalysis.score >= 55 ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                      }}>
                        {atsAnalysis.score}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span className={`badge ${atsAnalysis.score >= 80 ? 'badge-success' : atsAnalysis.score >= 60 ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: '0.82rem' }}>
                          {atsAnalysis.grade || 'Evaluated'}
                        </span>
                      </div>
                      {atsAnalysis.fileName && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>📄 {atsAnalysis.fileName}</div>}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>🎯 Target: <strong style={{ color: 'var(--text-primary)' }}>{atsAnalysis.targetRole}</strong></div>
                      {atsAnalysis.wordCount > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📝 {atsAnalysis.wordCount} words detected</div>}
                    </div>
                    {atsAnalysis.keywordMatchAnalysis && (
                      <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keyword Match</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                          {atsAnalysis.keywordMatchAnalysis.matchPercentage ?? Math.round((atsAnalysis.matched.length / Math.max(atsAnalysis.matched.length + atsAnalysis.missing.length, 1)) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── AI Resume Summary ── */}
                  {atsAnalysis.resumeSummary && (
                    <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Resume Summary</div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{atsAnalysis.resumeSummary}</p>
                    </div>
                  )}

                  {/* ── Strengths & Weaknesses ── */}
                  {(atsAnalysis.strengths?.length > 0 || atsAnalysis.weaknesses?.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      {atsAnalysis.strengths?.length > 0 && (
                        <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> Strengths
                          </div>
                          <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                            {atsAnalysis.strengths.map((s, i) => (
                              <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {atsAnalysis.weaknesses?.length > 0 && (
                        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertCircle size={13} /> Areas to Improve
                          </div>
                          <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                            {atsAnalysis.weaknesses.map((w, i) => (
                              <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Section-wise Feedback ── */}
                  {atsAnalysis.sectionFeedback && Object.keys(atsAnalysis.sectionFeedback).length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <BarChart3 size={13} /> Section-wise Analysis
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Object.entries(atsAnalysis.sectionFeedback).map(([section, info]) => (
                          <div key={section} style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'capitalize' }}>{section.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {info.status && (
                                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: info.score >= 80 ? 'rgba(16,185,129,0.15)' : info.score >= 60 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)', color: info.score >= 80 ? 'var(--success)' : info.score >= 60 ? 'var(--primary)' : 'var(--danger)', fontWeight: 600 }}>{info.status}</span>
                                )}
                                {info.score !== undefined && (
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: info.score >= 80 ? 'var(--success)' : info.score >= 60 ? 'var(--primary)' : 'var(--danger)' }}>{info.score}%</span>
                                )}
                              </div>
                            </div>
                            {info.score !== undefined && (
                              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '0.35rem' }}>
                                <div style={{ height: '4px', borderRadius: '2px', width: `${info.score}%`, background: info.score >= 80 ? 'var(--success)' : info.score >= 60 ? 'var(--primary)' : 'var(--danger)', transition: 'width 0.6s ease' }} />
                              </div>
                            )}
                            {info.feedback && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{info.feedback}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Matched / Missing Keywords ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} /> Matched ({atsAnalysis.matched.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {atsAnalysis.matched.slice(0, 18).map((k) => (<span key={k} className="badge badge-success" style={{ fontSize: '0.7rem' }}>{k}</span>))}
                        {atsAnalysis.matched.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None detected</span>}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertCircle size={13} /> Missing ({atsAnalysis.missing.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {atsAnalysis.missing.slice(0, 15).map((k) => (<span key={k} className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{k}</span>))}
                        {atsAnalysis.missing.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>All key terms present</span>}
                      </div>
                    </div>
                  </div>

                  {/* ── JD Match Score ── */}
                  {atsAnalysis.jobDescriptionComparison?.hasJd && (
                    <div style={{ padding: '1rem 1.25rem', background: 'rgba(139,92,246,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Target size={13} /> Job Description Match: {atsAnalysis.jobDescriptionComparison.matchScore}%
                      </div>
                      {atsAnalysis.jobDescriptionComparison.alignmentSummary && (
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>{atsAnalysis.jobDescriptionComparison.alignmentSummary}</p>
                      )}
                      {atsAnalysis.jobDescriptionComparison.missingRequirements?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Add to resume:</span>
                          {atsAnalysis.jobDescriptionComparison.missingRequirements.slice(0, 10).map((r, i) => (
                            <span key={i} className="badge" style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Improvement Suggestions ── */}
                  {atsAnalysis.feedback?.length > 0 && (
                    <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Zap size={13} color="var(--primary)" /> Improvement Suggestions
                      </div>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                        {atsAnalysis.feedback.map((f, i) => (
                          <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.55 }}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ── Career Recommendations ── */}
                  {atsAnalysis.careerRecommendations && (
                    <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <GraduationCap size={13} /> AI Career Recommendations
                      </div>
                      {atsAnalysis.careerRecommendations.recommendedRoles?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Recommended Roles</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {atsAnalysis.careerRecommendations.recommendedRoles.map((r, i) => (
                              <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {atsAnalysis.careerRecommendations.recommendedCertifications?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Certifications to Pursue</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {atsAnalysis.careerRecommendations.recommendedCertifications.map((c, i) => (
                              <span key={i} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {atsAnalysis.careerRecommendations.actionPlan?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Action Plan</div>
                          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                            {atsAnalysis.careerRecommendations.actionPlan.map((step, i) => (
                              <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ATS Smart Flashcards Generator ── */}
                  <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 88, 12, 0.08) 100%)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={16} /> Convert Resume Weaknesses &amp; Missing Keywords into Flashcards
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Practice ATS optimization, keyword retention, and skill-gap formulas through interactive 3D flashcards.
                      </div>
                    </div>
                    <button
                      onClick={generateResumeFlashcards}
                      disabled={isGeneratingFlashcards}
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: '0.65rem 1.25rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      {isGeneratingFlashcards ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {isGeneratingFlashcards ? 'Generating...' : '🎴 Launch ATS Flashcards'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — Career Counselor Roadmap
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={counselorModalOpen}>
        <div style={overlayStyle} onClick={() => setCounselorModalOpen(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={18} color="var(--accent-purple)" /> Your Career Roadmap
              </h3>
              <button className="icon-btn" onClick={() => setCounselorModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              {counselorData && (
                <>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{counselorData.title}</h2>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <StatCard icon={DollarSign} label="Starting Salary" value={counselorData.expectedStartingSalary?.split('/')[0]?.trim() || '₹18+ LPA'} color="var(--success)" />
                    <StatCard icon={TrendingUp} label="Growth Outlook" value={counselorData.growthOutlook?.split('(')[0]?.trim() || '+30%'} color="var(--primary)" />
                  </div>

                  {/* Key Competencies */}
                  {counselorData.keyCompetencies && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Target size={14} color="var(--primary)" /> Core Competencies
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {counselorData.keyCompetencies.map((c) => (
                          <span key={c} className="badge badge-primary" style={{ fontSize: '0.78rem' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {counselorData.certificationsRecommended && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={14} color="var(--accent-purple)" /> Recommended Certifications
                      </h4>
                      {counselorData.certificationsRecommended.map((cert, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0', borderBottom: i < counselorData.certificationsRecommended.length - 1 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.88rem' }}>
                          <GraduationCap size={14} color="var(--text-muted)" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Electives */}
                  {counselorData.nextElectives && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={14} color="var(--success)" /> Recommended Electives
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {counselorData.nextElectives.map((e) => (
                          <span key={e} className="badge badge-success" style={{ fontSize: '0.78rem' }}>{e}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestone Roadmap */}
                  {counselorData.milestones && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} color="var(--primary)" /> Semester Milestone Roadmap
                      </h4>
                      {counselorData.milestones.map((step, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem 1.25rem', marginBottom: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: idx === 0 ? 'rgba(59,130,246,0.08)' : 'var(--bg-input)',
                            border: idx === 0 ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: idx === 0 ? 'var(--primary)' : '#334155',
                            color: '#ffffff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{step.phase}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{step.goal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Career Guidance Flashcard Deck Trigger ── */}
                  <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={16} /> Roadmap, Certifications &amp; Placement Flashcards
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Convert required tech stack competencies, certifications, and placement targets into an interactive revision deck.
                      </div>
                    </div>
                    <button
                      onClick={generateCareerGuidanceFlashcards}
                      disabled={isGeneratingFlashcards}
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: '0.65rem 1.25rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      {isGeneratingFlashcards ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {isGeneratingFlashcards ? 'Generating...' : '🎴 Launch Roadmap Flashcards'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — AI Interview Evaluation Result (Dynamic Azure AI)
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={interviewModalOpen}>
        <div style={overlayStyle} onClick={() => setInterviewModalOpen(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>AI Feedback & Analysis</h3>
                {interviewResult?.grade && (
                  <span style={{
                    fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700,
                    background: interviewResult.score >= 80 ? 'rgba(16,185,129,0.15)' : interviewResult.score >= 60 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                    color: interviewResult.score >= 80 ? 'var(--success)' : interviewResult.score >= 60 ? 'var(--primary)' : 'var(--danger, #ef4444)'
                  }}>
                    {interviewResult.grade}
                  </span>
                )}
              </div>
              <button className="icon-btn" onClick={() => setInterviewModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              {interviewResult && (
                <>
                  {/* Score & Confidence Display */}
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Performance Score</div>
                        <div style={{
                          fontSize: '4rem', fontWeight: 800, lineHeight: 1,
                          background: interviewResult.score >= 80 ? 'linear-gradient(135deg, #10b981, #34d399)' : interviewResult.score >= 60 ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                          {interviewResult.score}
                        </div>
                      </div>
                      <div style={{ height: '50px', width: '1px', background: 'var(--border-subtle)' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Confidence Level</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: interviewResult.score >= 80 ? 'var(--success)' : interviewResult.score >= 60 ? 'var(--primary)' : 'var(--danger)' }} />
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {interviewResult.score >= 85 ? 'High' : interviewResult.score >= 65 ? 'Moderate' : 'Low'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Based on depth and clarity
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Context */}
                  {currentQuestion && (
                    <div style={{ padding: '1rem', background: 'rgba(139,92,246,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.15)', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Question Analysed</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>"{currentQuestion.question}"</div>
                    </div>
                  )}

                  {/* Assessment Notes */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={16} color="var(--primary)" /> Recruiter Notes
                    </h4>
                    <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{interviewResult.notes}</p>
                    </div>
                  </div>

                  {/* Strengths & Improvements side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {interviewResult.strengths && interviewResult.strengths.length > 0 && (
                      <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={16} /> Key Strengths
                        </h4>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                          {interviewResult.strengths.map((s, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.5 }}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {interviewResult.improvements && interviewResult.improvements.length > 0 && (
                      <div style={{ padding: '1.25rem', background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={16} /> Areas to Improve
                        </h4>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                          {interviewResult.improvements.map((im, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.5 }}>{im}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Improvement Tip */}
                  {interviewResult.improvement && (
                    <div style={{ padding: '1.25rem', background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={16} /> Tips for a Better Answer
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{interviewResult.improvement}</p>
                    </div>
                  )}

                  {/* Ideal Answer Outline */}
                  {interviewResult.idealAnswerOutline && interviewResult.idealAnswerOutline.length > 0 && (
                    <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '2rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Target size={16} /> Recommended Answer Structure
                      </div>
                      <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                        {interviewResult.idealAnswerOutline.map((step, i) => (
                          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.55 }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                    {/* Actions */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {!sessionCompleted && (
                      <>
                        <button onClick={() => handleNextQuestion(false)} className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '0.95rem' }}>
                          <ChevronRight size={18} /> New Question
                        </button>
                        <button onClick={() => handleNextQuestion(true)} className="btn" style={{ flex: 1, background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.3)', padding: '1rem', fontSize: '0.95rem' }}>
                          <MessageSquare size={18} /> Generate Follow-Up
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (!currentQuestion || !interviewResult) return;
                        const singleCard = [{
                          cardId: 'q-' + Date.now(),
                          front: `[${interviewCategory} - ${interviewRole}]\n${currentQuestion.question}`,
                          back: `Ideal Answer Outline:\n${interviewResult.idealAnswerOutline?.join('\n') || interviewResult.notes}\n\nKey Improvement Tip:\n${interviewResult.improvement || 'Ensure structured STAR delivery with measurable metrics.'}`,
                          category: interviewCategory || 'Interview',
                          difficulty: interviewDifficulty || 'Medium',
                          tags: [interviewRole, interviewCategory, 'Mock Interview']
                        }];
                        setHubFlashcards(singleCard);
                        setHubFlashcardTitle(`Revision: ${currentQuestion.question.slice(0, 40)}...`);
                        setHubFlashcardModule('mock_interview');
                        setHubFlashcardCategory(interviewCategory);
                        setHubFlashcardModalOpen(true);
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    >
                      <Sparkles size={16} /> Save to Revision Flashcard
                    </button>
                    {sessionCompleted && (
                       <button onClick={() => setInterviewModalOpen(false)} className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '0.95rem' }}>
                         <Award size={18} /> View Performance Summary
                       </button>
                    )}
                    <button onClick={() => setInterviewModalOpen(false)} className="btn" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '1rem', fontSize: '0.95rem' }}>
                      Close & Review
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ── TAB 5 — AI Job Portal ────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <AIJobPortal onMockInterview={(role) => {
          setInterviewRole(role);
          setActiveTab('interview');
        }} />
      )}

      {/* Smart Hub Flashcard Modal */}
      <FlashcardModal
        isOpen={hubFlashcardModalOpen}
        onClose={() => setHubFlashcardModalOpen(false)}
        title={hubFlashcardTitle}
        initialCards={hubFlashcards}
        sourceModule={hubFlashcardModule}
        category={hubFlashcardCategory}
      />

    </div>
  );
};

export default CareerHubPage;

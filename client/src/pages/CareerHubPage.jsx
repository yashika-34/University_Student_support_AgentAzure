import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Briefcase,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  Award,
  Upload,
  AlertCircle
} from 'lucide-react';

const CareerHubPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('placement');

  // Placement Checker State
  const [studentCgpa, setStudentCgpa] = useState(() => user?.profile?.cgpa || 3.82);
  const [studentBacklogs, setStudentBacklogs] = useState(0);
  const [placements, setPlacements] = useState([]);
  const [placementsLoading, setPlacementsLoading] = useState(false);

  // Load placement eligibility from API on mount
  useEffect(() => {
    const fetchPlacements = async () => {
      setPlacementsLoading(true);
      try {
        const res = await api.post('/career/check-placement', {
          cgpa: studentCgpa,
          backlogs: studentBacklogs,
          department: user?.profile?.department || 'Computer Science'
        });
        if (res.data?.data?.companies) {
          setPlacements(res.data.data.companies);
        }
      } catch (err) {
        console.error('Failed to fetch placements:', err);
      } finally {
        setPlacementsLoading(false);
      }
    };
    fetchPlacements();
  }, [studentCgpa, studentBacklogs]);

  // Resume Analyzer State
  const [resumeText, setResumeText] = useState(
    'Alex Mercer - Fullstack Software Engineer with experience in React, Node.js, Express, MongoDB, and Azure Cloud. Implemented RESTful APIs and containerized microservices using Docker. Completed university capstone project with distributed database caching.'
  );
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzingResume(true);
    try {
      const res = await api.post('/career/analyze-resume', {
        resumeText,
        targetRole: 'Fullstack Cloud Engineer'
      });
      if (res.data?.data) {
        setAtsAnalysis({
          score: res.data.data.atsScore,
          matched: res.data.data.matchedKeywords || [],
          missing: res.data.data.missingKeywords || [],
          feedback: res.data.data.feedback || []
        });
      }
    } catch (err) {
      console.error('Failed to analyze resume:', err);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // Mock Interview State
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewResult, setInterviewResult] = useState(null);
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState(false);

  const handleEvaluateInterview = async () => {
    if (!interviewAnswer.trim()) return;
    setIsEvaluatingInterview(true);
    try {
      const res = await api.post('/career/simulate-interview', {
        role: 'Fullstack Engineer',
        questionId: 1,
        answerText: interviewAnswer
      });
      if (res.data?.data) {
        setInterviewResult(res.data.data);
      }
    } catch (err) {
      console.error('Failed to evaluate interview:', err);
    } finally {
      setIsEvaluatingInterview(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Title */}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {[
          { id: 'placement', label: 'Placement Eligibility Checker', icon: Briefcase },
          { id: 'resume', label: 'ATS Resume Analyzer', icon: Upload },
          { id: 'counselor', label: 'AI Career Counselor', icon: Compass },
          { id: 'interview', label: 'AI Mock Interview Simulator', icon: Sparkles }
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

      {/* Tab 1: Placement Eligibility */}
      {activeTab === 'placement' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>On-Campus Recruitment Drives</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Screening based on verified academic credentials, CGPA cutoffs, and active backlog allowances.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem' }}>
                CGPA: <strong style={{ color: 'var(--primary)' }}>{studentCgpa}</strong>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Backlogs: <strong style={{ color: studentBacklogs === 0 ? 'var(--success)' : 'var(--danger)' }}>{studentBacklogs}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {placementsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading placement drives...</div>
            ) : placements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No placement drives found.</div>
            ) : placements.map((drive) => {
              const isEligible = drive.isEligible !== undefined ? drive.isEligible : (studentCgpa >= (drive.minCgpa || 0) && studentBacklogs <= (drive.maxBacklogs ?? 99));
              const packageDisplay = drive.packageLPA ? `${drive.packageLPA} LPA` : drive.package || 'Competitive';
              return (
                <div
                  key={drive.id}
                  style={{
                    padding: '1.5rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isEligible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span className="badge badge-primary">{drive.tier}</span>
                      <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`}>
                        {isEligible ? 'Eligible to Apply' : 'Cutoff Unmet'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>{drive.name}</h3>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                      {drive.role} &bull; <span style={{ color: 'var(--success)' }}>Package: {packageDisplay}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Min CGPA: {drive.minCgpa || drive.eligibilityCgpa} | Max Backlogs: {drive.maxBacklogs ?? 'N/A'} | Deadline: {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>

                  <div>
                    {isEligible ? (
                      <button className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
                        <CheckCircle2 size={16} /> Register for Drive
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                        <XCircle size={16} /> Ineligible based on criteria
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Resume ATS Analyzer */}
      {activeTab === 'resume' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="var(--primary)" /> Intelligent Resume ATS Parser &amp; Scoring
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Paste or review your resume text to evaluate keyword match index, industry phrasing, and ATS rejection risks.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Resume Content / Experience Summary</label>
                <textarea
                  rows={8}
                  className="form-textarea"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ fontSize: '0.88rem', lineHeight: 1.6 }}
                />
              </div>
              <button onClick={handleAnalyzeResume} className="btn btn-primary" disabled={isAnalyzingResume} style={{ width: '100%' }}>
                {isAnalyzingResume ? 'Parsing Technical Keywords...' : 'Run ATS Match Analysis'}
              </button>
            </div>

            {atsAnalysis && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '1.75rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ATS Compatibility Match Score</div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: atsAnalysis.score >= 70 ? 'var(--success)' : 'var(--warning)', lineHeight: 1.1 }}>
                    {atsAnalysis.score}%
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {atsAnalysis.score >= 80 ? 'Optimal Candidate Match' : 'Competitive Candidate Match'}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', marginBottom: '0.4rem' }}>
                    Matched Keywords ({atsAnalysis.matched.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {atsAnalysis.matched.map((k) => (
                      <span key={k} className="badge badge-success" style={{ fontSize: '0.72rem' }}>{k}</span>
                    ))}
                  </div>
                </div>

                {atsAnalysis.missing.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.4rem' }}>
                      Recommended Keywords to Add ({atsAnalysis.missing.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {atsAnalysis.missing.map((k) => (
                        <span key={k} className="badge badge-danger" style={{ fontSize: '0.72rem' }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Key Recommendations:</strong>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
                    {atsAnalysis.feedback.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: AI Career Counselor */}
      {activeTab === 'counselor' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={20} color="var(--accent-purple)" /> Guided Career Counselor &amp; Roadmap
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            AI-modeled competency path for <strong>Cloud &amp; AI Solutions Architecture</strong> tailored to your Computer Science program.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Role Compensation</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.2rem' }}>$115,000 / ₹22 LPA</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Median top-tier entry compensation</div>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Industry Growth Factor</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>+34% (High Demand)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Azure &amp; AI engineering vacancies</div>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Core Industry Competency</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.2rem' }}>Kubernetes &amp; RAG</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Cloud-native AI app architecture</div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Semester Milestone Roadmap</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { phase: 'Semester 5 (Current)', goal: 'Master container orchestration & build production RAG chatbot', done: true },
              { phase: 'Semester 6', goal: 'Obtain Azure Solutions Architect certification & complete summer corporate internship', done: false },
              { phase: 'Semester 7-8', goal: 'Deploy enterprise capstone project & target Tier-1 Super Dream on-campus drives', done: false }
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: step.done ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-input)',
                  border: step.done ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: step.done ? 'var(--primary)' : '#334155',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{step.phase}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{step.goal}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AI Mock Interview */}
      {activeTab === 'interview' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> Interactive AI Mock Interview Studio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Answer realistic technical and architectural questions. Receive real-time assessment, strengths, and rubrics.
          </p>

          <div style={{ padding: '1.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Technical Question (Fullstack Cloud)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.5 }}>
              "Explain how the React Virtual DOM diffing algorithm minimizes layout reflows and optimizes real-time state updates in enterprise single-page applications."
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Response</label>
            <textarea
              rows={5}
              className="form-textarea"
              placeholder="State your conceptual answer, architectural heuristics, and practical trade-offs..."
              value={interviewAnswer}
              onChange={(e) => setInterviewAnswer(e.target.value)}
            />
          </div>

          <button onClick={handleEvaluateInterview} className="btn btn-primary" disabled={isEvaluatingInterview}>
            <Send size={16} /> {isEvaluatingInterview ? 'Evaluating Answer...' : 'Submit Response for AI Critique'}
          </button>

          {interviewResult && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>AI Interview Assessment</span>
                <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>Score: {interviewResult.score} / 100</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {interviewResult.notes}
              </p>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong>Improvement Tip:</strong> {interviewResult.improvement}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CareerHubPage;

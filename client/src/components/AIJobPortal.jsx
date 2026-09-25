import React, { useState } from 'react';
import { Search, MapPin, Briefcase, ChevronRight, FileText, Target, Crosshair, Sparkles, Loader2, BookOpen, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api, { flashcardAPI } from '../services/api.js';
import FlashcardModal from './flashcards/FlashcardModal.jsx';

export default function AIJobPortal({ onMockInterview }) {
  const [skills, setSkills] = useState('React, Node.js, Python, AWS, SQL');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [gapRoadmap, setGapRoadmap] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Flashcards State
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [jobFlashcards, setJobFlashcards] = useState([]);
  const [flashcardDeckTitle, setFlashcardDeckTitle] = useState('');

  const findMatches = async () => {
    if (!skills.trim()) return;
    setLoading(true);
    setJobs([]);
    setSelectedJob(null);
    try {
      const { data } = await api.post('/career/ai-jobs/matches', { skills });
      if (data.success) {
        setJobs(data.data);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const generateGap = async (job) => {
    setActionLoading('gap');
    try {
      const { data } = await api.post('/career/ai-jobs/skill-gap', { jobTitle: job.title, userSkills: skills });
      setGapRoadmap(data.data);
    } catch(e) {
      alert('Failed to generate roadmap');
    } finally {
      setActionLoading(null);
    }
  };

  const generateCover = async (job) => {
    setActionLoading('cover');
    try {
      const { data } = await api.post('/career/ai-jobs/cover-letter', { jobTitle: job.title, company: job.company, userSkills: skills });
      setCoverLetter(data.data);
    } catch(e) {
      alert('Failed to generate cover letter');
    } finally {
      setActionLoading(null);
    }
  };

  const generateJobFlashcards = async (job, type = 'role_interview') => {
    setActionLoading('flashcards');
    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'job_matcher',
        type,
        title: `${job.title} at ${job.company} — Smart Preparation Deck`,
        context: {
          role: job.title,
          company: job.company,
          requiredSkills: job.requiredSkills || [],
          jobDescription: job.description || '',
          candidateSkills: skills,
          modulesRequired: [
            'Role-specific technical & behavioral interview questions',
            'Important skills required for the selected job role',
            'Company culture, domain & technical preparation',
            'ATS resume improvement recommendations',
            'Cover letter writing tips',
            'Resume bullet point improvement suggestions'
          ]
        },
        count: 10,
        save: true
      });
      if (res.data?.data?.cards) {
        setJobFlashcards(res.data.data.cards);
        setFlashcardDeckTitle(`${job.title} — Comprehensive Prep Deck`);
        setFlashcardModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to generate flashcards:', e);
      alert('Failed to generate job flashcards. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem', color: 'var(--text)', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.5rem 1.2rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '20px', color: '#8b5cf6', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
          <Sparkles size={16} /> Beta AI Feature
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.8rem 0', background: 'linear-gradient(to right, #6366f1, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Job Matchmaker & Career Path
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Enter your core skills and let Azure AI find your perfect job matches, analyze skill gaps, and auto-write cover letters!
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
        <Search size={22} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
        <input 
          value={skills} onChange={e => setSkills(e.target.value)}
          placeholder="e.g. React, Docker, Python, Machine Learning..."
          style={{ flex: 1, padding: '0.8rem 0.5rem', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.05rem', outline: 'none' }}
        />
        <button className="btn-ai-search" onClick={findMatches} disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}>
          {loading ? <Loader2 className="spinner" size={18} /> : <Sparkles size={18} />} {loading ? 'Analyzing...' : 'Find Matches'}
        </button>
      </div>

      {jobs.length > 0 && !selectedJob && (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {jobs.map((j, i) => (
            <div key={i} className="job-card" onClick={() => { setSelectedJob(j); setGapRoadmap(null); setCoverLetter(null); }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.8rem', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderBottomLeftRadius: '16px', boxShadow: '-2px 2px 10px rgba(16, 185, 129, 0.2)' }}>
                {j.matchScore}% Match
              </div>
              <h3 style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}><Briefcase size={20} color="#8b5cf6" /></div>
                {j.title}
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {j.location || 'Remote'}</span>
                <strong style={{color:'var(--text)', background: 'var(--bg-body)', padding: '0.2rem 0.6rem', borderRadius: '4px'}}>{j.company}</strong>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                {j.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {j.requiredSkills?.slice(0,4).map((s, idx) => (
                  <span key={idx} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>
                ))}
                {j.requiredSkills?.length > 4 && <span style={{ background: 'var(--bg-body)', color: 'var(--text-muted)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>+{j.requiredSkills.length - 4}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <div className="fade-in">
          <button onClick={() => setSelectedJob(null)} className="btn-back" style={{ background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', transition: 'background 0.2s' }}>
            <ChevronRight style={{transform: 'rotate(180deg)'}} size={18}/> Back to Matches
          </button>
          
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Briefcase size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.3rem 0', color: 'var(--text-primary)' }}>{selectedJob.title}</h2>
                <div style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>at <strong>{selectedJob.company}</strong></div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <button className="action-card" onClick={() => generateGap(selectedJob)} disabled={actionLoading} style={{ padding: '1.5rem 1rem', background: actionLoading === 'gap' ? '#3b82f611' : 'var(--bg-body)', border: '1px solid #3b82f644', color: '#3b82f6', borderRadius: '12px', cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.8rem', transition: 'all 0.3s' }}>
                {actionLoading === 'gap' ? <Loader2 className="spinner" size={28}/> : <BookOpen size={28} />} 
                <span style={{ fontWeight: 600 }}>Skill Gap Roadmap</span>
              </button>
              
              <button className="action-card" onClick={() => generateCover(selectedJob)} disabled={actionLoading} style={{ padding: '1.5rem 1rem', background: actionLoading === 'cover' ? '#10b98111' : 'var(--bg-body)', border: '1px solid #10b98144', color: '#10b981', borderRadius: '12px', cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.8rem', transition: 'all 0.3s' }}>
                {actionLoading === 'cover' ? <Loader2 className="spinner" size={28}/> : <FileText size={28} />} 
                <span style={{ fontWeight: 600 }}>Auto Cover Letter</span>
              </button>

              <button className="action-card" onClick={() => generateJobFlashcards(selectedJob)} disabled={actionLoading} style={{ padding: '1.5rem 1rem', background: actionLoading === 'flashcards' ? '#f59e0b11' : 'var(--bg-body)', border: '1px solid #f59e0b55', color: '#f59e0b', borderRadius: '12px', cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.8rem', transition: 'all 0.3s' }}>
                {actionLoading === 'flashcards' ? <Loader2 className="spinner" size={28}/> : <Sparkles size={28} />} 
                <span style={{ fontWeight: 600 }}>Smart AI Flashcards</span>
              </button>
              
              <button className="action-card" onClick={() => onMockInterview(selectedJob.title)} disabled={actionLoading} style={{ padding: '1.5rem 1rem', background: 'var(--bg-body)', border: '1px solid #8b5cf644', color: '#8b5cf6', borderRadius: '12px', cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.8rem', transition: 'all 0.3s' }}>
                <Target size={28} /> 
                <span style={{ fontWeight: 600 }}>Mock Interview</span>
              </button>
            </div>

            {gapRoadmap && (
              <div className="fade-in" style={{ background: '#3b82f60a', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={20}/> AI Upskill Roadmap</h3>
                <div className="markdown-body" style={{fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)'}}><ReactMarkdown>{gapRoadmap}</ReactMarkdown></div>
              </div>
            )}

            {coverLetter && (
              <div className="fade-in" style={{ background: '#10b9810a', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #10b981', marginTop: '1.5rem' }}>
                <h3 style={{ marginTop: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20}/> Personalized Cover Letter</h3>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{coverLetter}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Flashcard Deck Modal */}
      <FlashcardModal
        isOpen={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        title={flashcardDeckTitle}
        initialCards={jobFlashcards}
        sourceModule="job_matcher"
        category="Interview & Skills"
      />
      
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .job-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px -10px rgba(0,0,0,0.3); border-color: #8b5cf666 !important; }
        .btn-ai-search:hover { filter: brightness(1.1); transform: scale(1.02); }
        .btn-back:hover { background: rgba(139, 92, 246, 0.1) !important; }
        .action-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}

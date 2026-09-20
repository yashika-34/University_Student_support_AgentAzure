import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen
} from 'lucide-react';

const Home = () => {
  const [sampleQuery, setSampleQuery] = useState('');
  const navigate = useNavigate();

  const handleAsk = (e) => {
    e.preventDefault();
    if (sampleQuery.trim()) {
      navigate('/chat', { state: { initialPrompt: sampleQuery } });
    } else {
      navigate('/chat');
    }
  };

  const quickPrompts = [
    'What is my CS-301 attendance?',
    'When is the last date to pay tuition fees?',
    'Show upcoming assignment deadlines',
    'Where is the student health center?'
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 1rem 3rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: 'var(--primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={16} />
          <span>Powered by MERN Stack & Azure AI Foundry</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.3rem, 5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Empowering Academic Excellence with <span style={{
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>24/7 Intelligent Support</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          UniAssist AI centralizes student inquiries, tracks real-time attendance thresholds, manages assignment deadlines, and delivers zero-hallucination answers grounded in verified university regulations.
        </p>

        {/* Quick Query Bar */}
        <form onSubmit={handleAsk} style={{
          maxWidth: '640px',
          margin: '0 auto 1.5rem',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask anything: attendance, exam dates, fee deadlines, syllabus..."
            value={sampleQuery}
            onChange={(e) => setSampleQuery(e.target.value)}
            style={{
              padding: '1rem 8.5rem 1rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '1rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              position: 'absolute',
              right: '6px',
              borderRadius: 'var(--radius-full)',
              padding: '0.65rem 1.2rem',
              fontSize: '0.9rem'
            }}
          >
            Ask AI <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Prompt Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => navigate('/chat', { state: { initialPrompt: prompt } })}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.85rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </section>

      {/* Live Impact Stats */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 4rem', padding: '0 1rem' }}>
        <div className="glass-panel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          padding: '2rem',
          textAlign: 'center',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>&lt; 3.0s</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Streaming Response Latency</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>65%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Routine Ticket Deflection</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-purple)' }}>100%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>FERPA & Policy Grounded</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>24/7/365</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Uninterrupted Campus Support</div>
          </div>
        </div>
      </section>

      {/* Core Capability Pillars */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Comprehensive Academic & Campus Services
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            One unified portal for Students, Faculty, and University Administration.
          </p>
        </div>

        <div className="grid-cards">
          {/* Card 1 */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--primary)' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              Azure AI Foundry Chatbot
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Conversational agent using Hybrid Semantic RAG and real-time MongoDB tool calls to answer student queries without hallucinations.
            </p>
            <Link to="/chat" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Launch Chat Assistant <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--success)' }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              Attendance & Exam Tracker
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Automatic 75% threshold alerts, interactive bunk calculator simulator, and personalized digital hall ticket generation with calendar sync.
            </p>
            <Link to="/attendance" style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Attendance Gauge <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--accent-purple)' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              Course & Assignment Hub
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Unified view of deliverables across all enrolled subjects, syllabus learning outcomes, office hours, and direct solution upload.
            </p>
            <Link to="/assignments" style={{ color: 'var(--accent-purple)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Check Deadlines <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to action card */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' }}>
        <div className="glass-panel" style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Ready to Experience Instant Academic Support?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto 2rem' }}>
            Access student schedules, attendance simulations, verified university FAQs, or ask the AI agent for tailored advice.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/student/dashboard" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem' }}>
              Access Student Portal
            </Link>
            <Link to="/chat" className="btn btn-secondary" style={{ padding: '0.8rem 1.75rem' }}>
              Open Chat Assistant
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Globe, Moon, Sun } from 'lucide-react';

const WelcomeBanner = ({ studentName, rollNo, degree, semester, language, setLanguage, theme, toggleTheme }) => {
  return (
    <div
      className="glass-panel animate-gradient"
      style={{
        padding: '2.25rem 2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(139, 92, 246, 0.18) 50%, rgba(16, 185, 129, 0.12) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Decorative background orbs */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: '30%', width: 120, height: 120, background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
          <span className="animate-badge-blink" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <Sparkles size={15} /> Student Academic Portal • AI Agent Live
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
          Welcome back, <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{studentName}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Roll No: <strong style={{ color: 'var(--text-primary)' }}>{rollNo}</strong> | {degree} (Semester {semester})
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="var(--primary)" />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'EN' ? 'ES' : 'EN')}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-full)' }}
          title="Translate to native language (preserves technical terms)"
          id="language-toggle-btn"
        >
          <Globe size={16} color="var(--primary)" />
          {language === 'EN' ? 'English' : 'Español'}
        </button>

        <Link to="/chat" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem', borderRadius: 'var(--radius-full)', boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} /> Ask AI Assistant
        </Link>
      </div>
    </div>
  );
};

export default WelcomeBanner;

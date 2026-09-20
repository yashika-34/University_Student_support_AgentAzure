import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockData } from '../services/api.js';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

const FaqPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState('faq-1');
  const [votedMap, setVotedMap] = useState({});

  const categories = ['All', 'Academics', 'Fees & Financial Aid', 'Examinations', 'Campus Facilities'];

  const filteredFaqs = mockData.faqs.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleVote = (id) => {
    setVotedMap({ ...votedMap, [id]: true });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Find official answers to university regulations, attendance policies, financial schedules, and campus amenities.
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '1.75rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search FAQs by keywords (e.g. attendance, tuition, clinic, exams)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.9rem 1rem 0.9rem 2.8rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.95rem'
            }}
          />
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
              background: selectedCategory === cat ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
              color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const hasVoted = votedMap[faq.id];

            return (
              <div
                key={faq.id}
                className="glass-panel"
                style={{
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-subtle)'
                }}
              >
                {/* Question Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    fontWeight: 600
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{faq.category}</span>
                    {faq.question}
                  </span>
                  {isExpanded ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </button>

                {/* Answer Content */}
                {isExpanded && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '1rem'
                  }}>
                    <p style={{ marginBottom: '1rem' }}>{faq.answer}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Verified University Policy</span>
                      <button
                        onClick={() => handleVote(faq.id)}
                        disabled={hasVoted}
                        style={{
                          background: hasVoted ? 'var(--success-bg)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.75rem',
                          color: hasVoted ? 'var(--success)' : 'var(--text-secondary)',
                          cursor: hasVoted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        {hasVoted ? <Check size={13} /> : <ThumbsUp size={13} />}
                        {hasVoted ? 'Marked as Helpful' : `Helpful (${faq.helpfulCount})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              No FAQs matched your search: "{searchQuery}"
            </p>
            <Link to="/chat" state={{ initialPrompt: searchQuery }} className="btn btn-primary">
              <Sparkles size={16} /> Ask AI Assistant Instead
            </Link>
          </div>
        )}
      </div>

      {/* AI Assistant Help Promo */}
      <div className="glass-panel" style={{
        maxWidth: '850px',
        margin: '1rem auto 0',
        padding: '1.75rem 2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Still have an unanswered question?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Our Azure AI-powered assistant can cross-reference complete university documents and student records instantly.
          </p>
        </div>
        <Link to="/chat" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
          Open AI Chat <ArrowRight size={15} />
        </Link>
      </div>

    </div>
  );
};

export default FaqPage;

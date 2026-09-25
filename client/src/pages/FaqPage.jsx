import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { faqAPI } from '../services/api.js';
import FlashcardViewer from '../components/flashcards/FlashcardViewer.jsx';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  Layers,
  List
} from 'lucide-react';

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [votedMap, setVotedMap] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'flashcards'

  const categories = ['All', 'Academics', 'Fees & Financial Aid', 'Examinations', 'Campus Facilities'];

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const res = await faqAPI.getAll();
        const list = res.data?.data || [];
        setFaqs(list);
        if (list.length > 0) {
          setExpandedId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const faqFlashcards = useMemo(() => {
    return filteredFaqs.map((faq) => ({
      cardId: faq._id,
      front: faq.question,
      back: faq.answer,
      category: faq.category || 'General',
      difficulty: 'Medium',
      tags: faq.tags || [faq.category]
    }));
  }, [filteredFaqs]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleVote = async (id) => {
    setVotedMap({ ...votedMap, [id]: true });
    try {
      await faqAPI.voteHelpful(id);
    } catch (err) {
      console.warn('Vote feedback error:', err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Find official answers to university regulations, attendance policies, financial schedules, and campus amenities from MongoDB database.
        </p>

        {/* View Mode Switcher */}
        <div style={{ display: 'inline-flex', padding: '0.35rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', marginTop: '1.25rem', gap: '0.35rem' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: viewMode === 'list' ? 'var(--primary-gradient)' : 'transparent',
              color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <List size={15} /> Accordion List
          </button>
          <button
            onClick={() => setViewMode('flashcards')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: viewMode === 'flashcards' ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'transparent',
              color: viewMode === 'flashcards' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={15} /> 🎴 Flashcard Library ({faqFlashcards.length})
          </button>
        </div>

        {/* Search Bar (shown in list mode) */}
        {viewMode === 'list' && (
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
            <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {/* Category Pills (List Mode) */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          {categories.map((category) => (
            <button
              key={category}
              className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(category)}
              style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Mode 1: Interactive Flashcard Library */}
      {viewMode === 'flashcards' && (
        <div style={{ maxWidth: '850px', width: '100%', margin: '0 auto' }}>
          <FlashcardViewer
            title="University Regulations & Policies FAQ Deck"
            initialCards={faqFlashcards}
            sourceModule="faq"
            category={selectedCategory !== 'All' ? selectedCategory : 'General'}
          />
        </div>
      )}

      {/* Mode 2: FAQ Accordion List */}
      {viewMode === 'list' && (
      <div style={{ maxWidth: '850px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
            Loading FAQs from database...
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No official FAQs found matching "{searchQuery}".
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq._id;
            const hasVoted = votedMap[faq._id];

            return (
              <div
                key={faq._id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: isExpanded ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border)',
                  overflow: 'hidden',
                  transition: 'var(--transition)'
                }}
              >
                <div
                  onClick={() => toggleExpand(faq._id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span className="badge badge-primary">{faq.category}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{faq.question}</h3>
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                      {faq.answer}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Was this helpful?</span>
                      <button
                        onClick={() => handleVote(faq._id)}
                        disabled={hasVoted}
                        className={`btn ${hasVoted ? 'btn-success' : 'btn-secondary'}`}
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {hasVoted ? <Check size={13} /> : <ThumbsUp size={13} />}
                        {hasVoted ? 'Helpful' : `Helpful (${faq.helpfulCount || 0})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* AI Assistant Banner */}
      <div className="glass-panel" style={{
        maxWidth: '850px',
        width: '100%',
        margin: '1.5rem auto 0 auto',
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <Sparkles size={16} /> Have a specific inquiry?
        </div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ask UniAssist AI with RAG Grounding</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '550px', margin: '0 auto 1.25rem auto' }}>
          Our AI student support agent answers specific questions about your attendance status, assignment deadlines, fee balances, and university policies.
        </p>
        <Link to="/chat" className="btn btn-primary" style={{ padding: '0.7rem 1.4rem' }}>
          Start Live Chat Session <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
};

export default FaqPage;

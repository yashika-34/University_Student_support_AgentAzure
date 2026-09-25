import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RefreshCw,
  Bookmark,
  Layers,
  Search,
  Award,
  BookOpen,
  Save,
  Check
} from 'lucide-react';
import { flashcardAPI } from '../../services/api.js';

export default function FlashcardViewer({
  deckId = null,
  title,
  deckTitle,
  initialCards,
  cards: passedCards,
  sourceModule = 'custom',
  category = 'General',
  onSaveDeck = null,
  onClose = null,
  canSave = true
}) {
  const displayTitle = title || deckTitle || 'AI Revision Flashcards';
  const sourceCards = initialCards || passedCards || [];

  const [cards, setCards] = useState(() => {
    return sourceCards.map((c, idx) => ({
      cardId: c.cardId || `card-${idx}-${Date.now()}`,
      front: c.front || '',
      back: c.back || '',
      category: c.category || category || 'General',
      difficulty: c.difficulty || 'Medium',
      tags: c.tags || [],
      isKnown: Boolean(c.isKnown),
      needsRevision: Boolean(c.needsRevision),
      isBookmarked: Boolean(c.isBookmarked),
      reviewCount: c.reviewCount || 0
    }));
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'needs_revision' | 'bookmarked' | 'known'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [streakEarned, setStreakEarned] = useState(null);

  // Sync if sourceCards change
  useEffect(() => {
    if (sourceCards && sourceCards.length > 0) {
      setCards(
        sourceCards.map((c, idx) => ({
          cardId: c.cardId || `card-${idx}-${Date.now()}`,
          front: c.front || '',
          back: c.back || '',
          category: c.category || category || 'General',
          difficulty: c.difficulty || 'Medium',
          tags: c.tags || [],
          isKnown: Boolean(c.isKnown),
          needsRevision: Boolean(c.needsRevision),
          isBookmarked: Boolean(c.isBookmarked),
          reviewCount: c.reviewCount || 0
        }))
      );
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [sourceCards, category]);

  // Distinct categories in the deck
  const categories = useMemo(() => {
    const set = new Set(['All']);
    cards.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [cards]);

  // Filtered cards list
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      // Category filter
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;

      // Status filter
      if (activeFilter === 'needs_revision' && !c.needsRevision) return false;
      if (activeFilter === 'bookmarked' && !c.isBookmarked) return false;
      if (activeFilter === 'known' && !c.isKnown) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFront = c.front.toLowerCase().includes(q);
        const matchBack = c.back.toLowerCase().includes(q);
        const matchCat = (c.category || '').toLowerCase().includes(q);
        if (!matchFront && !matchBack && !matchCat) return false;
      }

      return true;
    });
  }, [cards, selectedCategory, activeFilter, searchQuery]);

  // Keep index in bounds when filter changes
  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
      setIsFlipped(false);
    }
  }, [filteredCards.length, currentIndex]);

  const currentCard = filteredCards[currentIndex] || null;

  // Stats
  const knownCount = cards.filter((c) => c.isKnown).length;
  const needsRevisionCount = cards.filter((c) => c.needsRevision).length;
  const bookmarkedCount = cards.filter((c) => c.isBookmarked).length;
  const totalCount = cards.length;
  const masteryPercentage = totalCount > 0 ? Math.round((knownCount / totalCount) * 100) : 0;

  // Navigation
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, filteredCards.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Update card status in memory and persist via API
  const handleStatusChange = async (cardId, updates) => {
    setCards((prev) =>
      prev.map((c) => (c.cardId === cardId ? { ...c, ...updates, reviewCount: (c.reviewCount || 0) + 1 } : c))
    );

    try {
      const res = await flashcardAPI.updateCardStatus({
        deckId,
        cardId,
        isKnown: updates.isKnown,
        needsRevision: updates.needsRevision,
        isBookmarked: updates.isBookmarked
      });
      if (res.data?.data?.progress?.dailyStreak) {
        setStreakEarned(res.data.data.progress.dailyStreak);
      }
    } catch (e) {
      // Silently keep local state if offline
    }
  };

  const markKnown = () => {
    if (!currentCard) return;
    handleStatusChange(currentCard.cardId, { isKnown: true, needsRevision: false });
    // Auto advance after marking
    setTimeout(() => {
      if (currentIndex < filteredCards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      }
    }, 250);
  };

  const markNeedsRevision = () => {
    if (!currentCard) return;
    handleStatusChange(currentCard.cardId, { isKnown: false, needsRevision: true });
    setTimeout(() => {
      if (currentIndex < filteredCards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      }
    }, 250);
  };

  const toggleBookmark = (e) => {
    if (e) e.stopPropagation();
    if (!currentCard) return;
    handleStatusChange(currentCard.cardId, { isBookmarked: !currentCard.isBookmarked });
  };

  const shuffleCards = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const resetProgress = () => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isKnown: false,
        needsRevision: false
      }))
    );
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        markKnown();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        markNeedsRevision();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, markKnown, markNeedsRevision]);

  // Save deck to library
  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      if (onSaveDeck) {
        await onSaveDeck(cards);
      } else {
        await flashcardAPI.saveDeck({
          title: displayTitle,
          sourceModule,
          category,
          cards
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save deck:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if session is complete
  const isSessionComplete = totalCount > 0 && currentIndex === filteredCards.length - 1 && currentCard?.isKnown;

  return (
    <div className="flashcard-viewer-container" style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {sourceModule.replace('_', ' ')}
            </span>
            {streakEarned && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🔥 {streakEarned} Day Streak!
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {displayTitle}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {canSave && (
            <button
              onClick={handleSaveToLibrary}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {savedSuccess ? <Check size={14} color="var(--success)" /> : <Save size={14} />}
              {savedSuccess ? 'Saved to Library!' : isSaving ? 'Saving...' : 'Save Deck'}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
              Close
            </button>
          )}
        </div>
      </div>

      {/* ── Progress & Mastery Bar ── */}
      <div style={{ background: 'var(--bg-input)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Mastery: {masteryPercentage}%</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {knownCount} Known</span>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⟲ {needsRevisionCount} Needs Review</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            {filteredCards.length > 0 ? `${currentIndex + 1} of ${filteredCards.length} cards` : '0 cards'}
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(knownCount / Math.max(1, totalCount)) * 100}%`, background: 'var(--success)', transition: 'width 0.4s ease' }} />
          <div style={{ width: `${(needsRevisionCount / Math.max(1, totalCount)) * 100}%`, background: 'var(--warning)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* ── Filters & Category Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => { setActiveFilter('all'); setCurrentIndex(0); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeFilter === 'all' ? 'var(--primary)' : 'transparent',
              color: activeFilter === 'all' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => { setActiveFilter('needs_revision'); setCurrentIndex(0); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeFilter === 'needs_revision' ? 'var(--warning)' : 'transparent',
              color: activeFilter === 'needs_revision' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Review ({needsRevisionCount})
          </button>
          <button
            onClick={() => { setActiveFilter('bookmarked'); setCurrentIndex(0); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeFilter === 'bookmarked' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: activeFilter === 'bookmarked' ? '#fbbf24' : 'var(--text-secondary)'
            }}
          >
            ★ Bookmarked ({bookmarkedCount})
          </button>
          <button
            onClick={() => { setActiveFilter('known'); setCurrentIndex(0); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeFilter === 'known' ? 'var(--success)' : 'transparent',
              color: activeFilter === 'known' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Mastered ({knownCount})
          </button>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            title="Shuffle Deck"
            onClick={shuffleCards}
            style={{
              padding: '0.45rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Shuffle size={14} />
          </button>
          <button
            title="Reset All Progress"
            onClick={resetProgress}
            style={{
              padding: '0.45rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Category Pills (if > 1 category) ── */}
      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrentIndex(0); }}
              style={{
                padding: '0.25rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--primary)' : 'var(--border-subtle)',
                background: selectedCategory === cat ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── The 3D Flashcard Container ── */}
      {filteredCards.length === 0 ? (
        <div style={{ padding: '3.5rem 1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.95rem' }}>No flashcards found matching the selected filter.</p>
          <button onClick={() => { setActiveFilter('all'); setSelectedCategory('All'); setSearchQuery(''); }} className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ perspective: '1200px', width: '100%', minHeight: '340px' }}>
          <div
            onClick={handleFlip}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '340px',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
          >
            {/* ── CARD FRONT (Question / Concept) ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                border: currentCard?.isKnown
                  ? '2px solid rgba(16, 185, 129, 0.6)'
                  : currentCard?.needsRevision
                  ? '2px solid rgba(245, 158, 11, 0.6)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: currentCard?.isKnown
                  ? '0 12px 30px rgba(16, 185, 129, 0.15)'
                  : currentCard?.needsRevision
                  ? '0 12px 30px rgba(245, 158, 11, 0.15)'
                  : '0 12px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Card Front Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                    {currentCard?.category || 'Concept'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      background:
                        currentCard?.difficulty === 'Hard'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : currentCard?.difficulty === 'Easy'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                      color:
                        currentCard?.difficulty === 'Hard'
                          ? 'var(--danger)'
                          : currentCard?.difficulty === 'Easy'
                          ? 'var(--success)'
                          : 'var(--primary)'
                    }}
                  >
                    {currentCard?.difficulty || 'Medium'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {currentIndex + 1} / {filteredCards.length}
                  </span>
                  <button
                    onClick={toggleBookmark}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      color: currentCard?.isBookmarked ? '#f59e0b' : 'var(--text-muted)',
                      transition: 'transform 0.15s ease'
                    }}
                    title={currentCard?.isBookmarked ? 'Remove bookmark' : 'Bookmark card'}
                  >
                    <Star size={18} fill={currentCard?.isBookmarked ? '#f59e0b' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Card Front Content */}
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Question / Concept
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {currentCard?.front}
                </h2>
              </div>

              {/* Card Front Footer Prompt */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RotateCw size={13} color="var(--primary)" /> Click card or press Space to reveal answer
                </span>
                {currentCard?.isKnown ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Marked as Known</span>
                ) : currentCard?.needsRevision ? (
                  <span style={{ color: 'var(--warning)', fontWeight: 700 }}>⟲ In Review Queue</span>
                ) : (
                  <span>Unreviewed</span>
                )}
              </div>
            </div>

            {/* ── CARD BACK (Answer / Explanation) ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 12px 32px rgba(139, 92, 246, 0.15)',
                overflowY: 'auto'
              }}
            >
              {/* Card Back Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <CheckCircle2 size={15} /> Verified Answer &amp; Explanation
                </div>
                <button
                  onClick={toggleBookmark}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: currentCard?.isBookmarked ? '#f59e0b' : 'var(--text-muted)'
                  }}
                >
                  <Star size={18} fill={currentCard?.isBookmarked ? '#f59e0b' : 'none'} />
                </button>
              </div>

              {/* Card Back Content */}
              <div style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
                <div
                  style={{
                    fontSize: '0.96rem',
                    lineHeight: 1.65,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {currentCard?.back}
                </div>
              </div>

              {/* Card Back Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RotateCw size={13} color="var(--primary)" /> Click card to flip back to question
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)' }}>
                  {currentCard?.tags?.length ? `#${currentCard.tags.join(' #')}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Controls Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
        {/* Prev Card */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || filteredCards.length === 0}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: currentIndex === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {/* Central Assessment Buttons: Needs Revision / Flip / Known */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={markNeedsRevision}
            disabled={!currentCard}
            style={{
              background: currentCard?.needsRevision ? 'rgba(245, 158, 11, 0.25)' : 'var(--bg-input)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#f59e0b',
              padding: '0.65rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            title="Mark for revision (R key)"
          >
            <AlertCircle size={15} /> Needs Revision <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>(R)</span>
          </button>

          <button
            onClick={handleFlip}
            disabled={!currentCard}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Flip card (Space)"
          >
            <RotateCw size={15} /> Flip <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>(Space)</span>
          </button>

          <button
            onClick={markKnown}
            disabled={!currentCard}
            style={{
              background: currentCard?.isKnown ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-input)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: 'var(--success)',
              padding: '0.65rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            title="Mark as known / mastered (K key)"
          >
            <CheckCircle2 size={15} /> Known <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>(K)</span>
          </button>
        </div>

        {/* Next Card */}
        <button
          onClick={handleNext}
          disabled={currentIndex >= filteredCards.length - 1 || filteredCards.length === 0}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: currentIndex >= filteredCards.length - 1 ? 0.4 : 1 }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Completion Celebration Modal / Banner ── */}
      {isSessionComplete && (
        <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)', textAlign: 'center' }}>
          <Award size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.3rem 0', color: 'var(--success)' }}>
            🎉 Deck Review Complete!
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 1rem 0' }}>
            You've reviewed all {totalCount} flashcards in this deck. Mastery score: <strong>{masteryPercentage}%</strong>.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {needsRevisionCount > 0 && (
              <button
                onClick={() => { setActiveFilter('needs_revision'); setCurrentIndex(0); setIsFlipped(false); }}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                ⟲ Re-test {needsRevisionCount} Weak Cards
              </button>
            )}
            <button
              onClick={resetProgress}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            >
              Restart Deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

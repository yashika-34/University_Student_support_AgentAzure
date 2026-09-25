import React from 'react';
import ModalPortal from '../ModalPortal.jsx';
import FlashcardViewer from './FlashcardViewer.jsx';
import { X, Sparkles } from 'lucide-react';

export default function FlashcardModal({
  isOpen,
  onClose,
  deckId,
  title,
  deckTitle,
  initialCards,
  cards,
  sourceModule,
  category,
  onSaveDeck
}) {
  if (!isOpen) return null;

  const effectiveCards = initialCards || cards || [];
  const effectiveTitle = title || deckTitle || 'Smart AI Flashcards';

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'var(--bg-surface, #0f172a)',
            borderRadius: 'var(--radius-lg, 16px)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card, rgba(15, 23, 42, 0.95))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary, #3b82f6)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)' }}>
                Smart AI Flashcards
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            <FlashcardViewer
              deckId={deckId}
              title={effectiveTitle}
              initialCards={effectiveCards}
              sourceModule={sourceModule}
              category={category}
              onSaveDeck={onSaveDeck}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

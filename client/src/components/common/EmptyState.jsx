import React from 'react';
import { Inbox, Plus } from 'lucide-react';

/**
 * Modern SaaS Empty State Component
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data available for this section.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style = {},
  className = ''
}) => {
  return (
    <div
      className={`glass-panel empty-state-container animate-fade-in ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        gap: '1rem',
        ...style
      }}
    >
      <div
        className="empty-state-icon-wrapper"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
          marginBottom: '0.25rem'
        }}
      >
        <Icon size={30} strokeWidth={1.8} />
      </div>

      <div style={{ maxWidth: '420px' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '0.4rem',
            color: 'var(--text-primary)'
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            lineHeight: 1.55
          }}
        >
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {actionLabel && (
            <button className="btn btn-primary" onClick={onAction}>
              <Plus size={16} />
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && (
            <button className="btn btn-secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

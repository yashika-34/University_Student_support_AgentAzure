import React from 'react';

/**
 * Standard SaaS Page Header with Title, Badge, Description, and Actions
 */
export const PageHeader = ({
  badge,
  badgeType = 'primary',
  title,
  subtitle,
  actions,
  breadcrumbs = []
}) => {
  return (
    <div
      className="page-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}
    >
      {/* Breadcrumbs if provided */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} style={{ color: 'var(--text-secondary)' }}>
                  {crumb.label}
                </a>
              ) : (
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                lineHeight: 1.2
              }}
            >
              {title}
            </h1>
            {badge && <span className={`badge badge-${badgeType}`}>{badge}</span>}
          </div>
          {subtitle && (
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                marginTop: '0.35rem',
                maxWidth: '650px',
                lineHeight: 1.5
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

import React from 'react';

/**
 * Primitive Skeleton Box with Shimmer Animation
 */
export const Skeleton = ({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-sm)',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton Metric / Stat Card
 */
export const SkeletonStatCard = () => {
  return (
    <div className="glass-panel stat-card" style={{ gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width="45%" height="0.85rem" />
        <Skeleton width="28px" height="28px" radius="50%" />
      </div>
      <Skeleton width="60%" height="2.2rem" radius="var(--radius-sm)" />
      <Skeleton width="75%" height="0.8rem" />
    </div>
  );
};

/**
 * Grid of Skeleton Stat Cards
 */
export const SkeletonStatGrid = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton Table Loader
 */
export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', overflow: 'hidden' }}>
      {/* Table Header */}
      <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} width={`${100 / cols}%`} height="1rem" />
        ))}
      </div>
      {/* Table Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.25rem' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                width={`${100 / cols}%`}
                height={c === 0 ? '1.25rem' : '0.9rem'}
                radius={c === 0 ? '4px' : 'var(--radius-sm)'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Chart Loader
 */
export const SkeletonChart = ({ height = 260 }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="30%" height="1.25rem" />
        <Skeleton width="18%" height="1rem" />
      </div>
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1.5rem',
          padding: '1rem 0'
        }}
      >
        {[40, 65, 30, 85, 55, 70, 90].map((h, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${h}%`}
            radius="6px 6px 0 0"
            style={{ opacity: 0.6 }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Card for generic widgets
 */
export const SkeletonCard = ({ lines = 3, hasHeader = true }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {hasHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <Skeleton width="40%" height="1.2rem" />
          <Skeleton width="20%" height="0.8rem" />
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${90 - i * 15}%`} height="0.9rem" />
      ))}
    </div>
  );
};

export default Skeleton;

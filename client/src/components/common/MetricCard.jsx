import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * Modern SaaS KPI Metric Card
 */
export const MetricCard = ({
  icon: Icon,
  iconColor = 'var(--primary)',
  iconBg = 'rgba(59, 130, 246, 0.12)',
  label,
  value,
  subtext,
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  badge,
  onClick,
  style = {}
}) => {
  const TrendIcon =
    trendType === 'positive'
      ? ArrowUpRight
      : trendType === 'negative'
      ? ArrowDownRight
      : Minus;

  const trendColor =
    trendType === 'positive'
      ? 'var(--success)'
      : trendType === 'negative'
      ? 'var(--danger)'
      : 'var(--text-muted)';

  return (
    <div
      className="glass-panel stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '1.4rem',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        {Icon && (
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${iconBg}`
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.4rem' }}>
        <div className="stat-value">{value}</div>
        {badge && <span className="badge badge-primary">{badge}</span>}
      </div>

      {(subtext || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
          {trend && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: trendColor
              }}
            >
              <TrendIcon size={14} />
              {trend}
            </span>
          )}
          {subtext && <span className="stat-sub">{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;

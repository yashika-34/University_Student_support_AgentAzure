import React from 'react';
import { Award, BarChart2, BookOpen, Clock } from 'lucide-react';

// Animated Counter Component for dynamic stats
export const AnimatedNumber = ({ value, duration = 1200, decimals = 0 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const target = parseFloat(value) || 0;
    if (target === 0) { setDisplayValue(0); return; }
    const startTime = performance.now();
    let animFrame;
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = ease * target;
      setDisplayValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) animFrame = requestAnimationFrame(update);
    };
    animFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration, decimals]);

  return <span>{decimals > 0 ? Number(displayValue).toFixed(decimals) : displayValue}</span>;
};

const StatCard = ({ label, value, sub, color, icon: Icon, iconColor, delay, unit, extra }) => (
  <div
    className={`glass-panel stat-card animate-fade-in-up ${delay}`}
    style={{ transition: 'all 0.3s ease' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="stat-label">{label}</div>
      <Icon size={18} color={iconColor} />
    </div>
    <div className="stat-value" style={{ color }}>
      <AnimatedNumber value={parseFloat(value)} duration={1400} decimals={typeof value === 'string' && value.includes('.') ? 2 : 0} />
      {unit && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}> {unit}</span>}
    </div>
    <div className="stat-sub" style={{ color: sub?.color }}>{sub?.text}</div>
  </div>
);

const StatsGrid = ({ cgpa, avgAttendance, attendanceList, completedCredits, assignments }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
      <StatCard
        label="Cumulative GPA"
        value={parseFloat(cgpa)}
        unit="/ 10.0"
        color="var(--primary)"
        icon={Award}
        iconColor="var(--primary)"
        delay="delay-100"
        sub={{ text: 'Top 10% in Department', color: 'var(--success)' }}
      />
      <StatCard
        label="Aggregate Attendance"
        value={parseFloat(avgAttendance)}
        unit="%"
        color={Number(avgAttendance) >= 75 ? 'var(--text-primary)' : 'var(--danger)'}
        icon={BarChart2}
        iconColor="var(--accent-purple)"
        delay="delay-200"
        sub={{ text: `${attendanceList.length} Active Courses` }}
      />
      <StatCard
        label="Earned Credits"
        value={completedCredits}
        unit="/ 120"
        color="var(--text-primary)"
        icon={BookOpen}
        iconColor="var(--accent-cyan)"
        delay="delay-300"
        sub={{ text: `${Math.round((completedCredits / 120) * 100)}% Degree Progress` }}
      />
      <StatCard
        label="Pending Tasks"
        value={assignments.length}
        unit="Due"
        color="var(--text-primary)"
        icon={Clock}
        iconColor="var(--warning)"
        delay="delay-400"
        sub={{ text: 'Action required', color: 'var(--warning)' }}
      />
    </div>
  );
};

export default StatsGrid;

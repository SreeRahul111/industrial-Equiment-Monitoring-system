import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  statusBadge?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'critical' | 'warning' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sublabel,
  statusBadge,
  icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '110px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748B',
          }}
        >
          {label}
        </span>
        {icon && <div style={{ color: '#94A3B8' }}>{icon}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0F172A',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {statusBadge && <div>{statusBadge}</div>}
      </div>

      {sublabel && (
        <span style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
          {sublabel}
        </span>
      )}
    </div>
  );
};

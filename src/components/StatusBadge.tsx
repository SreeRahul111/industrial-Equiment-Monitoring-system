import React from 'react';
import { MachineStatus, AlertSeverity, AlertStatus, MaintenanceStatus, UserRole } from '../types';

type BadgeType = MachineStatus | AlertSeverity | AlertStatus | MaintenanceStatus | UserRole | string;

interface StatusBadgeProps {
  status: BadgeType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const s = String(status).toUpperCase();

  let bg = '#F1F5F9';
  let color = '#475569';
  let dotColor = '#94A3B8';

  if (s === 'NORMAL' || s === 'HEALTHY' || s === 'RESOLVED' || s === 'COMPLETED' || s === 'ALLOWED') {
    bg = '#ECFDF5';
    color = '#065F46';
    dotColor = '#10B981';
  } else if (s === 'WARNING' || s === 'ACKNOWLEDGED' || s === 'IN_PROGRESS' || s === 'DEGRADED') {
    bg = '#FFFBEB';
    color = '#92400E';
    dotColor = '#F59E0B';
  } else if (s === 'CRITICAL' || s === 'DENIED' || s === 'ACTIVE') {
    bg = '#FEF2F2';
    color = '#991B1B';
    dotColor = '#EF4444';
  } else if (s === 'OFFLINE' || s === 'CANCELLED') {
    bg = '#F1F5F9';
    color = '#64748B';
    dotColor = '#94A3B8';
  } else if (s === 'ADMIN') {
    bg = '#F5F3FF';
    color = '#5B21B6';
    dotColor = '#8B5CF6';
  } else if (s === 'ENGINEER') {
    bg = '#EFF6FF';
    color = '#1E40AF';
    dotColor = '#3B82F6';
  } else if (s === 'VIEWER') {
    bg = '#F8FAFC';
    color = '#475569';
    dotColor = '#64748B';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
      style={{
        backgroundColor: bg,
        color: color,
        border: `1px solid ${dotColor}33`,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          marginRight: '4px',
        }}
      />
      {status}
    </span>
  );
};

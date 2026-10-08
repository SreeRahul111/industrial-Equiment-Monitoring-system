import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading industrial telemetry...',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid #E2E8F0',
          borderTopColor: '#2563EB',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px',
        }}
      />
      <p style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

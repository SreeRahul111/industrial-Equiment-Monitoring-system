import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {toasts.map((t) => {
        let bg = '#FFFFFF';
        let borderColor = '#E2E8F0';
        let icon = <CheckCircle2 size={20} color="#10B981" />;

        if (t.type === 'error') {
          borderColor = '#FCA5A5';
          icon = <AlertCircle size={20} color="#EF4444" />;
        } else if (t.type === 'warning') {
          borderColor = '#FCD34D';
          icon = <AlertTriangle size={20} color="#F59E0B" />;
        }

        return (
          <div
            key={t.id}
            style={{
              backgroundColor: bg,
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              padding: '14px 16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
            <div style={{ flex: 1 }}>
              {t.title && (
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>
                  {t.title}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                {t.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

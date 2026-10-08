import React from 'react';
import { Header } from '../components/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      <Header />

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px 24px 48px' }}>
        {(title || actions) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div>
              {title && (
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#0F172A',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {actions}
              </div>
            )}
          </div>
        )}

        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer
        style={{
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#94A3B8',
        }}
      >
        Industrial Equipment Monitoring System (IEMS) • Protected Industrial Monitoring Workspace • AES/Argon2id Encrypted
      </footer>
    </div>
  );
};

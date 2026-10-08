import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Shield, Lock, AlertCircle, CheckCircle, ArrowRight, Activity, Terminal } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('engineer@company.com');
  const [password, setPassword] = useState('EngineerPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/overview';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication service unavailable. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setPresetUser = (role: 'admin' | 'engineer' | 'viewer') => {
    if (role === 'admin') {
      setEmail('admin@iems.industrial');
      setPassword('AdminPassword123!');
    } else if (role === 'engineer') {
      setEmail('engineer@company.com');
      setPassword('EngineerPassword123!');
    } else {
      setEmail('viewer@company.com');
      setPassword('ViewerPassword123!');
    }
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Left Brand Panel (Matching Figma Page 1) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 64px',
          background: 'linear-gradient(145deg, #0B132B 0%, #1C2541 100%)',
          borderRight: '1px solid #1E293B',
        }}
        className="brand-side-panel"
      >
        <div>
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                IEMS
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Industrial Equipment Monitoring
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: '38px',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            Industrial Equipment <br />
            <span style={{ color: '#38BDF8' }}>Monitoring System</span>
          </h1>

          <p style={{ fontSize: '16px', color: '#94A3B8', maxWidth: '440px', lineHeight: 1.6, marginBottom: '32px' }}>
            Secure visibility for every critical machine. Continuous telemetry ingestion, abnormal condition detection,
            and role-governed operational safeguards.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60A5FA',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              <Activity size={14} /> 24/7 MONITORING
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              <Lock size={14} /> SECURE ACCESS
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Telemetry • Detection • Alerts • Maintenance
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
            Military-grade Argon2id hashing • Tamper-evident Audit Logs • ISO/IEC 27001 Ready
          </div>
        </div>
      </div>

      {/* Right Login Form (Matching Figma Page 1) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 24px',
          backgroundColor: '#0F172A',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>
              Sign in as an authorized engineer or operator
            </p>
          </div>

          {/* Quick Preset Selector for Easy Role Testing */}
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} /> Quick Development Roles:
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPresetUser('engineer')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #3B82F6',
                  backgroundColor: email === 'engineer@company.com' ? '#2563EB' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Engineer
              </button>
              <button
                type="button"
                onClick={() => setPresetUser('admin')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #8B5CF6',
                  backgroundColor: email === 'admin@iems.industrial' ? '#7C3AED' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setPresetUser('viewer')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #64748B',
                  backgroundColor: email === 'viewer@company.com' ? '#475569' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Viewer
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#F87171',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="email-input"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                ENGINEER ID / EMAIL
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '14px',
                  outline: 'none',
                }}
                placeholder="engineer@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password-input"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                PASSWORD
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '14px',
                  outline: 'none',
                }}
                placeholder="••••••••••••"
              />
            </div>

            {/* MFA Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#34D399',
              }}
            >
              <CheckCircle size={14} />
              <span>MFA verification enrolled • Hardware token or TOTP</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {isLoading ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Continue securely</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Safeguards */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid #1E293B',
              fontSize: '12px',
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            <div>Protected session • Role-based access • Audit logged</div>
            <div style={{ marginTop: '4px', color: '#475569' }}>
              Need access help? Contact the system administrator.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .brand-side-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

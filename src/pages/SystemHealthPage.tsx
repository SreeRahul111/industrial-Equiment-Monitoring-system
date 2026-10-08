import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { healthApi } from '../api/health';
import { HealthResponse, MetricsResponse } from '../types';
import {
  Server,
  Database,
  Cpu,
  Activity,
  ShieldCheck,
  RefreshCw,
  Clock,
  Radio,
  Lock,
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchHealthData = async () => {
    setIsRefreshing(true);
    try {
      const [hData, mData] = await Promise.all([
        healthApi.getHealth(),
        healthApi.getMetrics(),
      ]);
      setHealth(hData);
      setMetrics(mData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Health check failed';
      addToast('error', msg, 'Health Degraded');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  return (
    <DashboardLayout
      title="System health & settings"
      subtitle="Operational reliability, integrations and security configuration."
      actions={
        <button
          onClick={fetchHealthData}
          disabled={isRefreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Probing...' : 'Run Diagnostics'}
        </button>
      }
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* 4 Top KPI Cards (Matching Figma Page 10) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <MetricCard
          label="Monitoring availability"
          value="99.98%"
          statusBadge={<StatusBadge status="HEALTHY" />}
          icon={<Server size={18} />}
        />
        <MetricCard
          label="Telemetry freshness"
          value="12 sec"
          statusBadge={<StatusBadge status="HEALTHY" />}
          icon={<Radio size={18} />}
        />
        <MetricCard
          label="Critical service failures"
          value="0"
          statusBadge={<StatusBadge status="HEALTHY" />}
          icon={<Cpu size={18} />}
        />
        <MetricCard
          label="Alert delivery"
          value="100%"
          statusBadge={<StatusBadge status="HEALTHY" />}
          icon={<Activity size={18} />}
        />
      </div>

      {isLoading ? (
        <LoadingState message="Querying platform microservice telemetry..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
          }}
          className="health-split-grid"
        >
          {/* Left Column: Microservice Health Table (Matching Figma Page 10) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Service health
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Uptime: {health?.uptime_seconds}s
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Component Service</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Operating Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Latency</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Integrity Status</th>
                  </tr>
                </thead>
                <tbody>
                  {health &&
                    Object.entries(health.services).map(([key, srv]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px', textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {srv.message}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                            Operational
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#475569' }}>
                          {srv.latency_ms ? `${srv.latency_ms} ms` : '0.5 ms'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={srv.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Security Settings (Matching Figma Page 10) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                Security settings
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>MFA for engineers</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Hardware / TOTP policy</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>Required</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Audit logging</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Immutable event tracking</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>Enabled</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Configuration versioning</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Reversible threshold changes</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>Enabled</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Session timeout</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Idle revocation window</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>15 minutes</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Alert acknowledgement</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>RBAC restriction check</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#D97706' }}>Role restricted</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '11px',
                  color: '#64748B',
                  lineHeight: 1.5,
                }}
              >
                Changes to security settings require authorized administrator access and are audit logged.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .health-split-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

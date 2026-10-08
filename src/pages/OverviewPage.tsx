import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { machinesApi } from '../api/machines';
import { alertsApi } from '../api/alerts';
import { healthApi } from '../api/health';
import { Machine, Alert, MetricsResponse } from '../types';
import {
  Activity,
  AlertTriangle,
  Sliders,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('just now');

  const loadData = async () => {
    try {
      const [machinesData, alertsData, metricsData] = await Promise.all([
        machinesApi.list(),
        alertsApi.list(),
        healthApi.getMetrics(),
      ]);
      setMachines(machinesData);
      setAlerts(alertsData);
      setMetrics(metricsData);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto-refresh for live industrial monitoring
    return () => clearInterval(interval);
  }, []);

  const normalCount = machines.filter((m) => m.status === 'NORMAL').length;
  const warningCount = machines.filter((m) => m.status === 'WARNING').length;
  const criticalCount = machines.filter((m) => m.status === 'CRITICAL').length;

  const criticalAlert = alerts.find((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE') || alerts[0];

  const filteredMachines = machines.filter((m) => {
    const q = searchTerm.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.machine_code.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Industrial monitoring" subtitle="Live machine health, sensor telemetry and active conditions.">
        <LoadingState message="Connecting to industrial telemetry bus..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Industrial monitoring"
      subtitle="Live machine health, sensor telemetry and active conditions."
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Updated {lastRefreshed}</span>
          <button
            onClick={() => {
              setIsLoading(true);
              loadData();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      }
    >
      {/* 4 Top KPI Metric Cards (Matching Figma Page 2) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <MetricCard
          label="Machines monitored"
          value={machines.length}
          statusBadge={<StatusBadge status="ACTIVE" />}
          icon={<Activity size={18} />}
        />
        <MetricCard
          label="Normal"
          value={normalCount}
          statusBadge={<StatusBadge status="NORMAL" />}
        />
        <MetricCard
          label="Warning"
          value={warningCount}
          statusBadge={<StatusBadge status="WARNING" />}
        />
        <MetricCard
          label="Critical"
          value={criticalCount}
          statusBadge={<StatusBadge status="CRITICAL" />}
        />
      </div>

      {/* Main Grid: Left Table & Right Action Sidebar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="overview-split-grid"
      >
        {/* Left Section: Machine Status Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                Machine status
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                Select a machine to inspect live telemetry and conditions.
              </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="text"
                placeholder="Search machine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#F8FAFC',
                }}
              />
            </div>
          </div>

          {filteredMachines.length === 0 ? (
            <EmptyState title="No machines found" description="Try modifying your search criteria." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Machine</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Temperature</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pressure</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Vibration</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Power</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((m) => {
                    const t = m.latest_telemetry;
                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.1s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        onClick={() => navigate(`/machines/${m.id}`)}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>
                            {m.machine_code}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            {m.name}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {t ? `${t.temperature}°C` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {t ? `${t.pressure} bar` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          <span
                            style={{
                              color: t && t.vibration > 6.0 ? '#DC2626' : 'inherit',
                              fontWeight: t && t.vibration > 6.0 ? 700 : 400,
                            }}
                          >
                            {t ? `${t.vibration} mm/s` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {t ? `${t.power_consumption} kW` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={m.status} />
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/machines/${m.id}`);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#2563EB',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Section: Active Alert & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Alert Card (Matching Figma Page 2) */}
          {criticalAlert && (
            <div
              style={{
                backgroundColor: criticalAlert.severity === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                borderRadius: '12px',
                border: `1px solid ${criticalAlert.severity === 'CRITICAL' ? '#FCA5A5' : '#FCD34D'}`,
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: criticalAlert.severity === 'CRITICAL' ? '#991B1B' : '#92400E',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  ACTIVE ALERT
                </span>
                <StatusBadge status={criticalAlert.severity} />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                {criticalAlert.severity} • {criticalAlert.machine_code || 'Machine'}
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                {criticalAlert.message}
              </p>

              <button
                onClick={() => navigate('/alerts')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Open alert</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Quick Actions (Matching Figma Page 2) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
              Quick actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => navigate('/thresholds')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1E293B',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} color="#2563EB" /> Configure thresholds
                </span>
                <ExternalLink size={14} color="#94A3B8" />
              </button>

              <button
                onClick={() => navigate('/maintenance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1E293B',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#10B981" /> Schedule maintenance
                </span>
                <ExternalLink size={14} color="#94A3B8" />
              </button>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: '#64748B',
              }}
            >
              <ShieldCheck size={14} color="#10B981" />
              <span>All actions require authorization and are audit logged.</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .overview-split-grid {
            grid-template-columns: 2.2fr 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

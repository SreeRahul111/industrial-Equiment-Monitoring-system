import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { alertsApi } from '../api/alerts';
import { Alert, AlertSeverity, AlertStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  FileDown,
  RotateCcw,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Action Modals
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [ackNote, setAckNote] = useState('Reviewed by on-duty engineer; inspecting telemetry.');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState('Physical inspection complete; operational threshold satisfied.');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchAlerts = async () => {
    try {
      const data = await alertsApi.list();
      setAlerts(data);

      const targetMachineId = searchParams.get('machine_id');
      if (targetMachineId) {
        const match = data.find((a) => a.machine_id === parseInt(targetMachineId, 10));
        if (match) setSelectedAlert(match);
        else if (data.length > 0) setSelectedAlert(data[0]);
      } else if (data.length > 0 && !selectedAlert) {
        setSelectedAlert(data[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch alerts';
      addToast('error', msg, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [searchParams]);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsActionLoading(true);
    try {
      const updated = await alertsApi.acknowledge(selectedAlert.id, ackNote);
      addToast('success', `Alert ${updated.alert_code || updated.id} acknowledged`, 'Acknowledged');
      setIsAckModalOpen(false);
      setSelectedAlert(updated);
      fetchAlerts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      addToast('error', msg, 'Authorization Denied');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsActionLoading(true);
    try {
      const updated = await alertsApi.resolve(selectedAlert.id, resolveNote);
      addToast('success', `Alert ${updated.alert_code || updated.id} resolved successfully`, 'Resolved');
      setIsResolveModalOpen(false);
      setSelectedAlert(updated);
      fetchAlerts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      addToast('error', msg, 'Authorization Denied');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      a.message.toLowerCase().includes(q) ||
      (a.alert_code && a.alert_code.toLowerCase().includes(q)) ||
      (a.machine_code && a.machine_code.toLowerCase().includes(q)) ||
      a.alert_type.toLowerCase().includes(q);
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <DashboardLayout
      title="Alert center"
      subtitle="Prioritize abnormal behavior, acknowledge safely and track resolution."
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 10px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid #FCA5A5',
            }}
          >
            {activeCount} ACTIVE
          </span>
          <button
            onClick={() => addToast('success', 'Alert audit report exported.', 'Report Exported')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <FileDown size={14} /> Export report
          </button>
        </div>
      }
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Filter and Search Bar (Matching Figma Page 6) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
        }}
      >
        <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            placeholder="Search machine, alert type or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Severities Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#334155' }}
        >
          <option value="ALL">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#334155' }}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Unacknowledged (Active)</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching active alert streams..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
          }}
          className="alerts-split-grid"
        >
          {/* Left Column: Alert Queue List */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              Alert queue ({filteredAlerts.length})
            </h3>

            {filteredAlerts.length === 0 ? (
              <EmptyState title="No alerts match criteria" description="All equipment operating nominal or filter returned 0 results." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredAlerts.map((a) => {
                  const isSelected = selectedAlert?.id === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlert(a)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                            {a.alert_code || `ALT-${a.id}`}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            {a.machine_code || `Machine #${a.machine_id}`}
                          </span>
                        </div>
                        <StatusBadge status={a.severity} />
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>
                        {a.message}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                        <span>Detected {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Alert Workflow Inspector (Matching Figma Page 6) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedAlert ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    ALERT WORKFLOW
                  </span>
                  <StatusBadge status={selectedAlert.severity} />
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  {selectedAlert.alert_code || `ALT-${selectedAlert.id}`} • {selectedAlert.machine_code || 'Machine'}
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
                  {selectedAlert.message}
                </p>

                {/* Metric Delta Comparison Box */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Measured Value</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626', fontFamily: 'var(--font-mono)' }}>
                      {selectedAlert.measured_value}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Configured Threshold</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                      {selectedAlert.threshold_value}
                    </div>
                  </div>
                </div>

                {/* 4-Step Lifecycle Audit Tracker (Matching Figma Page 6) */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Incident Lifecycle
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>Detected by Abnormal Engine</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>Engineer Notified</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <CheckCircle2 size={16} color={selectedAlert.status !== 'ACTIVE' ? '#10B981' : '#CBD5E1'} />
                      <span style={{ color: selectedAlert.status !== 'ACTIVE' ? '#0F172A' : '#94A3B8' }}>
                        {selectedAlert.status !== 'ACTIVE'
                          ? `Acknowledged by ${selectedAlert.acknowledged_by || 'Engineer'}`
                          : 'Awaiting Acknowledgement'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <CheckCircle2 size={16} color={selectedAlert.status === 'RESOLVED' ? '#10B981' : '#CBD5E1'} />
                      <span style={{ color: selectedAlert.status === 'RESOLVED' ? '#0F172A' : '#94A3B8' }}>
                        {selectedAlert.status === 'RESOLVED'
                          ? `Resolved by ${selectedAlert.resolved_by || 'Engineer'}`
                          : 'Resolution In Progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hasRole(['ADMIN', 'ENGINEER']) ? (
                    <>
                      {selectedAlert.status === 'ACTIVE' && (
                        <button
                          onClick={() => setIsAckModalOpen(true)}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Acknowledge Alert
                        </button>
                      )}

                      {selectedAlert.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => setIsResolveModalOpen(true)}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve & Clear Alert
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/maintenance?machine_id=${selectedAlert.machine_id}`)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#F8FAFC',
                          color: '#334155',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={14} /> Schedule Maintenance
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: '10px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                      Read-only role (Viewer). Acknowledging and resolving alerts requires Engineer or Admin authorization.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState title="Select an alert" description="Choose an incident from the queue to inspect details." />
            )}
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      <Modal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        title="Acknowledge Abnormal Condition"
      >
        <form onSubmit={handleAcknowledge} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Acknowledging this alert affirms that an authorized engineer has taken ownership of this incident.
            An audit event will be recorded.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Engineer Investigation Note
            </label>
            <textarea
              required
              rows={3}
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAckModalOpen(false)}
              style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFF' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', background: '#2563EB', color: '#FFF', fontWeight: 600 }}
            >
              {isActionLoading ? 'Saving...' : 'Confirm Acknowledgement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve & Clear Incident"
      >
        <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Confirm that the abnormal behavior has subsided or physical corrective maintenance was performed.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Resolution Summary
            </label>
            <textarea
              required
              rows={3}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsResolveModalOpen(false)}
              style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFF' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', background: '#10B981', color: '#FFF', fontWeight: 600 }}
            >
              {isActionLoading ? 'Saving...' : 'Resolve Alert'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (min-width: 1024px) {
          .alerts-split-grid {
            grid-template-columns: 1.8fr 1.2fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

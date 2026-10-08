import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { thresholdsApi } from '../api/thresholds';
import { machinesApi } from '../api/machines';
import { Machine, Threshold, ThresholdHistory } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  History,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock,
} from 'lucide-react';

export const ThresholdsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasRole } = useAuth();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<Threshold | null>(null);
  const [history, setHistory] = useState<ThresholdHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form Fields
  const [tempMin, setTempMin] = useState<number>(10.0);
  const [tempMax, setTempMax] = useState<number>(90.0);
  const [pressMin, setPressMin] = useState<number>(1.0);
  const [pressMax, setPressMax] = useState<number>(8.0);
  const [vibMax, setVibMax] = useState<number>(6.0);
  const [powerMin, setPowerMin] = useState<number>(5.0);
  const [powerMax, setPowerMax] = useState<number>(80.0);
  const [reason, setReason] = useState<string>('Standard calibration update');

  const isReadOnly = !hasRole(['ADMIN', 'ENGINEER']);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const init = async () => {
      try {
        const machinesData = await machinesApi.list();
        setMachines(machinesData);

        const paramId = searchParams.get('machine_id');
        const defaultId = paramId ? parseInt(paramId, 10) : machinesData[0]?.id;
        if (defaultId) {
          setSelectedMachineId(defaultId);
          await loadThresholdData(defaultId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize';
        addToast('error', msg, 'Error');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const loadThresholdData = async (machineId: number) => {
    try {
      const [thData, histData] = await Promise.all([
        thresholdsApi.getByMachine(machineId),
        thresholdsApi.getHistory(machineId),
      ]);
      setThreshold(thData);
      setHistory(histData);

      setTempMin(thData.temperature_min);
      setTempMax(thData.temperature_max);
      setPressMin(thData.pressure_min);
      setPressMax(thData.pressure_max);
      setVibMax(thData.vibration_max);
      setPowerMin(thData.power_min);
      setPowerMax(thData.power_max);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load threshold data';
      addToast('error', msg, 'Error');
    }
  };

  const handleMachineSelect = (mId: number) => {
    setSelectedMachineId(mId);
    setSearchParams({ machine_id: mId.toString() });
    loadThresholdData(mId);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId) return;

    if (tempMin >= tempMax) {
      addToast('error', 'Temperature minimum must be less than maximum', 'Validation Error');
      return;
    }
    if (pressMin >= pressMax) {
      addToast('error', 'Pressure minimum must be less than maximum', 'Validation Error');
      return;
    }
    if (powerMin >= powerMax) {
      addToast('error', 'Power minimum must be less than maximum', 'Validation Error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await thresholdsApi.update(selectedMachineId, {
        temperature_min: Number(tempMin),
        temperature_max: Number(tempMax),
        pressure_min: Number(pressMin),
        pressure_max: Number(pressMax),
        vibration_max: Number(vibMax),
        power_min: Number(powerMin),
        power_max: Number(powerMax),
        reason,
      });
      setThreshold(updated);
      addToast('success', `Thresholds updated to Version ${updated.version} and audit logged.`, 'Configuration Saved');
      await loadThresholdData(selectedMachineId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save rejected';
      addToast('error', msg, 'Authorization Denied');
    } finally {
      setIsSaving(false);
    }
  };

  const currentMachine = machines.find((m) => m.id === selectedMachineId);

  return (
    <DashboardLayout
      title="Threshold configuration"
      subtitle="Authorized engineers can safely update monitoring conditions."
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Machine Selector Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Monitored Machine:
          </label>
          <select
            value={selectedMachineId || ''}
            onChange={(e) => handleMachineSelect(parseInt(e.target.value, 10))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
              outline: 'none',
            }}
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machine_code} • {m.name} ({m.status})
              </option>
            ))}
          </select>
        </div>

        {threshold && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
            <span>Active Config Version:</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              v{threshold.version}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading threshold limits..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
          }}
          className="threshold-split-grid"
        >
          {/* Left Column: Form (Matching Figma Page 3) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                {currentMachine?.machine_code} • {currentMachine?.name}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                Configuration changes are validated against machine specifications before they are applied.
              </p>
            </div>

            {isReadOnly && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#991B1B',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <Lock size={16} />
                <span>
                  You are logged in with <strong>{user?.role}</strong> role. Threshold modification is restricted
                  to authorized Engineers and Administrators.
                </span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Temperature */}
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Temperature (°C)</label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Safe Operating Range</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Min Alert Threshold</span>
                    <input
                      type="number"
                      step="0.5"
                      disabled={isReadOnly}
                      value={tempMin}
                      onChange={(e) => setTempMin(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>High Threshold (Max)</span>
                    <input
                      type="number"
                      step="0.5"
                      disabled={isReadOnly}
                      value={tempMax}
                      onChange={(e) => setTempMax(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Pressure */}
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Pressure (bar)</label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Safe Operating Range</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Min Alert Threshold</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      value={pressMin}
                      onChange={(e) => setPressMin(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>High Threshold (Max)</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      value={pressMax}
                      onChange={(e) => setPressMax(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Vibration */}
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Vibration (mm/s)</label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Peak RMS Velocity Limit</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>High Threshold (Critical &gt; 130%)</span>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isReadOnly}
                    value={vibMax}
                    onChange={(e) => setVibMax(parseFloat(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Power Consumption */}
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Power Consumption (kW)</label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Active Load Range</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Low Draw Threshold</span>
                    <input
                      type="number"
                      step="1"
                      disabled={isReadOnly}
                      value={powerMin}
                      onChange={(e) => setPowerMin(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>High Draw Threshold</span>
                    <input
                      type="number"
                      step="1"
                      disabled={isReadOnly}
                      value={powerMax}
                      onChange={(e) => setPowerMax(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Reason for Change (for Audit Trail) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Engineering Justification / Change Reason (Audit Logged)
                </label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Adjusted high threshold following compressor head inspection"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Validation: values are verified within permitted physical ranges.
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => selectedMachineId && loadThresholdData(selectedMachineId)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isReadOnly || isSaving}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isReadOnly ? '#94A3B8' : '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isReadOnly || isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Save size={15} />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Security Guardrails & Version History (Matching Figma Page 3) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Security Guardrails Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Security guardrails
                </h3>
                <StatusBadge status="HEALTHY" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Authorization</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      {hasRole(['ADMIN', 'ENGINEER']) ? 'Engineer role verified' : 'Viewer role restricted'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Validation</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Physical range & cross-field checks enabled</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Audit trail</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Change recorded with IP, actor, diffs</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Integrity</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Configuration is versioned & reversible</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version History Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <History size={16} color="#2563EB" />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Version History ({history.length})
                </h4>
              </div>

              {history.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94A3B8' }}>No prior threshold modifications recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                          Version {h.version}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                        {h.change_reason || 'Configuration updated'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        Changed by: {h.changed_by}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .threshold-split-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

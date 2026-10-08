import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { TelemetryChart } from '../components/TelemetryChart';
import { Modal } from '../components/Modal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { machinesApi } from '../api/machines';
import { telemetryApi } from '../api/telemetry';
import { MachineDetail, Telemetry } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  Calendar,
  Sliders,
  AlertTriangle,
  ArrowLeft,
  Activity,
  PlusCircle,
  Clock,
  Shield,
  Gauge,
  Zap,
  Thermometer,
  Radio,
} from 'lucide-react';

export const MachineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [machine, setMachine] = useState<MachineDetail | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<Telemetry[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Telemetry simulation form state
  const [simTemp, setSimTemp] = useState(75.0);
  const [simPress, setSimPress] = useState(5.2);
  const [simVib, setSimVib] = useState(2.8);
  const [simPower, setSimPower] = useState(55.0);
  const [simStatus, setSimStatus] = useState('RUNNING');
  const [isSimulating, setIsSimulating] = useState(false);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadMachineData = async () => {
    if (!id) return;
    try {
      const data = await machinesApi.getById(parseInt(id, 10));
      setMachine(data);
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '7d' ? 168 : 24;
      const history = await telemetryApi.getByMachine(data.id, hours);
      setTelemetryHistory(history);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load machine details';
      addToast('error', msg, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMachineData();
  }, [id, timeRange]);

  const handleSimulateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    setIsSimulating(true);
    try {
      await telemetryApi.ingest({
        machine_id: machine.id,
        temperature: Number(simTemp),
        pressure: Number(simPress),
        vibration: Number(simVib),
        power_consumption: Number(simPower),
        operating_status: simStatus,
      });
      addToast('success', 'Telemetry validated & ingested. Rules engine evaluated.', 'Telemetry Ingested');
      setIsSimulateModalOpen(false);
      loadMachineData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Telemetry rejection';
      addToast('error', msg, 'Validation Rejected');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Machine Telemetry">
        <LoadingState message="Retrieving real-time machine telemetry streams..." />
      </DashboardLayout>
    );
  }

  if (!machine) {
    return (
      <DashboardLayout title="Machine Not Found">
        <EmptyState
          title="Machine does not exist"
          description="The requested machine identifier could not be located in the registry."
          actionText="Back to Machines"
          onAction={() => navigate('/machines')}
        />
      </DashboardLayout>
    );
  }

  const latest = machine.latest_telemetry;

  return (
    <DashboardLayout
      title={`${machine.machine_code} • ${machine.name}`}
      subtitle="Detailed telemetry, operating condition and recent abnormal behavior."
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => navigate('/machines')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {hasRole(['ADMIN', 'ENGINEER']) && (
            <>
              <button
                onClick={() => setIsSimulateModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer',
                }}
              >
                <PlusCircle size={14} /> Ingest Live Telemetry
              </button>

              <button
                onClick={() => navigate(`/maintenance?machine_id=${machine.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <Calendar size={14} /> Schedule Maintenance
              </button>
            </>
          )}
        </div>
      }
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Machine Status Header Card (Matching Figma Page 5) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {machine.name} • {machine.location}
            </span>
            <StatusBadge status={machine.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748B' }}>
            <span>Operating Condition: <strong>{latest?.operating_status || 'NOMINAL'}</strong></span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> Last reading: {latest ? new Date(latest.timestamp).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate(`/thresholds?machine_id=${machine.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} color="#2563EB" /> Configure Thresholds
          </button>
          <button
            onClick={() => navigate(`/alerts?machine_id=${machine.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <AlertTriangle size={14} color="#EF4444" /> View Alert History
          </button>
        </div>
      </div>

      {/* 4 Sensor Metric Cards (Matching Figma Page 5) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Temperature</span>
            <Thermometer size={16} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            {latest ? `${latest.temperature}°C` : '—'}
          </div>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={latest && latest.temperature > (machine.threshold?.temperature_max || 90) ? 'CRITICAL' : 'NORMAL'} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Pressure</span>
            <Gauge size={16} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            {latest ? `${latest.pressure} bar` : '—'}
          </div>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={latest && latest.pressure > (machine.threshold?.pressure_max || 8.0) ? 'WARNING' : 'NORMAL'} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Vibration</span>
            <Radio size={16} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: latest && latest.vibration > (machine.threshold?.vibration_max || 6.0) ? '#DC2626' : '#0F172A', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            {latest ? `${latest.vibration} mm/s` : '—'}
          </div>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={latest && latest.vibration > (machine.threshold?.vibration_max || 6.0) ? 'CRITICAL' : 'NORMAL'} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Power consumption</span>
            <Zap size={16} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            {latest ? `${latest.power_consumption} kW` : '—'}
          </div>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={latest && latest.power_consumption > (machine.threshold?.power_max || 80.0) ? 'WARNING' : 'NORMAL'} />
          </div>
        </div>
      </div>

      {/* Main Split: Charts on Left & Machine Status Sidebar on Right (Matching Figma Page 5) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="machine-detail-grid"
      >
        {/* Left Column: Interactive Telemetry Chart */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
            Telemetry Trend ({timeRange.toUpperCase()})
          </h3>
          <TelemetryChart
            telemetryData={telemetryHistory}
            threshold={machine.threshold}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>

        {/* Right Column: Active Conditions & Guardrail Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Condition Summary Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
              Current condition
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Vibration</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Max allowed: {machine.threshold?.vibration_max || 6.0} mm/s</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{latest?.vibration} mm/s</div>
                  <span style={{ fontSize: '10px', color: latest && latest.vibration > 6.0 ? '#DC2626' : '#10B981', fontWeight: 600 }}>
                    {latest && latest.vibration > 6.0 ? 'Above threshold' : 'Nominal'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Temperature</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Max allowed: {machine.threshold?.temperature_max || 90.0} °C</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{latest?.temperature} °C</div>
                  <span style={{ fontSize: '10px', color: latest && latest.temperature > 90.0 ? '#DC2626' : '#10B981', fontWeight: 600 }}>
                    {latest && latest.temperature > 90.0 ? 'Above threshold' : 'Nominal'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Pressure</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Safe range: {machine.threshold?.pressure_min} - {machine.threshold?.pressure_max} bar</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{latest?.pressure} bar</div>
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>Nominal</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Data Availability</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Ingestion uptime</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>99.98%</div>
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Ingest Live Telemetry (Simulate Sensor) */}
      <Modal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        title={`Ingest Real-time Telemetry for ${machine.machine_code}`}
      >
        <form onSubmit={handleSimulateTelemetry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Provide sensor values to test ingestion validation and trigger the abnormal behavior engine.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={simTemp}
                onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Pressure (bar)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={simPress}
                onChange={(e) => setSimPress(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Vibration (mm/s)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={simVib}
                onChange={(e) => setSimVib(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Power (kW)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={simPower}
                onChange={(e) => setSimPower(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Operating Status
            </label>
            <select
              value={simStatus}
              onChange={(e) => setSimStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
            >
              <option value="RUNNING">RUNNING</option>
              <option value="IDLE">IDLE</option>
              <option value="STANDBY">STANDBY</option>
              <option value="STOPPED">STOPPED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(false)}
              style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFF' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSimulating}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', background: '#2563EB', color: '#FFF', fontWeight: 600 }}
            >
              {isSimulating ? 'Validating...' : 'Ingest & Evaluate'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (min-width: 1024px) {
          .machine-detail-grid {
            grid-template-columns: 2.2fr 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

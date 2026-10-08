import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { maintenanceApi } from '../api/maintenance';
import { machinesApi } from '../api/machines';
import { Maintenance, Machine, MaintenanceStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  ListFilter,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, hasRole } = useAuth();

  const [schedules, setSchedules] = useState<Maintenance[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Create Form State
  const [targetMachineId, setTargetMachineId] = useState<number>(1);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [maintType, setMaintType] = useState<string>('Routine Mechanical & Sensor Calibration');
  const [assignedEngineer, setAssignedEngineer] = useState<string>('Rahul Kumar');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchSchedules = async () => {
    try {
      const [maintData, machinesData] = await Promise.all([
        maintenanceApi.list(),
        machinesApi.list(),
      ]);
      setSchedules(maintData);
      setMachines(machinesData);

      const qMachineId = searchParams.get('machine_id');
      if (qMachineId) {
        setTargetMachineId(parseInt(qMachineId, 10));
        setIsCreateModalOpen(true);
      } else if (machinesData.length > 0) {
        setTargetMachineId(machinesData[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch maintenance schedules';
      addToast('error', msg, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await maintenanceApi.schedule({
        machine_id: Number(targetMachineId),
        scheduled_date: new Date(scheduledDate).toISOString(),
        maintenance_type: maintType,
        assigned_engineer: assignedEngineer,
        notes,
      });
      addToast('success', 'Maintenance scheduled and assigned.', 'Schedule Created');
      setIsCreateModalOpen(false);
      fetchSchedules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scheduling failed';
      addToast('error', msg, 'Authorization Denied');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: MaintenanceStatus) => {
    try {
      await maintenanceApi.update(id, { status: newStatus });
      addToast('success', `Maintenance status updated to ${newStatus}`, 'Updated');
      fetchSchedules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      addToast('error', msg, 'Authorization Denied');
    }
  };

  const filtered = schedules.filter((s) => statusFilter === 'ALL' || s.status === statusFilter);

  return (
    <DashboardLayout
      title="Maintenance planner"
      subtitle="Schedule, prioritize and track machine maintenance activities."
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {schedules.length} SCHEDULED
          </span>
          {hasRole(['ADMIN', 'ENGINEER']) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
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
              <Plus size={15} /> Schedule Maintenance
            </button>
          )}
        </div>
      }
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Tabs and Filter Bar (Matching Figma Page 7) */}
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
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'calendar' ? '1px solid #2563EB' : '1px solid #E2E8F0',
              backgroundColor: activeTab === 'calendar' ? '#EFF6FF' : '#FFFFFF',
              color: activeTab === 'calendar' ? '#2563EB' : '#64748B',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarIcon size={14} /> Calendar
          </button>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'list' ? '1px solid #2563EB' : '1px solid #E2E8F0',
              backgroundColor: activeTab === 'list' ? '#EFF6FF' : '#FFFFFF',
              color: activeTab === 'list' ? '#2563EB' : '#64748B',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ListFilter size={14} /> List View
          </button>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: statusFilter === st ? '1px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: statusFilter === st ? '#EFF6FF' : '#FFFFFF',
                color: statusFilter === st ? '#2563EB' : '#64748B',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading maintenance calendar..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
          }}
          className="maint-split-grid"
        >
          {/* Main Area: Calendar Matrix or List View */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                October 2026 Schedule
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                UTC Synchronized Facility Operations
              </span>
            </div>

            {activeTab === 'calendar' ? (
              <div>
                {/* 7-day header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    // Match any maintenance scheduled around this date
                    const dayEvents = schedules.filter((s) => {
                      const dt = new Date(s.scheduled_date);
                      return dt.getDate() === d;
                    });

                    return (
                      <div
                        key={d}
                        style={{
                          height: '90px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '6px',
                          backgroundColor: dayEvents.length > 0 ? '#F8FAFC' : '#FFFFFF',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 700, color: dayEvents.length > 0 ? '#2563EB' : '#64748B' }}>
                          {d}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                          {dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              style={{
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                backgroundColor: ev.status === 'COMPLETED' ? '#ECFDF5' : '#EFF6FF',
                                color: ev.status === 'COMPLETED' ? '#065F46' : '#1E40AF',
                                border: '1px solid rgba(37,99,235,0.2)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={`${ev.machine_code}: ${ev.maintenance_type}`}
                            >
                              <strong>{ev.machine_code}</strong>: {ev.maintenance_type.slice(0, 14)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* List Table */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Machine</th>
                      <th style={{ padding: '10px 14px' }}>Maintenance Type</th>
                      <th style={{ padding: '10px 14px' }}>Scheduled Date</th>
                      <th style={{ padding: '10px 14px' }}>Assigned Engineer</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          {s.machine_code || `Machine #${s.machine_id}`}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                          {s.maintenance_type}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>
                          {new Date(s.scheduled_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                          {s.assigned_engineer}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <StatusBadge status={s.status} />
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {hasRole(['ADMIN', 'ENGINEER']) && s.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleStatusUpdate(s.id, 'COMPLETED')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #10B981',
                                backgroundColor: '#ECFDF5',
                                color: '#065F46',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Upcoming Schedule List (Matching Figma Page 7) */}
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
                Upcoming work orders
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {schedules.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {item.machine_code || `Machine #${item.machine_id}`}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500, marginBottom: '6px' }}>
                      {item.maintenance_type}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(item.scheduled_date).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} /> {item.assigned_engineer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Maintenance */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Machine Maintenance Activity"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Target Industrial Machine
            </label>
            <select
              value={targetMachineId}
              onChange={(e) => setTargetMachineId(parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machine_code} • {m.name} ({m.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Maintenance Type & Procedure
            </label>
            <input
              type="text"
              required
              placeholder="Vibration Damper Replacement & Bearing Regrease"
              value={maintType}
              onChange={(e) => setMaintType(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Assigned Certified Engineer
            </label>
            <input
              type="text"
              required
              placeholder="Rahul Kumar"
              value={assignedEngineer}
              onChange={(e) => setAssignedEngineer(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Operational Work Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Tag-out procedure required before access."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#FFF' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', background: '#2563EB', color: '#FFF', fontWeight: 600 }}
            >
              {isSubmitting ? 'Scheduling...' : 'Save Maintenance Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (min-width: 1024px) {
          .maint-split-grid {
            grid-template-columns: 2.2fr 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

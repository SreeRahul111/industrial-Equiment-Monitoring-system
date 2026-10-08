import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { machinesApi } from '../api/machines';
import { Machine, MachineStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Search, Plus, Filter, ArrowUpDown, ChevronRight, Activity } from 'lucide-react';

export const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add Machine form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchMachines = async () => {
    try {
      const data = await machinesApi.list();
      setMachines(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch machines';
      addToast('error', msg, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await machinesApi.create({
        machine_code: newCode,
        name: newName,
        location: newLocation,
      });
      addToast('success', `Machine ${newCode.toUpperCase()} enrolled successfully`, 'Enrolled');
      setIsAddModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewLocation('');
      fetchMachines();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create machine';
      addToast('error', msg, 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machine_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout
      title="Machine Registry"
      subtitle="Complete inventory of critical monitored equipment, operational states, and telemetry feeds."
      actions={
        hasRole(['ADMIN', 'ENGINEER']) ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Plus size={16} />
            Register Machine
          </button>
        ) : undefined
      }
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            placeholder="Search by machine name, asset tag, or bay location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: statusFilter === st ? '1px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: statusFilter === st ? '#EFF6FF' : '#FFFFFF',
                color: statusFilter === st ? '#2563EB' : '#64748B',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading registered machines..." />
      ) : filteredMachines.length === 0 ? (
        <EmptyState
          title="No machines matched your filters"
          description="Adjust your search query or clear the status filter to see equipment."
          actionText="Reset filters"
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Asset Code & Name</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Location</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Temperature</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Pressure</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Vibration</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Power</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Telemetry Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map((m) => {
                  const t = m.latest_telemetry;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/machines/${m.id}`)}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                          {m.machine_code}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          {m.name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569' }}>
                        {m.location}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <StatusBadge status={m.status} />
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {t ? `${t.temperature}°C` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {t ? `${t.pressure} bar` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        <span style={{ color: t && t.vibration > 6.0 ? '#DC2626' : 'inherit', fontWeight: t && t.vibration > 6.0 ? 700 : 400 }}>
                          {t ? `${t.vibration} mm/s` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {t ? `${t.power_consumption} kW` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/machines/${m.id}`);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#2563EB',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Register Machine */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Industrial Machine"
      >
        <form onSubmit={handleCreateMachine} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Machine Asset Code (e.g. MX-113)
            </label>
            <input
              type="text"
              required
              placeholder="MX-113"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Machine Name / Type
            </label>
            <input
              type="text"
              required
              placeholder="Centrifugal High-Pressure Chiller"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Facility Location
            </label>
            <input
              type="text"
              required
              placeholder="HVAC Utility Plant - Bay 3"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{
                padding: '8px 16px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Registering...' : 'Save Machine'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

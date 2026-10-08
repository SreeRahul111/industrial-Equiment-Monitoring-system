import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { adminApi } from '../api/admin';
import { User, UserRole } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  UserPlus,
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserCheck,
  Power,
  Key,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add user form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ENGINEER');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToast = (type: 'success' | 'warning' | 'error', message: string, title?: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchUsers = async () => {
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve engineers';
      addToast('error', msg, 'Access Denied');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.createUser({
        email: newEmail,
        name: newName,
        role: newRole,
        password: newPassword,
      });
      addToast('success', `User ${newEmail} created and enrolled.`, 'User Enrolled');
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('Password123!');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed';
      addToast('error', msg, 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      addToast('warning', 'Administrators cannot deactivate their own active account', 'Action Prevented');
      return;
    }
    try {
      const updated = await adminApi.updateUserStatus(user.id, !user.is_active);
      addToast('success', `User ${user.email} is now ${updated.is_active ? 'Active' : 'Disabled'}`, 'Status Changed');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      addToast('error', msg, 'Denied');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout
      title="Engineer & access administration"
      subtitle="Manage authorized engineer access using least privilege."
      actions={
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
          }}
        >
          <UserPlus size={16} /> Add engineer
        </button>
      }
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Filter and Search Bar (Matching Figma Page 9) */}
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
            placeholder="Search engineer name or email..."
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

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#334155' }}
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ENGINEER">ENGINEER</option>
          <option value="VIEWER">VIEWER</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading authorized engineer directory..." />
      ) : (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            marginBottom: '24px',
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Authorized Engineers & Operators ({filteredUsers.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> RBAC Enforcement Active
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Engineer</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>MFA Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Account Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Last Login</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Access Control</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={u.role} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#065F46',
                          backgroundColor: '#ECFDF5',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        <Key size={11} /> Enrolled
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: u.is_active ? '#10B981' : '#EF4444',
                        }}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: '#64748B' }}>
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.id === currentUser?.id}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: u.is_active ? '1px solid #FCA5A5' : '1px solid #86EFAC',
                          backgroundColor: u.is_active ? '#FEF2F2' : '#F0FDF4',
                          color: u.is_active ? '#991B1B' : '#166534',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {u.is_active ? 'Deactivate' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Policy Footer Callout (Matching Figma Page 9) */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#475569',
        }}
      >
        <ShieldCheck size={20} color="#2563EB" />
        <span>
          <strong>Security Policy:</strong> Privileged configuration actions require an authorized engineer role and
          are strictly audit logged. Access permissions adhere to principle of least privilege.
        </span>
      </div>

      {/* Modal: Add Engineer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll Authorized Engineer"
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="Anita Rao"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Engineer Work Email
            </label>
            <input
              type="email"
              required
              placeholder="engineer@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Role Assignment
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ENGINEER">ENGINEER (Monitoring, Thresholds, Alerts, Maintenance)</option>
              <option value="ADMIN">ADMIN (Full System Administration & User Management)</option>
              <option value="VIEWER">VIEWER (Read-only Telemetry & Alerts)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Initial Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#FFF' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', background: '#2563EB', color: '#FFF', fontWeight: 600 }}
            >
              {isSubmitting ? 'Enrolling...' : 'Enroll User'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

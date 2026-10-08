import { apiRequest } from './client';
import { Alert, AlertSeverity, AlertStatus } from '../types';

export const alertsApi = {
  list: async (params?: {
    severity?: AlertSeverity;
    status?: AlertStatus;
    machine_id?: number;
    search?: string;
  }): Promise<Alert[]> => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.machine_id) query.append('machine_id', params.machine_id.toString());
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<Alert[]>(`/alerts${queryString}`);
  },

  getById: async (id: number): Promise<Alert> => {
    return apiRequest<Alert>(`/alerts/${id}`);
  },

  acknowledge: async (id: number, note?: string): Promise<Alert> => {
    return apiRequest<Alert>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ note: note || 'Acknowledged by authorized engineer' }),
    });
  },

  resolve: async (id: number, resolution_note?: string): Promise<Alert> => {
    return apiRequest<Alert>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_note: resolution_note || 'Issue resolved and machine verified' }),
    });
  },
};

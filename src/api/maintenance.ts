import { apiRequest } from './client';
import { Maintenance, MaintenanceStatus } from '../types';

export const maintenanceApi = {
  list: async (status?: MaintenanceStatus, machineId?: number): Promise<Maintenance[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (machineId) params.append('machine_id', machineId.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Maintenance[]>(`/maintenance${queryString}`);
  },

  schedule: async (data: {
    machine_id: number;
    scheduled_date: string;
    maintenance_type: string;
    assigned_engineer: string;
    notes?: string;
  }): Promise<Maintenance> => {
    return apiRequest<Maintenance>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: {
      scheduled_date?: string;
      maintenance_type?: string;
      assigned_engineer?: string;
      status?: MaintenanceStatus;
      notes?: string;
    }
  ): Promise<Maintenance> => {
    return apiRequest<Maintenance>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

import { apiRequest } from './client';
import { Machine, MachineDetail, MachineStatus } from '../types';

export const machinesApi = {
  list: async (search?: string, status?: MachineStatus): Promise<Machine[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Machine[]>(`/machines${queryString}`);
  },

  getById: async (id: number): Promise<MachineDetail> => {
    return apiRequest<MachineDetail>(`/machines/${id}`);
  },

  create: async (data: { machine_code: string; name: string; location: string }): Promise<Machine> => {
    return apiRequest<Machine>('/machines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: { name?: string; location?: string; status?: MachineStatus }
  ): Promise<Machine> => {
    return apiRequest<Machine>(`/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

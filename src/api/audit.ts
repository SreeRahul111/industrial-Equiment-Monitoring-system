import { apiRequest } from './client';
import { AuditEvent } from '../types';

export const auditApi = {
  list: async (params?: {
    action?: string;
    result?: string;
    target_type?: string;
    search?: string;
    limit?: number;
  }): Promise<AuditEvent[]> => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.result) query.append('result', params.result);
    if (params?.target_type) query.append('target_type', params.target_type);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<AuditEvent[]>(`/audit${queryString}`);
  },
};

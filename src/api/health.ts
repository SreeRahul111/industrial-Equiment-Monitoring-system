import { apiRequest } from './client';
import { HealthResponse, MetricsResponse } from '../types';

export const healthApi = {
  getHealth: async (): Promise<HealthResponse> => {
    return apiRequest<HealthResponse>('/health');
  },

  getReadiness: async (): Promise<{ ready: boolean; database_connected: boolean; version: string }> => {
    return apiRequest<{ ready: boolean; database_connected: boolean; version: string }>('/readiness');
  },

  getMetrics: async (): Promise<MetricsResponse> => {
    return apiRequest<MetricsResponse>('/metrics');
  },
};

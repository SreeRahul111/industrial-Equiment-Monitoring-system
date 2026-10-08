import { apiRequest } from './client';
import { Threshold, ThresholdHistory } from '../types';

export const thresholdsApi = {
  getByMachine: async (machineId: number): Promise<Threshold> => {
    return apiRequest<Threshold>(`/thresholds/${machineId}`);
  },

  update: async (
    machineId: number,
    data: {
      temperature_min: number;
      temperature_max: number;
      pressure_min: number;
      pressure_max: number;
      vibration_max: number;
      power_min: number;
      power_max: number;
      reason?: string;
    }
  ): Promise<Threshold> => {
    return apiRequest<Threshold>(`/thresholds/${machineId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getHistory: async (machineId: number): Promise<ThresholdHistory[]> => {
    return apiRequest<ThresholdHistory[]>(`/thresholds/${machineId}/history`);
  },
};

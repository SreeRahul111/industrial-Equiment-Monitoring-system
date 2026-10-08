import { apiRequest } from './client';
import { Telemetry } from '../types';

export const telemetryApi = {
  getByMachine: async (machineId: number, hours: number = 24, limit: number = 100): Promise<Telemetry[]> => {
    return apiRequest<Telemetry[]>(`/machines/${machineId}/telemetry?hours=${hours}&limit=${limit}`);
  },

  ingest: async (data: {
    machine_id: number;
    sensor_id?: number;
    temperature: number;
    pressure: number;
    vibration: number;
    power_consumption: number;
    operating_status: string;
    timestamp?: string;
  }): Promise<Telemetry> => {
    return apiRequest<Telemetry>('/telemetry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

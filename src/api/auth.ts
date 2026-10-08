import { apiRequest } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>('/auth/me');
  },

  logout: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },
};

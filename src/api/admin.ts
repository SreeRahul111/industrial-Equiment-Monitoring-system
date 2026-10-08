import { apiRequest } from './client';
import { User, UserRole } from '../types';

export const adminApi = {
  listUsers: async (): Promise<User[]> => {
    return apiRequest<User[]>('/admin/users');
  },

  createUser: async (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }): Promise<User> => {
    return apiRequest<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (
    id: number,
    data: { name?: string; role?: UserRole; is_active?: boolean }
  ): Promise<User> => {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateUserStatus: async (id: number, is_active: boolean): Promise<User> => {
    return apiRequest<User>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  },
};

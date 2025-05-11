import { apiClient } from '../api/client';
import { RWA } from '../types/rwa';

export const rwaService = {
  async getAll(): Promise<RWA[]> {
    const response = await apiClient.get<RWA[]>('/api/rwa');
    return response.data;
  },

  async getById(id: number): Promise<RWA> {
    const response = await apiClient.get<RWA>(`/api/rwa/${id}`);
    return response.data;
  },

  async create(rwa: Omit<RWA, 'id' | 'createdAt' | 'updatedAt'>): Promise<RWA> {
    const response = await apiClient.post<RWA>('/api/rwa', rwa);
    return response.data;
  },

  async update(id: number, rwa: Partial<RWA>): Promise<RWA> {
    const response = await apiClient.put<RWA>(`/api/rwa/${id}`, rwa);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/rwa/${id}`);
  },

  async getByStatus(status: RWA['status']): Promise<RWA[]> {
    const response = await apiClient.get<RWA[]>(`/api/rwa/status/${status}`);
    return response.data;
  },

  async getByUser(userId: number): Promise<RWA[]> {
    const response = await apiClient.get<RWA[]>(`/api/rwa/user/${userId}`);
    return response.data;
  }
}; 
import { apiClient } from '../api/client';
import { User } from '@/types/user';

export const userService = {
  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },

  async update(id: number, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/api/users/${id}`, userData);
    return response.data;
  },

  async getWalletAddress(id: number): Promise<string> {
    const response = await apiClient.get<{ wallet_address: string }>(`/api/users/${id}/wallet`);
    return response.data.wallet_address;
  }
}; 
import { apiClient } from '../api/client';
import { RWANFTToken, RWAOwnershipHistory } from '../types/rwa';

export const tokenService = {
  async getByRWAId(rwaId: number): Promise<RWANFTToken[]> {
    const response = await apiClient.get<RWANFTToken[]>(`/api/rwa/${rwaId}/tokens`);
    return response.data;
  },

  async getByOwner(userId: number): Promise<RWANFTToken[]> {
    const response = await apiClient.get<RWANFTToken[]>(`/api/rwa/tokens/owner/${userId}`);
    return response.data;
  },

  async getOwnershipHistory(tokenId: number): Promise<RWAOwnershipHistory[]> {
    const response = await apiClient.get<RWAOwnershipHistory[]>(`/api/rwa/tokens/${tokenId}/history`);
    return response.data;
  },

  async transfer(tokenId: number, toUserId: number, quantity: number): Promise<RWAOwnershipHistory> {
    const response = await apiClient.post<RWAOwnershipHistory>(`/api/rwa/tokens/${tokenId}/transfer`, {
      toUserId,
      quantity
    });
    return response.data;
  },

  async getTokenMetadata(tokenId: number): Promise<any> {
    const response = await apiClient.get(`/api/rwa/tokens/${tokenId}/metadata`);
    return response.data;
  }
}; 
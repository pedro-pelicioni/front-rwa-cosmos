import { apiClient } from '../api/client';
import { RWANFTToken, RWAOwnershipHistory } from '../types/rwa';

interface TokenSale {
  id: number;
  token_id: number;
  seller_id: number;
  quantity: number;
  price_per_token: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const tokenService = {
  async getByRWAId(rwaId: number): Promise<RWANFTToken[]> {
    try {
      const response = await apiClient.get(`/api/rwa/nfts/rwa/${rwaId}`);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getByOwner(userId: number): Promise<RWANFTToken[]> {
    try {
      const response = await apiClient.get<RWANFTToken[]>(`/api/rwa/nfts/owner/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
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
  },

  async create(tokenData: { rwa_id: number; token_identifier: string; owner_user_id: number; metadata_uri?: string }): Promise<RWANFTToken> {
    const response = await apiClient.post<RWANFTToken>(`/api/rwa/nfts`, tokenData);
    return response.data;
  },

  async update(tokenId: number, data: Partial<RWANFTToken>): Promise<RWANFTToken> {
    const response = await apiClient.put<RWANFTToken>(`/api/rwa/nfts/${tokenId}`, data);
    return response.data;
  },

  async delete(tokenId: number): Promise<void> {
    await apiClient.delete(`/api/rwa/nfts/${tokenId}`);
  },

  async initiateSale(tokenId: number, quantity: number, pricePerToken: number): Promise<TokenSale> {
    const response = await apiClient.post<TokenSale>('/api/rwa/tokens/sale/initiate', {
      token_id: tokenId,
      quantity,
      price_per_token: pricePerToken
    });
    return response.data;
  },

  async confirmSale(saleId: number, txHash: string, signature: string): Promise<TokenSale> {
    const response = await apiClient.post<TokenSale>('/api/rwa/tokens/sale/confirm', {
      sale_id: saleId,
      tx_hash: txHash,
      signature
    });
    return response.data;
  },

  async cancelSale(saleId: number): Promise<void> {
    await apiClient.post(`/api/rwa/tokens/sale/cancel/${saleId}`);
  },

  async getSale(saleId: number): Promise<TokenSale> {
    const response = await apiClient.get<TokenSale>(`/api/rwa/tokens/sale/${saleId}`);
    return response.data;
  }
}; 
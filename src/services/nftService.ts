import { apiClient } from '../api/client';

export interface NFTToken {
  id: number;
  rwa_id: number;
  token_identifier: string;
  owner_id: number;
  metadata_uri: string;
  created_at: string;
  updated_at: string;
  rwa?: RWA;
  owner?: User;
}

export interface RWA {
  id: number;
  name: string;
  description: string;
  currentValue: number;
  totalTokens: number;
  status: 'active' | 'inactive' | 'sold';
}

export interface User {
  id: number;
  address: string;
  role: string;
}

export const nftService = {
  // Buscar token por identificador
  getByTokenId: async (tokenId: string): Promise<NFTToken> => {
    const response = await apiClient.get(`/api/rwa/nfts/token/${tokenId}`);
    return response.data;
  },

  // Buscar token por ID
  getById: async (id: number): Promise<NFTToken> => {
    const response = await apiClient.get(`/api/rwa/nfts/${id}`);
    return response.data;
  },

  // Listar tokens de um RWA
  getByRWAId: async (rwaId: number): Promise<NFTToken[]> => {
    const response = await apiClient.get(`/api/rwa/nfts/rwa/${rwaId}`);
    return response.data;
  },

  // Listar tokens de um usuário
  getByOwnerId: async (userId: number): Promise<NFTToken[]> => {
    const response = await apiClient.get(`/api/rwa/nfts/owner/${userId}`);
    return response.data;
  },

  // Mintar novo NFT
  mint: async (data: { rwa_id: number; owner_wallet_address: string }): Promise<NFTToken> => {
    const response = await apiClient.post('/api/rwa/nfts/mint', data);
    return response.data;
  },

  // Queimar NFT
  burn: async (token_identifier: string): Promise<void> => {
    await apiClient.post('/api/rwa/nfts/burn', { token_identifier });
  },

  // Transferir NFT
  transfer: async (data: { token_identifier: string; to_wallet_address: string }): Promise<void> => {
    await apiClient.post('/api/rwa/nfts/transfer', data);
  }
}; 
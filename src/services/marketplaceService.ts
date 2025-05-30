import { apiClient } from '../api/client';

export interface TokenListing {
  id: number;
  nft_token_id: number;
  seller_id: number;
  current_price: number;
  original_purchase_price: number;
  original_purchase_date: string;
  chain_transaction_metadata: any;
  listing_status: 'active' | 'sold' | 'cancelled' | 'expired';
  available_until: string;
  created_at: string;
  updated_at: string;
  nftToken: {
    id: number;
    rwa_id: number;
    token_identifier: string;
    owner_user_id: number;
    metadata_uri: string;
    created_at: string;
    updated_at: string;
    rwa?: {
      id: number;
      name: string;
      location: string;
      description: string;
      current_value: number;
      total_tokens: number;
      available_tokens: number;
      status: string;
      images?: string[];
    };
  };
  seller: any;
  priceHistory: TokenPriceHistory[];
}

export interface TokenPriceHistory {
  id: number;
  token_listing_id: number;
  price: number;
  changed_by: number;
  change_reason: string;
  created_at: string;
  changedByUser: any;
}

export const marketplaceService = {
  // Listar todos os tokens disponíveis
  getListings: async (): Promise<TokenListing[]> => {
    const response = await apiClient.get('/api/marketplace/listings');
    return response.data;
  },

  // Buscar listings com filtros
  searchListings: async (filters: {
    min_price?: number;
    max_price?: number;
    status?: 'active' | 'sold' | 'cancelled' | 'expired';
    sort_by?: 'created_at' | 'current_price';
    sort_order?: 'asc' | 'desc';
  }): Promise<TokenListing[]> => {
    const response = await apiClient.get('/api/marketplace/listings/search', { params: filters });
    return response.data;
  },

  // Listar tokens do usuário
  getMyListings: async (): Promise<TokenListing[]> => {
    const response = await apiClient.get('/api/marketplace/my-listings');
    return response.data;
  },

  // Obter detalhes de um listing
  getListingDetails: async (listingId: number): Promise<TokenListing> => {
    const response = await apiClient.get(`/api/marketplace/listings/${listingId}`);
    return response.data;
  },

  // Criar novo listing
  createListing: async (data: {
    nft_token_id: number;
    current_price: number;
    original_purchase_price: number;
    original_purchase_date: string;
    chain_transaction_metadata?: any;
    available_until?: string;
  }): Promise<TokenListing> => {
    const response = await apiClient.post('/api/marketplace/listings', data);
    return response.data;
  },

  // Atualizar preço de um listing
  updateListingPrice: async (listingId: number, data: {
    new_price: number;
    change_reason?: string;
  }): Promise<TokenListing> => {
    const response = await apiClient.patch(`/api/marketplace/listings/${listingId}/price`, data);
    return response.data;
  },

  // Cancelar um listing
  cancelListing: async (listingId: number): Promise<void> => {
    await apiClient.patch(`/api/marketplace/listings/${listingId}/cancel`);
  },

  // Atualizar status de um listing
  updateListingStatus: async (listingId: number, data: {
    status: 'active' | 'sold' | 'cancelled' | 'expired';
    transaction_metadata?: any;
  }): Promise<TokenListing> => {
    const response = await apiClient.patch(`/api/marketplace/listings/${listingId}/status`, data);
    return response.data;
  },

  // Obter histórico de preços
  getPriceHistory: async (listingId: number): Promise<TokenPriceHistory[]> => {
    const response = await apiClient.get(`/api/marketplace/listings/${listingId}/price-history`);
    return response.data;
  },

  // Verificar disponibilidade de um token
  checkTokenAvailability: async (nftTokenId: number): Promise<{
    available: boolean;
    listing?: TokenListing;
  }> => {
    const response = await apiClient.get(`/api/marketplace/tokens/${nftTokenId}/availability`);
    return response.data;
  },

  initiateSale: (data: { token_id: number; quantity: number; price_per_token: number }) =>
    apiClient.post('/api/rwa/tokens/sale/initiate', data),
  confirmSale: (data: { sale_id: number; tx_hash: string; signature: string }) =>
    apiClient.post('/api/rwa/tokens/sale/confirm', data),
  cancelSale: (sale_id: number) =>
    apiClient.post(`/api/rwa/tokens/sale/cancel/${sale_id}`),
  listAvailable: () =>
    apiClient.get('/api/rwa/tokens/sale/available'),
  listByToken: (token_id: number) =>
    apiClient.get(`/api/rwa/tokens/sale/token/${token_id}`),
  listBySeller: (seller_id: number) =>
    apiClient.get(`/api/rwa/tokens/sale/seller/${seller_id}`),
  listByBuyer: (buyer_id: number) =>
    apiClient.get(`/api/rwa/tokens/sale/buyer/${buyer_id}`),
  getSale: (sale_id: number) =>
    apiClient.get(`/api/rwa/tokens/sale/${sale_id}`),
}; 
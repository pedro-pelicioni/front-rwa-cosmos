import { apiClient } from '../api/client';
import { RWA } from '../types/rwa';

// Corrigir o tipo da resposta para refletir o backend
interface ApiResponse<T> {
  status: number;
  data: T;
}

export const rwaService = {
  async getAll(): Promise<RWA[]> {
    const response = await apiClient.get<RWA[]>('/api/rwa');
    return response.data;
  },

  async getById(id: number): Promise<RWA> {
    const response = await apiClient.get(`/api/rwa/${id}`);
    const raw = response.data && response.data.data ? response.data.data : response.data;

    return {
      id: raw.id,
      name: raw.name,
      user_id: raw.user_id,
      gpsCoordinates: raw.gps_coordinates,
      city: raw.city,
      country: raw.country,
      description: raw.description,
      currentValue: typeof raw.current_value === 'string' ? parseFloat(raw.current_value) : raw.current_value,
      totalTokens: raw.total_tokens,
      yearBuilt: raw.year_built,
      sizeM2: typeof raw.size_m2 === 'string' ? parseFloat(raw.size_m2) : raw.size_m2,
      status: raw.status,
      geometry: raw.geometry,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      location: `${raw.city}, ${raw.country}`,
      metadata: {
        images: [],
        documents: [],
        amenities: []
      }
    };
  },

  async create(rwa: Omit<RWA, 'id' | 'createdAt' | 'updatedAt'>): Promise<RWA> {
    // Garantir que os campos obrigatórios estejam presentes
    const payload = {
      name: rwa.name,
      description: rwa.description || '',
      location: `${rwa.city}, ${rwa.country}`,
      city: rwa.city,
      country: rwa.country,
      currentValue: typeof rwa.currentValue === 'string' ? parseFloat(rwa.currentValue) : rwa.currentValue,
      totalTokens: rwa.totalTokens,
      yearBuilt: rwa.yearBuilt || 0,
      sizeM2: rwa.sizeM2 || 0,
      gpsCoordinates: rwa.gpsCoordinates ? rwa.gpsCoordinates.split(',').map(c => c.trim()).reverse().join(', ') : '',
      status: rwa.status || 'active',
      geometry: rwa.geometry || {},
      metadata: rwa.metadata || {
        images: [],
        documents: [],
        amenities: []
      }
    };

    console.log('[rwaService] Enviando payload para criação:', payload);
    const response = await apiClient.post<RWA>('/api/rwa', payload);
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
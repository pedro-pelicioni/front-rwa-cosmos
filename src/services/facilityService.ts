import { apiClient } from '../api/client';
import { RWAFacility } from '../types/rwa';

export const facilityService = {
  async getByRWAId(rwaId: number): Promise<RWAFacility[]> {
    const response = await apiClient.get<RWAFacility[]>(`/api/rwa/${rwaId}/facilities`);
    return response.data;
  },

  async create(rwaId: number, facility: Omit<RWAFacility, 'id' | 'rwa_id' | 'created_at' | 'updated_at'>): Promise<RWAFacility> {
    const response = await apiClient.post<RWAFacility>(`/api/rwa/${rwaId}/facilities`, facility);
    return response.data;
  },

  async update(id: number, facility: Partial<RWAFacility>): Promise<RWAFacility> {
    const response = await apiClient.put<RWAFacility>(`/api/rwa/facilities/${id}`, facility);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/rwa/facilities/${id}`);
  },

  async getByFloor(rwaId: number, floorNumber: number): Promise<RWAFacility[]> {
    const response = await apiClient.get<RWAFacility[]>(`/api/rwa/${rwaId}/facilities/floor/${floorNumber}`);
    return response.data;
  },

  async getByType(rwaId: number, type: string): Promise<RWAFacility[]> {
    const response = await apiClient.get<RWAFacility[]>(`/api/rwa/${rwaId}/facilities/type/${type}`);
    return response.data;
  }
}; 
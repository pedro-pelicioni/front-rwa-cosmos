import { useState, useCallback } from 'react';
import { RWAFacility } from '../types/rwa';
import { facilityService } from '../services/facilityService';

export const useRWAFacilities = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getByRWAId = useCallback(async (rwaId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await facilityService.getByRWAId(rwaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar instalações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (rwaId: number, facility: Omit<RWAFacility, 'id' | 'rwa_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);
      return await facilityService.create(rwaId, facility);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar instalação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, facility: Partial<RWAFacility>) => {
    try {
      setLoading(true);
      setError(null);
      return await facilityService.update(id, facility);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar instalação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await facilityService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar instalação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getByFloor = useCallback(async (rwaId: number, floorNumber: number) => {
    try {
      setLoading(true);
      setError(null);
      return await facilityService.getByFloor(rwaId, floorNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar instalações por andar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getByType = useCallback(async (rwaId: number, type: string) => {
    try {
      setLoading(true);
      setError(null);
      return await facilityService.getByType(rwaId, type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar instalações por tipo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getByRWAId,
    create,
    update,
    remove,
    getByFloor,
    getByType
  };
}; 
import { useState, useCallback } from 'react';
import { RWA } from '../types/rwa';
import { rwaService } from '../services/rwaService';

export const useRWA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await rwaService.getAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar RWAs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      return await rwaService.getById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar RWA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (rwa: Omit<RWA, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      return await rwaService.create(rwa);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar RWA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, rwa: Partial<RWA>) => {
    try {
      setLoading(true);
      setError(null);
      return await rwaService.update(id, rwa);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar RWA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await rwaService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar RWA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove
  };
}; 
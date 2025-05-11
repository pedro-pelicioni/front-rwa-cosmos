import { useState, useCallback } from 'react';
import { RWAImage } from '../types/rwa';
import { imageService } from '../services/imageService';

export const useRWAImages = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getByRWAId = useCallback(async (rwaId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await imageService.getByRWAId(rwaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar imagens');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback(async (rwaId: number, file: File, title: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      return await imageService.upload(rwaId, file, title, description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, image: Partial<RWAImage>) => {
    try {
      setLoading(true);
      setError(null);
      return await imageService.update(id, image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar imagem');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await imageService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar imagem');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (rwaId: number, imageIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      await imageService.updateOrder(rwaId, imageIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar ordem das imagens');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getByRWAId,
    upload,
    update,
    remove,
    updateOrder
  };
}; 
import { useState, useCallback } from 'react';
import { RWANFTToken, RWAOwnershipHistory } from '../types/rwa';
import { tokenService } from '../services/tokenService';

export const useRWATokens = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getByRWAId = useCallback(async (rwaId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await tokenService.getByRWAId(rwaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar tokens');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getByOwner = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await tokenService.getByOwner(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar tokens do proprietário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOwnershipHistory = useCallback(async (tokenId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await tokenService.getOwnershipHistory(tokenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar histórico de propriedade');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const transfer = useCallback(async (tokenId: number, toUserId: number, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      return await tokenService.transfer(tokenId, toUserId, quantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao transferir token');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTokenMetadata = useCallback(async (tokenId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await tokenService.getTokenMetadata(tokenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar metadados do token');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getByRWAId,
    getByOwner,
    getOwnershipHistory,
    transfer,
    getTokenMetadata
  };
}; 
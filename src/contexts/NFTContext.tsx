import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { nftService, NFTToken } from '../services/nftService';
import { useAuth } from '../hooks';

interface NFTContextData {
  nfts: NFTToken[];
  loading: boolean;
  error: Error | null;
  refreshNFTs: () => Promise<void>;
  mintNFT: (data: { rwa_id: number; owner_wallet_address: string }) => Promise<void>;
  burnNFT: (token_identifier: string) => Promise<void>;
  transferNFT: (data: { token_identifier: string; to_wallet_address: string }) => Promise<void>;
}

const NFTContext = createContext<NFTContextData>({} as NFTContextData);

export const NFTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nfts, setNfts] = useState<NFTToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user, isAuthenticated } = useAuth();

  const refreshNFTs = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await nftService.getByOwnerId(user.id);
      setNfts(data);
    } catch (err) {
      setError(err as Error);
      console.error('[NFTContext] Erro ao carregar NFTs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshNFTs();
    } else {
      setNfts([]);
    }
  }, [isAuthenticated, user?.id, refreshNFTs]);

  const mintNFT = useCallback(async (data: { rwa_id: number; owner_wallet_address: string }) => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      setError(null);
      await nftService.mint(data);
      await refreshNFTs();
    } catch (err) {
      setError(err as Error);
      console.error('[NFTContext] Erro ao mintar NFT:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshNFTs, isAuthenticated]);

  const burnNFT = useCallback(async (token_identifier: string) => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      setError(null);
      await nftService.burn(token_identifier);
      await refreshNFTs();
    } catch (err) {
      setError(err as Error);
      console.error('[NFTContext] Erro ao queimar NFT:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshNFTs, isAuthenticated]);

  const transferNFT = useCallback(async (data: { token_identifier: string; to_wallet_address: string }) => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      setError(null);
      await nftService.transfer(data);
      await refreshNFTs();
    } catch (err) {
      setError(err as Error);
      console.error('[NFTContext] Erro ao transferir NFT:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshNFTs, isAuthenticated]);

  return (
    <NFTContext.Provider
      value={{
        nfts,
        loading,
        error,
        refreshNFTs,
        mintNFT,
        burnNFT,
        transferNFT
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) {
    throw new Error('useNFT deve ser usado dentro de um NFTProvider');
  }
  return context;
}; 
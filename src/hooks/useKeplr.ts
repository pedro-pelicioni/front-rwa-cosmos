import { useState, useCallback, useEffect } from 'react';
import { Window as KeplrWindow } from '@keplr-wallet/types';
import { authService } from '../services/auth';
import { useToast } from '@chakra-ui/react';

declare global {
  interface Window extends KeplrWindow {}
}

const COSMOS_CHAIN_ID = 'cosmoshub-4';

interface WalletState {
  address: string | null;
  name: string | null;
}

export const useKeplr = () => {
  const [walletState, setWalletState] = useState<WalletState>(() => {
    const savedState = localStorage.getItem('keplrWallet');
    return savedState ? JSON.parse(savedState) : { address: null, name: null };
  });
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Salva o estado da carteira no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('keplrWallet', JSON.stringify(walletState));
  }, [walletState]);

  const connect = useCallback(async () => {
    try {
      // Verifica se a Keplr está instalada
      if (typeof window.keplr === 'undefined') {
        throw new Error('Keplr wallet não está instalada. Por favor, instale a extensão Keplr.');
      }

      // Limpa o estado anterior
      setWalletState({ address: null, name: null });

      // Desativa a conexão atual para forçar a seleção de uma nova carteira
      try {
        await window.keplr.disable(COSMOS_CHAIN_ID);
      } catch (e) {
        // Ignora erros ao desativar, pois a carteira pode não estar conectada
        console.log('Erro ao desativar carteira anterior:', e);
      }

      // Solicita permissão para conectar e selecionar a conta
      await window.keplr.enable(COSMOS_CHAIN_ID);

      // Obtém o endereço da carteira
      const offlineSigner = window.keplr.getOfflineSigner(COSMOS_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada na Keplr');
      }

      const walletAddress = accounts[0].address;
      console.log('Endereço da carteira obtido:', walletAddress);

      // Obtém o nome da carteira
      const key = await window.keplr.getKey(COSMOS_CHAIN_ID);

      // Faz login no backend com o endereço da carteira
      try {
        if (!walletAddress) {
          throw new Error('Endereço da carteira não pode ser vazio');
        }

        await authService.loginWithWallet(walletAddress);
      } catch (err) {
        console.error('Erro ao fazer login no backend:', err);
        
        // Extrai a mensagem de erro do backend se disponível
        let errorMessage = 'Erro ao autenticar com o servidor';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as any;
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
        
        toast({
          title: 'Erro ao autenticar',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        throw err;
      }

      setWalletState({
        address: walletAddress,
        name: key.name
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com a Keplr');
      setWalletState({ address: null, name: null });
      throw err;
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    setWalletState({ address: null, name: null });
    setError(null);
    localStorage.removeItem('keplrWallet');
    
    // Tenta desativar a carteira no Keplr
    if (window.keplr) {
      try {
        window.keplr.disable(COSMOS_CHAIN_ID);
      } catch (e) {
        console.log('Erro ao desativar carteira:', e);
      }
    }
  }, []);

  return {
    connect,
    disconnect,
    walletAddress: walletState.address,
    walletName: walletState.name,
    error,
    isConnected: !!walletState.address,
  };
}; 
import { useState, useCallback } from 'react';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { authService } from '../services/auth';
import { useToast } from '@chakra-ui/react';
import { apiClient } from '../api/client';

interface KeplrWindow {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    getOfflineSigner: (chainId: string) => OfflineDirectSigner;
    disable: (chainId: string) => Promise<void>;
    experimentalSuggestChain: (chainInfo: any) => Promise<void>;
    signAmino: (chainId: string, signer: string, signDoc: any) => Promise<{ signature: any }>;
  };
}

declare global {
  interface Window extends KeplrWindow {}
}

const RPC_ENDPOINT = 'https://cosmos-rpc.polkachu.com';

export const useKeplr = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const toast = useToast();

  const getAddress = useCallback(async (): Promise<string> => {
    if (!window.keplr) {
      throw new Error('Keplr wallet not found');
    }

    const offlineSigner = window.keplr.getOfflineSigner('noble-1');
    const accounts = await offlineSigner.getAccounts();
    return accounts[0].address;
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!window.keplr) {
      throw new Error('Keplr wallet not found');
    }

    const offlineSigner = window.keplr.getOfflineSigner('noble-1');
    const accounts = await offlineSigner.getAccounts();
    const signDoc = {
      chain_id: '',
      account_number: '0',
      sequence: '0',
      fee: {
        amount: [],
        gas: '0'
      },
      msgs: [
        {
          type: 'sign/MsgSignData',
          value: {
            signer: accounts[0].address,
            data: btoa(unescape(encodeURIComponent(message)))
          }
        }
      ],
      memo: ''
    };

    // @ts-ignore
    const { signature } = await window.keplr.signAmino('noble-1', accounts[0].address, signDoc);
    return signature;
  }, []);

  const connect = useCallback(async (): Promise<{ token: string; user: { id: number; name: string; address: string; role: string } } | null> => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!window.keplr) {
        throw new Error('Keplr wallet not found');
      }

      // Solicitar conexão com a wallet
      await window.keplr.enable('noble-1');

      // Obter endereço da wallet
      const offlineSigner = window.keplr.getOfflineSigner('noble-1');
      const accounts = await offlineSigner.getAccounts();
      const address = accounts[0].address;

      setWalletAddress(address);
      setWalletName('Keplr');

      // Buscar nonce do backend
      const nonceResponse = await apiClient.get(`/api/auth/nonce?address=${address}`);
      const nonce = nonceResponse.data.nonce;
      
      // Criar mensagem para assinatura
      const message = `Autenticação RWA - Nonce: ${nonce}`;
      
      // Obter assinatura da mensagem
      const signature = await signMessage(message);

      // Fazer a chamada para o backend com todos os parâmetros necessários
      const response = await apiClient.post('/api/auth/wallet-login', {
        address,
        signature,
        nonce
      });

      // Use o token e user retornados do backend:
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [toast, signMessage]);

  const disconnect = useCallback(async (): Promise<boolean> => {
    try {
      setWalletAddress(null);
      setWalletName(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  }, [toast]);

  const getBalance = useCallback(async (): Promise<string> => {
    try {
      if (!window.keplr || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      const offlineSigner = window.keplr.getOfflineSigner('noble-1');
      const client = await SigningCosmWasmClient.connectWithSigner(
        'https://cosmos-rpc.polkachu.com',
        offlineSigner
      );

      const balance = await client.getBalance(walletAddress, 'uatom');
      return balance.amount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get balance';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return '0';
    }
  }, [walletAddress, toast]);

  return {
    isConnecting,
    error,
    connect,
    disconnect,
    getBalance,
    walletAddress,
    walletName,
    getAddress,
    signMessage
  };
}; 
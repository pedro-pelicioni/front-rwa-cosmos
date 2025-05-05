import { useState } from 'react';
import { useAuth } from './useAuth';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';

interface KeplrWindow {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    getOfflineSigner: (chainId: string) => OfflineDirectSigner;
    disable: (chainId: string) => Promise<void>;
  };
}

declare global {
  interface Window extends KeplrWindow {}
}

export const useNoble = () => {
  const { user, setUser } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    if (!window.keplr) {
      setError('Keplr não está instalado');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Força a desconexão antes de conectar novamente
      if (user) {
        await disconnect();
      }

      // Solicitar permissão para acessar a carteira
      await window.keplr.enable('noble-1');

      // Obter o endereço da carteira
      const offlineSigner = window.keplr.getOfflineSigner('noble-1');
      const accounts = await offlineSigner.getAccounts();

      if (accounts && accounts.length > 0) {
        setUser({
          address: accounts[0].address,
          walletType: 'noble',
          isConnected: true
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao conectar com Noble Wallet:', err);
      setError('Falha ao conectar com a carteira Noble');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (window.keplr) {
        // Desabilita a conexão com a chain
        await window.keplr.disable('noble-1');
      }
      setUser(null);
      return true;
    } catch (err) {
      console.error('Erro ao desconectar Noble Wallet:', err);
      setError('Falha ao desconectar da carteira Noble');
      return false;
    }
  };

  const getBalance = async () => {
    if (!user?.address) return null;

    try {
      const response = await fetch('https://noble-api.polkachu.com/cosmos/bank/v1beta1/balances/' + user.address);
      const data = await response.json();
      
      if (data.balances && data.balances.length > 0) {
        return data.balances[0].amount + ' ' + data.balances[0].denom;
      }
      
      return '0 unoble';
    } catch (err) {
      console.error('Erro ao obter saldo:', err);
      setError('Falha ao obter saldo da carteira');
      return null;
    }
  };

  return {
    isConnecting,
    error,
    connect,
    disconnect,
    getBalance
  };
}; 
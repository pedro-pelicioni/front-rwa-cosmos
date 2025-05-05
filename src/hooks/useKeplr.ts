import { useState } from 'react';
import { useAuth } from './useAuth';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';

interface KeplrWindow {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    getOfflineSigner: (chainId: string) => OfflineDirectSigner;
    disable: (chainId: string) => Promise<void>;
    experimentalSuggestChain: (chainInfo: any) => Promise<void>;
  };
}

declare global {
  interface Window extends KeplrWindow {}
}

const RPC_ENDPOINT = 'https://cosmos-rpc.polkachu.com';

export const useKeplr = () => {
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

      // Força a solicitação de permissão da extensão
      await window.keplr.enable('cosmoshub-4');

      // Obter o endereço da carteira
      const offlineSigner = window.keplr.getOfflineSigner('cosmoshub-4');
      const accounts = await offlineSigner.getAccounts();

      if (accounts && accounts.length > 0) {
        setUser({
          address: accounts[0].address,
          walletType: 'keplr',
          isConnected: true
        });
        return true; // Indica que a conexão foi bem sucedida
      }
      return false;
    } catch (err) {
      console.error('Erro ao conectar com Keplr:', err);
      setError('Falha ao conectar com a carteira Keplr');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (window.keplr) {
        // Desabilita a conexão com a chain
        await window.keplr.disable('cosmoshub-4');
        // Limpa o cache da carteira
        await window.keplr.experimentalSuggestChain({
          chainId: 'cosmoshub-4',
          chainName: 'Cosmos Hub',
          rpc: RPC_ENDPOINT,
          rest: 'https://cosmos-lcd.polkachu.com',
          bip44: {
            coinType: 118,
          },
          bech32Config: {
            bech32PrefixAccAddr: 'cosmos',
            bech32PrefixAccPub: 'cosmospub',
            bech32PrefixValAddr: 'cosmosvaloper',
            bech32PrefixValPub: 'cosmosvaloperpub',
            bech32PrefixConsAddr: 'cosmosvalcons',
            bech32PrefixConsPub: 'cosmosvalconspub',
          },
          currencies: [
            {
              coinDenom: 'ATOM',
              coinMinimalDenom: 'uatom',
              coinDecimals: 6,
            },
          ],
          feeCurrencies: [
            {
              coinDenom: 'ATOM',
              coinMinimalDenom: 'uatom',
              coinDecimals: 6,
            },
          ],
          stakeCurrency: {
            coinDenom: 'ATOM',
            coinMinimalDenom: 'uatom',
            coinDecimals: 6,
          },
          features: ['stargate', 'ibc-transfer', 'no-legacy-stdTx'],
        });
      }
      setUser(null);
      return true;
    } catch (err) {
      console.error('Erro ao desconectar Keplr:', err);
      setError('Falha ao desconectar da carteira Keplr');
      return false;
    }
  };

  const getBalance = async () => {
    if (!user?.address) return '0';

    try {
      const offlineSigner = window.keplr?.getOfflineSigner('cosmoshub-4');
      if (!offlineSigner) throw new Error('Keplr não está disponível');

      const client = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, offlineSigner);
      const balance = await client.getBalance(user.address, 'uatom');
      
      return balance.amount;
    } catch (err) {
      console.error('Erro ao buscar saldo:', err);
      return '0';
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
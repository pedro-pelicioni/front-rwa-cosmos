import { useState, useEffect } from 'react';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { useToast } from '@chakra-ui/react';
import { Buffer } from 'buffer';

interface KeplrKey {
  name: string;
  bech32Address: string;
  pubKey: string;
  algo: string;
}

interface KeplrSignature {
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
}

interface KeplrWallet {
  enable: (chainId: string) => Promise<void>;
  getKey: (chainId: string) => Promise<KeplrKey>;
  signArbitrary: (chainId: string, address: string, message: string) => Promise<KeplrSignature>;
  getOfflineSigner: (chainId: string) => Promise<OfflineDirectSigner>;
  experimentalSuggestChain: (chainInfo: any) => Promise<void>;
}

interface KeplrWalletWrapper {
  connect: () => Promise<string>;
  disconnect: () => Promise<boolean>;
  getAddress: () => Promise<string>;
  signMessage: (message: string) => Promise<KeplrSignature>;
  signArbitrary: (chainId: string, address: string, message: string) => Promise<string>;
}

declare global {
  interface Window {
    keplr?: KeplrWallet;
  }
}

const COSMOS_CHAIN_INFO = {
  chainId: 'neutron-1',
  chainName: 'Neutron',
  rpc: 'https://rpc.neutron-1.neutron.org',
  rest: 'https://api.neutron-1.neutron.org',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'neutron',
    bech32PrefixAccPub: 'neutronpub',
    bech32PrefixValAddr: 'neutronvaloper',
    bech32PrefixValPub: 'neutronvaloperpub',
    bech32PrefixConsAddr: 'neutronvalcons',
    bech32PrefixConsPub: 'neutronvalconspub',
  },
  currencies: [
    {
      coinDenom: 'NTRN',
      coinMinimalDenom: 'untrn',
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'NTRN',
      coinMinimalDenom: 'untrn',
      coinDecimals: 6,
    },
  ],
  stakeCurrency: {
    coinDenom: 'NTRN',
    coinMinimalDenom: 'untrn',
    coinDecimals: 6,
  },
  gasPriceStep: {
    low: 0.01,
    average: 0.025,
    high: 0.04,
  },
};

const RPC_ENDPOINT = COSMOS_CHAIN_INFO.rpc;

export const useKeplr = () => {
  const [keplr, setKeplr] = useState<KeplrWalletWrapper | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const initKeplr = async () => {
      try {
        if (!window.keplr) {
          console.error('[Keplr] Keplr não está instalado');
          return;
        }

        await window.keplr.experimentalSuggestChain(COSMOS_CHAIN_INFO);
        await window.keplr.enable(COSMOS_CHAIN_INFO.chainId);

        const key = await window.keplr.getKey(COSMOS_CHAIN_INFO.chainId);
        setWalletAddress(key.bech32Address);
        setWalletName(key.name);

        const keplrWallet: KeplrWalletWrapper = {
          connect: async () => {
            try {
              await window.keplr!.enable(COSMOS_CHAIN_INFO.chainId);
              const key = await window.keplr!.getKey(COSMOS_CHAIN_INFO.chainId);
              setWalletAddress(key.bech32Address);
              setWalletName(key.name);
              return key.bech32Address;
            } catch (error) {
              console.error('[Keplr] Erro ao conectar:', error);
              throw new Error('Falha ao conectar com Keplr');
            }
          },

          disconnect: async () => {
            try {
              setWalletAddress(null);
              setWalletName(null);
              return true;
            } catch (error) {
              console.error('[Keplr] Erro ao desconectar:', error);
              throw new Error('Falha ao desconectar Keplr');
            }
          },

          getAddress: async () => {
            try {
              const key = await window.keplr!.getKey(COSMOS_CHAIN_INFO.chainId);
              return key.bech32Address;
            } catch (error) {
              console.error('[Keplr] Erro ao obter endereço:', error);
              throw new Error('Falha ao obter endereço da carteira');
            }
          },

          signMessage: async (message: string) => {
            try {
              const address = await window.keplr!.getKey(COSMOS_CHAIN_INFO.chainId);
              const signature = await window.keplr!.signArbitrary(
                COSMOS_CHAIN_INFO.chainId,
                address.bech32Address,
                Buffer.from(message).toString('base64')
              );
              return signature;
            } catch (error) {
              console.error('[Keplr] Erro ao assinar mensagem:', error);
              throw new Error('Falha ao assinar mensagem');
            }
          },

          signArbitrary: async (chainId: string, address: string, message: string) => {
            try {
              const signature = await window.keplr!.signArbitrary(
                COSMOS_CHAIN_INFO.chainId,
                address,
                Buffer.from(message).toString('base64')
              );
              return signature.signature;
            } catch (error) {
              console.error('[Keplr] Erro ao assinar mensagem:', error);
              throw new Error('Falha ao assinar mensagem');
            }
          }
        };

        setKeplr(keplrWallet);
      } catch (error) {
        console.error('[Keplr] Erro ao inicializar:', error);
        setError('Falha ao inicializar Keplr');
      }
    };

    initKeplr();
  }, []);

  const connectKeplr = async (): Promise<string> => {
    if (!keplr) {
      throw new Error('Keplr não está instalado');
    }

    setIsConnecting(true);
    setError(null);

    try {
      const address = await keplr.connect();
      return address;
    } catch (error: any) {
      setError(error.message || 'Erro ao conectar com Keplr');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (): Promise<boolean> => {
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
  };

  const getBalance = async (): Promise<string> => {
    try {
      if (!window.keplr || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      const offlineSigner = await window.keplr.getOfflineSigner(COSMOS_CHAIN_INFO.chainId);
      const client = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
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
  };

  return {
    keplr,
    isConnecting,
    error,
    connectKeplr,
    disconnect,
    getBalance,
    walletAddress,
    walletName,
    getAddress: keplr?.getAddress,
    signMessage: keplr?.signMessage
  };
}; 
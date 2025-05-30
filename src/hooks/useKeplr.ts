import { useState, useEffect } from 'react';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { authService } from '../services/auth';
import { useToast } from '@chakra-ui/react';
import { apiClient } from '../api/client';
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
  signAmino: (chainId: string, address: string, signDoc: SignDoc) => Promise<KeplrSignature>;
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

interface SignDoc {
  chain_id: string;
  account_number: string;
  sequence: string;
  fee: {
    amount: any[];
    gas: string;
  };
  msgs: Array<{
    type: string;
    value: {
      signer: string;
      data: string;
    };
  }>;
  memo: string;
}

declare global {
  interface Window {
    keplr?: KeplrWallet;
  }
}

const COSMOS_CHAIN_INFO = {
  chainId: 'cosmoshub-4',
  chainName: 'Cosmos Hub',
  rpc: 'https://rpc-cosmoshub.keplr.app',
  rest: 'https://lcd-cosmoshub.keplr.app',
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
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'ATOM',
    coinMinimalDenom: 'uatom',
    coinDecimals: 6,
  },
  features: ['stargate', 'ibc-transfer', 'no-legacy-stdTx'],
  image: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
};

const RPC_ENDPOINT = COSMOS_CHAIN_INFO.rpc;

// Função auxiliar para calcular hash SHA-256 usando Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
              console.log('[Keplr] Iniciando conexão com Keplr');
              
              // Primeiro, sugerir a chain
              console.log('[Keplr] Sugerindo chain:', COSMOS_CHAIN_INFO);
              await window.keplr!.experimentalSuggestChain(COSMOS_CHAIN_INFO);
              
              // Depois, habilitar a chain
              console.log('[Keplr] Habilitando chain:', COSMOS_CHAIN_INFO.chainId);
              await window.keplr!.enable(COSMOS_CHAIN_INFO.chainId);
              
              // Obter a chave
              console.log('[Keplr] Obtendo chave da chain:', COSMOS_CHAIN_INFO.chainId);
              const key = await window.keplr!.getKey(COSMOS_CHAIN_INFO.chainId);
              console.log('[Keplr] Chave obtida:', key);
              
              setWalletAddress(key.bech32Address);
              setWalletName(key.name);
              return key.bech32Address;
            } catch (error) {
              console.error('[Keplr] Erro ao conectar:', error);
              if (error instanceof Error) {
                console.error('[Keplr] Stack trace:', error.stack);
              }
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
              console.log('[Keplr] Iniciando assinatura de mensagem:', { message });
              
              const key = await window.keplr!.getKey(COSMOS_CHAIN_INFO.chainId);
              console.log('[Keplr] Chave obtida:', { 
                bech32Address: key.bech32Address,
                pubKey: key.pubKey,
                algo: key.algo,
                name: key.name
              });

              // Criar a mensagem completa
              const mensagemCompleta = `Autenticação RWA - Nonce: ${message}`;
              console.log('[Keplr] Mensagem completa:', mensagemCompleta);

              // Converter a mensagem completa para base64
              const mensagemBase64 = Buffer.from(mensagemCompleta).toString('base64');
              console.log('[Keplr] Mensagem em base64:', mensagemBase64);

              // Criar o documento de assinatura no formato ADR-36
              const signDoc: SignDoc = {
                chain_id: "",
                account_number: "0",
                sequence: "0",
                fee: {
                  amount: [],
                  gas: "0"
                },
                msgs: [
                  {
                    type: "sign/MsgSignData",
                    value: {
                      signer: key.bech32Address,
                      data: mensagemBase64
                    }
                  }
                ],
                memo: ""
              };

              console.log('[Keplr] Documento de assinatura criado:', signDoc);

              // Serializar o documento
              const serializedSignDoc = JSON.stringify(signDoc);
              const hashHex = await sha256(serializedSignDoc);

              console.log('[Keplr] Documento serializado:', {
                serialized: serializedSignDoc,
                hashHex
              });

              // Assinar o documento usando signAmino
              const signature = await window.keplr!.signAmino(
                COSMOS_CHAIN_INFO.chainId,
                key.bech32Address,
                signDoc
              );

              console.log('[Keplr] Assinatura obtida:', { 
                signature: signature.signature,
                pub_key: signature.pub_key
              });

              const pubKey = key.pubKey;
              if (!pubKey) {
                console.error('[Keplr] Chave pública não encontrada');
                throw new Error('Chave pública não encontrada');
              }

              // Converter a chave pública para base64
              const pubKeyBase64 = Buffer.from(pubKey).toString('base64');
              console.log('[Keplr] Chave pública em base64:', pubKeyBase64);

              // Retornar a assinatura com a chave pública no formato correto
              const result = {
                signature: signature.signature,
                pub_key: {
                  type: 'tendermint/PubKeySecp256k1',
                  value: pubKeyBase64
                },
                // Adicionar dados de debug
                debug: {
                  serializedSignDoc,
                  hashHex,
                  mensagemCompleta,
                  mensagemBase64
                }
              };

              // Verificação final do objeto
              if (!result.pub_key.value) {
                console.error('[Keplr] Objeto final com chave pública inválida:', result);
                throw new Error('Chave pública inválida no objeto final');
              }

              // Log do objeto final para debug
              console.log('[Keplr] Objeto de assinatura final:', result);

              return result;
            } catch (error) {
              console.error('[Keplr] Erro ao assinar mensagem:', error);
              if (error instanceof Error) {
                console.error('[Keplr] Stack trace:', error.stack);
              }
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
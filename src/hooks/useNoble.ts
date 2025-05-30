import { useState } from 'react';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { authService } from '../services/auth';

interface KeplrWindow {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    getOfflineSigner: (chainId: string) => OfflineDirectSigner;
    disable: (chainId: string) => Promise<void>;
    signAmino: (chainId: string, signer: string, signDoc: any) => Promise<{ signature: any }>;
  };
}

declare global {
  interface Window extends KeplrWindow {}
}

export const useNoble = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signMessage = async (message: string, address: string): Promise<{ signature: string, pub_key: { type: string, value: string }, debug?: any }> => {
    if (!window.keplr) {
      throw new Error('Keplr não está instalado');
    }

    try {
      console.log('[Noble] Iniciando assinatura do nonce:', message);
      
      // Garante que a mensagem está em UTF-8
      const messageBytes = new TextEncoder().encode(message);
      const base64Message = btoa(String.fromCharCode(...messageBytes));
      
      console.log('[Noble] Mensagem em base64:', base64Message);

      const signDoc = {
        chain_id: '',
        account_number: '0',
        sequence: '0',
        fee: {
          amount: [],
          gas: '0',
        },
        msgs: [
          {
            type: 'sign/MsgSignData',
            value: {
              signer: address,
              data: base64Message,
            },
          },
        ],
        memo: '',
      };

      console.log('[Noble] Documento de assinatura:', signDoc);

      const result = await window.keplr.signAmino(
        'noble-1',
        address,
        signDoc
      );

      console.log('[Noble] Assinatura gerada:', result.signature);
      // O retorno de signAmino pode variar, garantir que result.signature é objeto
      const sig = typeof result.signature === 'string' ? JSON.parse(result.signature) : result.signature;
      const keplrSignature = {
        signature: sig.signature,
        pub_key: sig.pub_key,
        debug: result,
      };
      return keplrSignature;
    } catch (err) {
      console.error('[Noble] Erro ao assinar mensagem:', err);
      throw new Error('Falha ao assinar mensagem: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const connect = async () => {
    if (!window.keplr) {
      setError('Keplr não está instalado');
      console.error('[Noble] Keplr não está instalado');
      return null;
    }

    setIsConnecting(true);
    setError(null);
    console.log('[Noble] Iniciando conexão...');

    try {
      await window.keplr.enable('noble-1');
      console.log('[Noble] Permissão concedida pela extensão.');

      const offlineSigner = window.keplr.getOfflineSigner('noble-1');
      const signer = await offlineSigner;
      const accounts = await signer.getAccounts();
      console.log('[Noble] Contas obtidas:', accounts);

      if (accounts && accounts.length > 0) {
        const address = accounts[0].address;
        console.log('[Noble] Endereço da carteira:', address);
        
        const nonce = await authService.getNonce(address);
        console.log('[Noble] Nonce recebido do backend:', nonce);
        
        const signature = await signMessage(nonce, address);
        console.log('[Noble] Assinatura do nonce:', signature);
        
        const authResponse = await authService.loginWithWallet(address, signature, nonce);
        console.log('[Noble] Resposta do backend após login:', authResponse);
        
        return authResponse;
      }
      console.error('[Noble] Nenhuma conta encontrada.');
      return null;
    } catch (err) {
      console.error('[Noble] Erro ao conectar com Noble Wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao conectar com a carteira Noble';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
      console.log('[Noble] Fim do processo de conexão.');
    }
  };

  const disconnect = async () => {
    try {
      if (window.keplr) {
        // await window.keplr.disable('noble-1');
      }
      authService.logout();
      return true;
    } catch (err) {
      console.error('Erro ao desconectar Noble Wallet:', err);
      setError('Falha ao desconectar da carteira Noble');
      return false;
    }
  };

  const getBalance = async (address: string) => {
    if (!address) return null;

    try {
      const response = await fetch('https://noble-api.polkachu.com/cosmos/bank/v1beta1/balances/' + address);
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
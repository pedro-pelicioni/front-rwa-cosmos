import { useState } from 'react';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { authService } from '../services/auth';

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
  const [isConnected, setIsConnected] = useState(false);

  const signMessage = async (message: string, address: string): Promise<string> => {
    if (!window.keplr) {
      console.error('[Keplr] Keplr não está instalado');
      throw new Error('Keplr não está instalado');
    }

    try {
      console.log('[Keplr] --- INÍCIO DA ASSINATURA DO NONCE ---');
      console.log('[Keplr] Nonce recebido para assinar:', message);
      // Garante que a mensagem está em UTF-8
      const messageBytes = new TextEncoder().encode(message);
      const base64Message = btoa(String.fromCharCode(...messageBytes));
      console.log('[Keplr] Nonce em base64:', base64Message);

      const signDoc = {
        chain_id: '', // ADR-36 requer chain_id vazio
        account_number: '0',
        sequence: '0',
        fee: {
          amount: [], // ADR-36 exige array vazio
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
      console.log('[Keplr] Documento de assinatura (signDoc):', JSON.stringify(signDoc, null, 2));

      const { signature } = await window.keplr.signAmino(
        'cosmoshub-4',
        address,
        signDoc
      );
      console.log('[Keplr] Assinatura retornada pelo Keplr:', signature);
      console.log('[Keplr] --- FIM DA ASSINATURA DO NONCE ---');
      return JSON.stringify(signature);
    } catch (err) {
      console.error('[Keplr] Erro ao assinar mensagem:', err);
      throw new Error('Falha ao assinar mensagem: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const connect = async () => {
    if (!window.keplr) {
      setError('Keplr não está instalado');
      console.error('[Keplr] Keplr não está instalado');
      return null;
    }

    setIsConnecting(true);
    setError(null);
    console.log('[Keplr] --- INÍCIO DO FLUXO DE LOGIN ---');

    try {
      if (isConnected) {
        console.log('[Keplr] Já estava conectado, desconectando antes...');
        await disconnect();
      }

      await window.keplr.enable('cosmoshub-4');
      console.log('[Keplr] Permissão concedida pela extensão.');

      const offlineSigner = window.keplr.getOfflineSigner('cosmoshub-4');
      const accounts = await offlineSigner.getAccounts();
      console.log('[Keplr] Contas obtidas:', accounts);

      if (accounts && accounts.length > 0) {
        const address = accounts[0].address;
        setWalletAddress(address);
        setWalletName(null);
        console.log('[Keplr] Endereço da carteira:', address);
        
        const nonce = await authService.getNonce(address);
        console.log('[Keplr] Nonce recebido do backend:', nonce);
        
        const signature = await signMessage(nonce, address);
        console.log('[Keplr] Assinatura do nonce (string JSON):', signature);
        
        const authResponse = await authService.loginWithWallet(address, signature, nonce);
        console.log('[Keplr] Resposta do backend após login:', authResponse);
        
        setIsConnected(true);
        console.log('[Keplr] --- LOGIN FINALIZADO COM SUCESSO ---');
        return authResponse;
      }
      console.error('[Keplr] Nenhuma conta encontrada.');
      return null;
    } catch (err) {
      console.error('[Keplr] Erro ao conectar com Keplr:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao conectar com a carteira Keplr';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
      console.log('[Keplr] --- FIM DO FLUXO DE LOGIN ---');
    }
  };

  const disconnect = async () => {
    try {
      if (window.keplr) {
        await window.keplr.disable('cosmoshub-4');
      }
      authService.logout();
      setWalletAddress(null);
      setWalletName(null);
      setIsConnected(false);
      return true;
    } catch (err) {
      console.error('Erro ao desconectar Keplr:', err);
      setError('Falha ao desconectar da carteira Keplr');
      return false;
    }
  };

  const getBalance = async () => {
    if (!walletAddress) return '0';

    try {
      const offlineSigner = window.keplr?.getOfflineSigner('cosmoshub-4');
      if (!offlineSigner) throw new Error('Keplr não está disponível');

      const client = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, offlineSigner);
      const balance = await client.getBalance(walletAddress, 'uatom');
      
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
    getBalance,
    walletAddress,
    walletName,
    isConnected
  };
}; 
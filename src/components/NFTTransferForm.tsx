import React, { useState } from 'react';
import { useNFT } from '../contexts/NFTContext';
import { useToast } from '../hooks/useToast';

export const NFTTransferForm: React.FC = () => {
  const [tokenId, setTokenId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const { transferNFT } = useNFT();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenId || !toAddress) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    try {
      await transferNFT({
        token_identifier: tokenId,
        to_wallet_address: toAddress
      });
      showToast('NFT transferido com sucesso!', 'success');
      setTokenId('');
      setToAddress('');
    } catch (error) {
      showToast('Erro ao transferir NFT. Tente novamente.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700">
          ID do Token
        </label>
        <input
          type="text"
          id="tokenId"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="toAddress" className="block text-sm font-medium text-gray-700">
          Endereço de Destino
        </label>
        <input
          type="text"
          id="toAddress"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Transferir NFT
      </button>
    </form>
  );
}; 
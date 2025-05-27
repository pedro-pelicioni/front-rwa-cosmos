import React, { useState } from 'react';
import { useNFT } from '../contexts/NFTContext';
import { useToast } from '../hooks/useToast';

export const NFTBurnForm: React.FC = () => {
  const [tokenId, setTokenId] = useState('');
  const [confirmBurn, setConfirmBurn] = useState(false);
  const { burnNFT } = useNFT();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenId) {
      showToast('Digite o ID do token', 'error');
      return;
    }

    if (!confirmBurn) {
      showToast('Confirme a queima do token', 'error');
      return;
    }

    try {
      await burnNFT(tokenId);
      showToast('NFT queimado com sucesso!', 'success');
      setTokenId('');
      setConfirmBurn(false);
    } catch (error) {
      showToast('Erro ao queimar NFT. Tente novamente.', 'error');
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

      <div className="flex items-center">
        <input
          type="checkbox"
          id="confirmBurn"
          checked={confirmBurn}
          onChange={(e) => setConfirmBurn(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="confirmBurn" className="ml-2 block text-sm text-gray-900">
          Confirmo que desejo queimar este token. Esta ação não pode ser desfeita.
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Queimar NFT
      </button>
    </form>
  );
}; 
import React, { useState } from 'react';
import { useNFT } from '../contexts/NFTContext';
import { useToast } from '../hooks/useToast';

export const NFTMintForm: React.FC = () => {
  const [rwaId, setRwaId] = useState<number>();
  const [walletAddress, setWalletAddress] = useState('');
  const { mintNFT } = useNFT();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rwaId || !walletAddress) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    try {
      await mintNFT({
        rwa_id: rwaId,
        owner_wallet_address: walletAddress
      });
      showToast('NFT mintado com sucesso!', 'success');
      setRwaId(undefined);
      setWalletAddress('');
    } catch (error) {
      showToast('Erro ao mintar NFT. Tente novamente.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rwaId" className="block text-sm font-medium text-gray-700">
          ID do RWA
        </label>
        <input
          type="number"
          id="rwaId"
          value={rwaId || ''}
          onChange={(e) => setRwaId(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
          Endereço da Carteira
        </label>
        <input
          type="text"
          id="walletAddress"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Mintar NFT
      </button>
    </form>
  );
}; 
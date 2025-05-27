import React, { useState } from 'react';
import { NFTToken } from '../services/nftService';
import { useNFT } from '../contexts/NFTContext';
import { useToast } from '../hooks/useToast';
import { isValidWalletAddress } from '../utils/walletUtils';

interface NFTActionsProps {
  nft: NFTToken;
}

type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

export const NFTActions: React.FC<NFTActionsProps> = ({ nft }) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferStatus, setTransferStatus] = useState<TransactionStatus>('idle');
  const [burnStatus, setBurnStatus] = useState<TransactionStatus>('idle');
  const { burnNFT, transferNFT } = useNFT();
  const { showToast } = useToast();

  const handleBurn = async () => {
    try {
      setBurnStatus('pending');
      await burnNFT(nft.token_identifier);
      setBurnStatus('success');
      showToast('NFT queimado com sucesso!', 'success');
      setShowBurnModal(false);
    } catch (error) {
      setBurnStatus('error');
      showToast('Erro ao queimar NFT. Tente novamente.', 'error');
    } finally {
      setTimeout(() => setBurnStatus('idle'), 3000);
    }
  };

  const handleTransfer = async () => {
    if (!isValidWalletAddress(transferAddress)) {
      showToast('Endereço de carteira inválido', 'error');
      return;
    }

    try {
      setTransferStatus('pending');
      await transferNFT({
        token_identifier: nft.token_identifier,
        to_wallet_address: transferAddress
      });
      setTransferStatus('success');
      showToast('NFT transferido com sucesso!', 'success');
      setShowTransferModal(false);
      setTransferAddress('');
    } catch (error) {
      setTransferStatus('error');
      showToast('Erro ao transferir NFT. Tente novamente.', 'error');
    } finally {
      setTimeout(() => setTransferStatus('idle'), 3000);
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setShowTransferModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Transferir
        </button>
        <button
          onClick={() => setShowBurnModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Queimar
        </button>
      </div>

      {/* Modal de Transferência */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Transferir NFT</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="transferAddress" className="block text-sm font-medium text-gray-700">
                  Endereço de Destino
                </label>
                <input
                  type="text"
                  id="transferAddress"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0x..."
                />
                {transferAddress && !isValidWalletAddress(transferAddress) && (
                  <p className="mt-1 text-sm text-red-600">
                    Endereço de carteira inválido
                  </p>
                )}
              </div>

              {transferStatus !== 'idle' && (
                <div className={`p-2 rounded ${getStatusColor(transferStatus)} text-white text-center`}>
                  {transferStatus === 'pending' && 'Processando transferência...'}
                  {transferStatus === 'success' && 'Transferência concluída!'}
                  {transferStatus === 'error' && 'Erro na transferência'}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferAddress('');
                    setTransferStatus('idle');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferStatus === 'pending' || !isValidWalletAddress(transferAddress)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Queima */}
      {showBurnModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Queimar NFT</h3>
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Atenção: Esta ação não pode ser desfeita
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Ao queimar este NFT, ele será permanentemente removido da blockchain.
                        Certifique-se de que esta é a ação desejada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {burnStatus !== 'idle' && (
                <div className={`p-2 rounded ${getStatusColor(burnStatus)} text-white text-center`}>
                  {burnStatus === 'pending' && 'Processando queima...'}
                  {burnStatus === 'success' && 'NFT queimado com sucesso!'}
                  {burnStatus === 'error' && 'Erro ao queimar NFT'}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowBurnModal(false);
                    setBurnStatus('idle');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBurn}
                  disabled={burnStatus === 'pending'}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Queima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
import React, { useEffect } from 'react';
import { Box, Container, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { useNFT } from '../contexts/NFTContext';
import { NFTGrid } from '../components/NFTGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const NFTList: React.FC = () => {
  const { nfts, loading, error, refreshNFTs } = useNFT();

  useEffect(() => {
    refreshNFTs();
  }, [refreshNFTs]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Erro ao carregar NFTs</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Meus NFTs
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <a
            href="/nfts/mint"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Mintar Novo NFT
          </a>
        </div>
      </div>

      <div className="mt-8">
        {nfts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum NFT encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece mintando seu primeiro NFT.
            </p>
            <div className="mt-6">
              <a
                href="/nfts/mint"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Mintar NFT
              </a>
            </div>
          </div>
        ) : (
          <NFTGrid nfts={nfts} />
        )}
      </div>
    </div>
  );
}; 
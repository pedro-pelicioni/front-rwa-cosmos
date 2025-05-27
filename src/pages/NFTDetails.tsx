import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { nftService, NFTToken } from '../services/nftService';
import { NFTDetails as NFTDetailsComponent } from '../components/NFTDetails';
import { NFTActions } from '../components/NFTActions';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Box, Container, Heading, Text, Image, Button, VStack, HStack, Badge, Divider, Spinner } from '@chakra-ui/react';
import { useNFT } from '../contexts/NFTContext';

export const NFTDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nft, setNft] = useState<NFTToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadNFT = async () => {
      try {
        setLoading(true);
        const data = await nftService.getById(Number(id));
        setNft(data);
      } catch (err) {
        setError(err as Error);
        console.error('[NFTDetailsPage] Erro ao carregar NFT:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNFT();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !nft) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Erro ao carregar NFT</h2>
        <p className="mt-2 text-gray-600">
          {error?.message || 'NFT não encontrado'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Detalhes do NFT
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <NFTDetailsComponent nft={nft} />
        <NFTActions nft={nft} />
      </div>
    </div>
  );
}; 
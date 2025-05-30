import React, { useEffect, useState } from 'react';
import {
  Box,
  Image,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FaHeart, FaShare, FaEdit } from 'react-icons/fa';
import { TokenListing } from '../services/marketplaceService';
import { useRWAImages } from '../hooks/useRWAImages';
import { useNavigate } from 'react-router-dom';

interface MarketplaceCardProps {
  listing: TokenListing;
  onBuy?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
}

export function MarketplaceCard({
  listing,
  onBuy,
  onEdit,
  onFavorite,
  onShare,
}: MarketplaceCardProps) {
  const navigate = useNavigate();
  // Fundo azul escuro e texto branco
  const bgColor = '#003366';
  const borderColor = 'transparent';
  const textColor = 'white';

  const { getByRWAId } = useRWAImages();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchImage() {
      if (listing.nftToken?.rwa?.images && listing.nftToken.rwa.images.length > 0) {
        setImageUrl(listing.nftToken.rwa.images[0]);
      } else if (listing.nftToken?.rwa?.id) {
        const images = await getByRWAId(listing.nftToken.rwa.id);
        if (isMounted && images && images.length > 0) {
          setImageUrl(images[0].image_data || images[0].file_path || images[0].cid_link || '/placeholder-property.jpg');
        } else if (isMounted) {
          setImageUrl('/placeholder-property.jpg');
        }
      } else {
        setImageUrl('/placeholder-property.jpg');
      }
    }
    fetchImage();
    return () => { isMounted = false; };
  }, [listing.nftToken?.rwa?.id, getByRWAId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'sold':
        return 'red';
      case 'cancelled':
        return 'gray';
      case 'expired':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Nome do imóvel
  const propertyName = listing.nftToken?.rwa?.name || `Token #${listing.nft_token_id}`;

  // Localização
  let location = 'Location not available';
  if ('city' in (listing.nftToken?.rwa || {}) || 'country' in (listing.nftToken?.rwa || {})) {
    const city = (listing.nftToken?.rwa as any).city;
    const country = (listing.nftToken?.rwa as any).country;
    location = [city, country].filter(Boolean).join(', ');
  } else if (listing.nftToken?.rwa?.location) {
    location = listing.nftToken.rwa.location;
  }

  // Preço do token
  let tokenPrice = null;
  if (listing.nftToken?.rwa?.current_value && listing.nftToken.rwa.total_tokens) {
    const value = Number(listing.nftToken.rwa.current_value);
    const tokens = Number(listing.nftToken.rwa.total_tokens);
    if (!isNaN(value) && !isNaN(tokens) && tokens > 0) {
      tokenPrice = value / tokens;
    }
  }

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth="0"
      borderColor={borderColor}
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
    >
      <Box position="relative">
        <Image
          src={imageUrl ?? '/placeholder-property.jpg'}
          alt={propertyName}
          height="200px"
          width="100%"
          objectFit="cover"
        />
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme={getStatusColor(listing.listing_status)}
          px={2}
          py={1}
          borderRadius="full"
        >
          {listing.listing_status}
        </Badge>
        <HStack 
          position="absolute" 
          bottom={2} 
          right={2} 
          spacing={2}
          bg="rgba(0, 0, 0, 0.5)"
          p={1}
          borderRadius="md"
        >
          <Tooltip label="Add to favorites">
            <IconButton
              aria-label="Add to favorites"
              icon={<FaHeart />}
              variant="ghost"
              onClick={onFavorite}
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            />
          </Tooltip>
          <Tooltip label="Share property">
            <IconButton
              aria-label="Share property"
              icon={<FaShare />}
              variant="ghost"
              onClick={onShare}
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            />
          </Tooltip>
        </HStack>
      </Box>

      <VStack p={4} align="stretch" spacing={3} color={textColor} bg={bgColor}>
        <Text fontSize="xl" fontWeight="bold" noOfLines={1} color={textColor}>
          {propertyName}
        </Text>
        <Text fontSize="sm" color={textColor}>
          Token: {listing.nftToken?.token_identifier}
        </Text>
        <Text color={textColor} noOfLines={2}>
          {location}
        </Text>

        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            Token Price: {tokenPrice !== null ? `$${tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'N/A'}
          </Text>
          <Text fontSize="sm" color={textColor}>
            {listing.nftToken?.rwa?.total_tokens || 1} tokens
          </Text>
        </HStack>

        <HStack spacing={2} mt={2}>
          <Button
            flex={1}
            colorScheme="orange"
            onClick={onBuy}
            isDisabled={listing.listing_status !== 'active'}
          >
            Buy Now
          </Button>
          <Button
            flex={1}
            variant="outline"
            colorScheme="whiteAlpha"
            onClick={() => navigate(`/assets/${listing.nftToken?.rwa?.id}`)}
          >
            Details
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
} 
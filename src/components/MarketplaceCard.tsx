import React from 'react';
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
  // Fundo azul escuro e texto branco
  const bgColor = '#003366';
  const borderColor = 'transparent';
  const textColor = 'white';

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

  const property = listing.nftToken?.rwa;
  const imageUrl = property?.images?.[0] || '/placeholder-property.jpg';

  // Nome do imóvel
  const propertyName = property?.name || `Token #${listing.nft_token_id}`;

  // Localização
  let location = 'Location not available';
  if ('city' in (property || {}) || 'country' in (property || {})) {
    const city = (property as any).city;
    const country = (property as any).country;
    location = [city, country].filter(Boolean).join(', ');
  } else if (property?.location) {
    location = property.location;
  }

  // Preço do token
  let tokenPrice = null;
  if (property?.current_value && property?.total_tokens) {
    const value = Number(property.current_value);
    const tokens = Number(property.total_tokens);
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
          src={imageUrl}
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
            {property?.total_tokens || 1} tokens
          </Text>
        </HStack>

        <HStack spacing={2} mt={2}>
          <Button
            flex={1}
            colorScheme="blue"
            onClick={onBuy}
            isDisabled={listing.listing_status !== 'active'}
          >
            Buy Now
          </Button>
          
          {onEdit && (
            <IconButton
              aria-label="Edit property"
              icon={<FaEdit />}
              onClick={onEdit}
              variant="ghost"
            />
          )}
        </HStack>

        <HStack justify="flex-end" spacing={2}>
          <Tooltip label="Add to favorites">
            <IconButton
              aria-label="Add to favorites"
              icon={<FaHeart />}
              variant="ghost"
              onClick={onFavorite}
            />
          </Tooltip>
          <Tooltip label="Share property">
            <IconButton
              aria-label="Share property"
              icon={<FaShare />}
              variant="ghost"
              onClick={onShare}
            />
          </Tooltip>
        </HStack>
      </VStack>
    </Box>
  );
} 
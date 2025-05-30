import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Center,
  Spinner,
  Text,
  useToast,
  Flex,
  Button,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';
import { marketplaceService, TokenListing } from '../services/marketplaceService';
import { MarketplaceFilters } from '../components/MarketplaceFilters';
import { MarketplaceCard } from '../components/MarketplaceCard';
import { EmptyState } from '../components/EmptyState';
import { InvestmentModal } from '../components/InvestmentModal';
import { debounce } from 'lodash';

interface MarketplaceResponse {
  listings: TokenListing[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function MarketplacePage() {
  const [filters, setFilters] = useState<any>({});
  const [listings, setListings] = useState<TokenListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<TokenListing | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadListings = useCallback(async () => {
    if (isRetrying) return;
    
    setLoading(true);
    setError(null);
    try {
      const results = await marketplaceService.searchListings(filters) as TokenListing[] | MarketplaceResponse;
      setListings(Array.isArray(results) ? results : results.listings || []);
    } catch (err) {
      setError('Error loading properties');
      toast({
        title: 'Error loading properties',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [filters, isRetrying, toast]);

  // Debounce the loadListings function
  const debouncedLoadListings = useCallback(
    debounce(() => {
      loadListings();
    }, 500),
    [loadListings]
  );

  useEffect(() => {
    debouncedLoadListings();
    return () => {
      debouncedLoadListings.cancel();
    };
  }, [filters, debouncedLoadListings]);

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  const handleBuy = (listing: TokenListing) => {
    setSelectedListing(listing);
    onOpen();
  };

  const handleEdit = (listing: TokenListing) => {
    toast({
      title: 'Edit functionality coming soon',
      status: 'info',
      duration: 3000,
    });
  };

  const handleFavorite = (listing: TokenListing) => {
    toast({
      title: 'Added to favorites',
      status: 'success',
      duration: 3000,
    });
  };

  const handleShare = (listing: TokenListing) => {
    if (navigator.share) {
      navigator.share({
        title: listing.nftToken?.rwa?.name || `Token #${listing.nft_token_id}`,
        text: `Check out this property: ${listing.nftToken?.rwa?.name || `Token #${listing.nft_token_id}`}`,
        url: window.location.href,
      });
    } else {
      toast({
        title: 'Share link copied to clipboard',
        status: 'success',
        duration: 3000,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading>Real Estate Marketplace</Heading>
        <Button 
          colorScheme="blue" 
          onClick={() => {
            setIsRetrying(true);
            loadListings();
          }}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>

      <MarketplaceFilters onChange={handleFiltersChange} />

      {loading ? (
        <Center py={20}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
        </Center>
      ) : error ? (
        <Center py={20}>
          <Text color="red.500" fontSize="lg">{error}</Text>
        </Center>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="Try adjusting your filters or check back later for new listings"
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mt={8}>
          {listings.map(listing => (
            <MarketplaceCard
              key={listing.id}
              listing={listing}
              onBuy={() => handleBuy(listing)}
              onEdit={() => handleEdit(listing)}
              onFavorite={() => handleFavorite(listing)}
              onShare={() => handleShare(listing)}
            />
          ))}
        </SimpleGrid>
      )}

      {selectedListing && (
        <InvestmentModal
          isOpen={isOpen}
          onClose={onClose}
          listing={selectedListing}
          onSuccess={() => {
            onClose();
            loadListings();
            toast({
              title: 'Investment successful',
              status: 'success',
              duration: 5000,
            });
          }}
        />
      )}
    </Container>
  );
} 
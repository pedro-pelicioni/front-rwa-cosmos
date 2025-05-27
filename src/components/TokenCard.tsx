import { Box, Text, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

interface TokenCardProps {
  listing: any;
}

export default function TokenCard({ listing }: TokenCardProps) {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Text fontWeight="bold">Imóvel: {listing.nftToken?.rwa_id}</Text>
      <Text>Token ID: {listing.nft_token_id}</Text>
      <Text>Preço atual: ${listing.current_price}</Text>
      <Text>Status: {listing.listing_status}</Text>
      <Button as={Link} to={`/available-sales/${listing.id}`} mt={2} colorScheme="blue">
        Ver Detalhes
      </Button>
    </Box>
  );
} 
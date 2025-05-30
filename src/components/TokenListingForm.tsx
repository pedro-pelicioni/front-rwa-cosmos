import { useState, FormEvent } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import { Box, Input, Button, FormControl, FormLabel } from '@chakra-ui/react';

interface TokenListingFormProps {
  nftTokenId: number | string;
  onSuccess: () => void;
}

export default function TokenListingForm({ nftTokenId, onSuccess }: TokenListingFormProps) {
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [originalDate, setOriginalDate] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await marketplaceService.createListing({
      nft_token_id: typeof nftTokenId === 'string' ? parseInt(nftTokenId, 10) : nftTokenId,
      current_price: Number(price),
      original_purchase_price: Number(originalPrice),
      original_purchase_date: originalDate,
      available_until: availableUntil,
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <FormControl mb={2}>
        <FormLabel>Preço de venda</FormLabel>
        <Input value={price} onChange={e => setPrice(e.target.value)} type="number" required />
      </FormControl>
      <FormControl mb={2}>
        <FormLabel>Preço de compra original</FormLabel>
        <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} type="number" required />
      </FormControl>
      <FormControl mb={2}>
        <FormLabel>Data de compra original</FormLabel>
        <Input value={originalDate} onChange={e => setOriginalDate(e.target.value)} type="date" required />
      </FormControl>
      <FormControl mb={2}>
        <FormLabel>Disponível até</FormLabel>
        <Input value={availableUntil} onChange={e => setAvailableUntil(e.target.value)} type="date" />
      </FormControl>
      <Button type="submit" isLoading={loading} colorScheme="green">Colocar à venda</Button>
    </Box>
  );
} 
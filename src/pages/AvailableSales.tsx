import { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, VStack, Button, HStack, Divider } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Sale {
  id: number;
  token_id: number;
  quantity: number;
  price_per_token: number;
  seller_id: number;
  status: string;
}

export const AvailableSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/api/rwa/tokens/sale/available')
      .then(res => setSales(res.data))
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box p={8}>
      <Heading mb={6}>Tokens Disponíveis para Investir</Heading>
      {loading ? <Spinner /> : (
        sales.length === 0 ? <Text>Nenhum token disponível para compra.</Text> :
        <VStack align="stretch" spacing={4}>
          {sales.map(sale => (
            <Box key={sale.id} p={4} borderWidth={1} borderRadius="md" bg="gray.50">
              <HStack justify="space-between">
                <Box>
                  <Text><b>Token ID:</b> {sale.token_id}</Text>
                  <Text><b>Quantidade:</b> {sale.quantity}</Text>
                  <Text><b>Preço por token:</b> ${sale.price_per_token}</Text>
                  <Text><b>Status:</b> {sale.status}</Text>
                </Box>
                <Button colorScheme="blue" onClick={() => navigate(`/confirm-investment/${sale.id}`)}>
                  Investir agora
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}; 
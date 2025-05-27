import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { Box, Heading, Text, Spinner, Button, VStack, HStack, Alert, AlertIcon, Divider, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Input, FormControl, FormLabel } from '@chakra-ui/react';
import TokenPriceChart from '../components/TokenPriceChart';

interface Sale {
  id: number;
  token: any;
  seller: any;
  buyer: any;
  quantity: number;
  price_per_token: number;
  total_price: number;
  status: string;
  expires_at: string;
  transaction_hash?: string;
  signature?: string;
}

export function AvailableSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    marketplaceService.listAvailable()
      .then(res => setSales(res.data))
      .catch(() => {
        setSales([]);
        toast({ title: 'Erro ao carregar vendas disponíveis', status: 'error' });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <Box>
      <Heading mb={4}>Tokens à Venda</Heading>
      {loading ? <Spinner /> : (
        <VStack align="stretch" spacing={4}>
          {sales.length === 0 ? <Text>Nenhum token disponível para venda.</Text> :
            sales.map(sale => (
              <Box key={sale.id} borderWidth="1px" borderRadius="lg" p={4}>
                <Text><b>Imóvel:</b> {sale.token?.rwa_id}</Text>
                <Text><b>Token ID:</b> {sale.token?.id}</Text>
                <Text><b>Quantidade:</b> {sale.quantity}</Text>
                <Text><b>Preço por token:</b> ${sale.price_per_token}</Text>
                <Text><b>Preço total:</b> ${sale.total_price}</Text>
                <Text><b>Status:</b> {sale.status}</Text>
                <Button mt={2} colorScheme="blue" as="a" href={`/available-sales/${sale.id}`}>Ver Detalhes</Button>
              </Box>
            ))}
        </VStack>
      )}
    </Box>
  );
}

export function AvailableSalesDetail() {
  const { listing_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    marketplaceService.getSale(Number(listing_id))
      .then(res => setSale(res.data))
      .catch(() => setError('Erro ao carregar detalhes da venda.'))
      .finally(() => setLoading(false));
  }, [listing_id]);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await marketplaceService.cancelSale(Number(listing_id));
      setSale(sale ? { ...sale, status: 'cancelled' } : sale);
      toast({ title: 'Venda cancelada', status: 'success' });
    } catch {
      setError('Erro ao cancelar venda.');
      toast({ title: 'Erro ao cancelar', status: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuy = async () => {
    setBuyLoading(true);
    // Aqui você pode chamar o endpoint de confirmação de compra
    setTimeout(() => {
      setBuyLoading(false);
      setIsBuyOpen(false);
      toast({ title: 'Compra realizada com sucesso!', status: 'success' });
      setSale(sale ? { ...sale, status: 'sold' } : sale);
    }, 1500);
  };

  if (loading) return <Spinner />;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (!sale) return <Text>Venda não encontrada.</Text>;

  return (
    <Box>
      <Heading mb={2}>Detalhes da Venda do Token</Heading>
      <Text><b>Imóvel:</b> {sale.token?.rwa_id}</Text>
      <Text><b>Token ID:</b> {sale.token?.id}</Text>
      <Text><b>Quantidade:</b> {sale.quantity}</Text>
      <Text><b>Preço por token:</b> ${sale.price_per_token}</Text>
      <Text><b>Preço total:</b> ${sale.total_price}</Text>
      <Text><b>Status:</b> {sale.status}</Text>
      <Text><b>Vendedor:</b> {sale.seller?.name || sale.seller?.id}</Text>
      <Text><b>Comprador:</b> {sale.buyer?.name || '-'}</Text>
      <Text><b>Expira em:</b> {sale.expires_at}</Text>
      {sale.transaction_hash && <Text><b>Hash da transação:</b> {sale.transaction_hash}</Text>}
      <Divider my={4} />
      <HStack spacing={4} mt={4}>
        <Button colorScheme="green" isDisabled={sale.status !== 'pending'} onClick={() => setIsBuyOpen(true)}>Comprar</Button>
        <Button colorScheme="red" onClick={handleCancel} isLoading={actionLoading} isDisabled={sale.status !== 'pending'}>Cancelar Venda</Button>
        <Button variant="outline" onClick={() => navigate('/available-sales')}>Voltar</Button>
      </HStack>

      {/* Modal de Compra */}
      <Modal isOpen={isBuyOpen} onClose={() => setIsBuyOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Compra</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Deseja comprar este token por <b>${sale.total_price}</b>?</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={handleBuy} isLoading={buyLoading}>Confirmar</Button>
            <Button variant="ghost" onClick={() => setIsBuyOpen(false)}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 
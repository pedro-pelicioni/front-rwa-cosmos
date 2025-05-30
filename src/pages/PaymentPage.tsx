import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  useToast,
  Image,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react';
import { useKeplr } from '../hooks/useKeplr';
import { useAuth } from '../hooks';
import { tokenService } from '../services/tokenService';
import { rwaService } from '../services/rwaService';
import { marketplaceService } from '../services/marketplaceService';
import { apiClient } from '../api/client';

export const PaymentPage = () => {
  // Hooks sempre no topo!
  const auth = useAuth();
  const user = auth.user;
  const token = (auth as any).token;
  const { signMessage, getAddress } = useKeplr();
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Redireciona imediatamente se não estiver logado
  if (!user) {
    toast({
      title: 'Login Required',
      description: 'Please login to continue with the purchase.',
      status: 'warning',
      duration: 4000,
      isClosable: true,
    });
    return <Navigate to="/login" replace />;
  }

  const { rwaId, tokenId, quantity, pricePerToken } = params;

  // LOG: parâmetros recebidos
  console.log('[PaymentPage] Parâmetros recebidos:', { rwaId, tokenId, quantity, pricePerToken });

  // Validação dos parâmetros
  const rwaIdNum = Number(rwaId);
  const tokenIdNum = Number(tokenId);
  const quantityNum = Number(quantity);
  const pricePerTokenNum = Number(pricePerToken);

  // LOG: parâmetros convertidos
  console.log('[PaymentPage] Parâmetros convertidos:', { rwaIdNum, tokenIdNum, quantityNum, pricePerTokenNum });

  if (
    isNaN(rwaIdNum) ||
    isNaN(tokenIdNum) ||
    isNaN(quantityNum) ||
    isNaN(pricePerTokenNum)
  ) {
    return (
      <Container centerContent py={10}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Invalid Parameters</AlertTitle>
          <AlertDescription>
            One or more parameters are invalid. Please go back and try again.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetInfo, setAssetInfo] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [saleInfo, setSaleInfo] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar listing do marketplace
        const listings = await marketplaceService.listAvailable();
        // LOG: listings retornados com detalhes
        console.log('[PaymentPage] Listings retornados (detalhado):', JSON.stringify(listings.data, null, 2));
        // LOG: tokenIdNum procurado
        console.log('[PaymentPage] Procurando tokenIdNum:', tokenIdNum);
        
        // Ajustando a lógica de busca para ser mais flexível
        const listing = listings.data.find((l: any) => {
          console.log('[PaymentPage] Verificando listing:', {
            tokenId: l.token?.id,
            tokenIdNum: tokenIdNum,
            match: l.token && (Number(l.token.id) === tokenIdNum || l.token.id === tokenIdNum.toString())
          });
          return l.token && (Number(l.token.id) === tokenIdNum || l.token.id === tokenIdNum.toString());
        });
        
        // LOG: resultado do find
        console.log('[PaymentPage] Listing encontrado:', listing);

        // Verificar se o token existe
        if (!listing) {
          // Verificar se o token existe em algum outro lugar
          try {
            const tokens = await tokenService.getByRWAId(rwaIdNum);
            console.log('[PaymentPage] Tokens do RWA:', tokens);
            const tokenObj = tokens.find(t => t.id === tokenIdNum);
            if (tokenObj) {
              // Se o usuário for o owner, não pode comprar
              if (tokenObj.owner_user_id === user.id) {
                setError(`You are the owner of token ${tokenIdNum} and cannot purchase it.`);
                return;
              }
              // Criar um listing temporário para permitir a venda
              const tempListing = {
                id: -1,
                token_id: tokenObj.id,
                seller_id: tokenObj.owner_user_id,
                buyer_id: null,
                quantity: 1,
                price_per_token: pricePerTokenNum.toString(),
                transaction_hash: null,
                signature: null,
                status: 'available',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                token: tokenObj,
                seller: { id: tokenObj.owner_user_id, email: '', wallet_address: '', created_at: '', updated_at: '' }
              };
              setTokenInfo(tokenObj);
              setSaleInfo(tempListing);
              // prosseguir normalmente
            } else {
              setError(`Token ${tokenIdNum} not found. Available tokens: ${listings.data.map((l: any) => l.token.id).join(', ')}`);
              return;
            }
          } catch (err: any) {
            console.error('[PaymentPage] Erro ao verificar token:', err);
            setError(`Token ${tokenIdNum} not found or is not available for purchase. Error: ${err.message}`);
            return;
          }
        } else {
          // Verificar se o token está disponível para venda
          if (listing.status !== 'available' && listing.status !== 'pending') {
            setError(`Token ${tokenIdNum} is not available for purchase at the moment. Current status: ${listing.status}`);
            return;
          }
          // Se o usuário for o owner, não pode comprar
          if (listing.token?.owner_user_id === user.id) {
            setError(`You are the owner of token ${tokenIdNum} and cannot purchase it.`);
            return;
          }
          setTokenInfo(listing.token);
          setSaleInfo(listing);
        }

        // Buscar asset pelo rwaId
        const asset = await rwaService.getById(rwaIdNum);
        // LOG: asset retornado
        console.log('[PaymentPage] Asset retornado:', asset);
        setAssetInfo(asset);
        // Buscar imagens do imóvel
        try {
          const imagesRes = await apiClient.get(`/api/rwa/images/rwa/${asset.id}`);
          const images = imagesRes.data;
          // LOG: imagens retornadas
          console.log('[PaymentPage] Imagens retornadas:', images);
          if (Array.isArray(images) && images.length > 0) {
            setMainImage(images[0].cid_link || images[0].file_path || images[0].image_data || '');
          }
        } catch (e) {
          // fallback para asset.images ou asset.metadata.images
          const metaImages = Array.isArray(asset?.metadata?.images) ? asset.metadata?.images : [];
          // LOG: fallback imagens
          console.log('[PaymentPage] Fallback imagens:', { metaImages });
          if (metaImages.length > 0) {
            setMainImage(metaImages[0]);
          } else {
            setMainImage('https://placehold.co/280x160?text=No+Image');
          }
        }
      } catch (err) {
        console.error('[PaymentPage] Erro ao carregar dados:', err);
        setError('Error loading payment information');
        toast({
          title: 'Error',
          description: 'Failed to load payment information',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rwaIdNum, tokenIdNum, toast]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      // 1. Transferir o token diretamente
      const response = await apiClient.post(`/api/rwa/tokens/${tokenIdNum}/transfer`, {
        pricePerToken: pricePerTokenNum,
        quantity: quantityNum
      });
      
      if (response.data) {
        toast({
          title: 'Success',
          description: 'Token transferred successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/wallet');
      } else {
        throw new Error('Failed to transfer token');
      }
    } catch (err) {
      console.error('Erro na transferência:', err);
      setError('Error processing transfer');
      toast({
        title: 'Error',
        description: 'Failed to process token transfer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container centerContent py={10}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const totalAmount = pricePerTokenNum * quantityNum;

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="center">
        {/* Card principal com imagem e infos do imóvel */}
        <Flex direction={isMobile ? 'column' : 'row'} w="100%" gap={8} align="stretch" justify="center">
          {/* Imagem do imóvel */}
          <Box flex={1} bg="white" borderRadius="2xl" boxShadow="2xl" p={0} display="flex" alignItems="center" justifyContent="center" minW="320px" maxW="420px" minH="260px">
            <Image
              src={mainImage}
              alt={assetInfo?.name || 'Property'}
              w="100%"
              h="260px"
              objectFit="cover"
              borderRadius="2xl"
              fallbackSrc="https://placehold.co/420x260?text=No+Image"
            />
          </Box>

          {/* Informações do imóvel */}
          <Box flex={1}>
            <Card variant="outline" w="100%">
              <CardHeader>
                <Heading size="md">{assetInfo?.name}</Heading>
                <Text color="gray.500">{assetInfo?.location}</Text>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Text><b>Token ID:</b> {tokenInfo?.token_identifier || tokenInfo?.id}</Text>
                  <Text><b>Quantity:</b> {quantityNum}</Text>
                  <Text><b>Price per token:</b> ${pricePerTokenNum}</Text>
                  <Divider />
                  <Text fontSize="xl"><b>Total:</b> ${totalAmount}</Text>
                </VStack>
              </CardBody>
              <CardFooter>
                <Button
                  colorScheme="blue"
                  size="lg"
                  w="100%"
                  onClick={handlePayment}
                  isLoading={processing}
                  loadingText="Processing..."
                >
                  Confirm Purchase
                </Button>
              </CardFooter>
            </Card>
          </Box>
        </Flex>
      </VStack>
    </Container>
  );
}; 
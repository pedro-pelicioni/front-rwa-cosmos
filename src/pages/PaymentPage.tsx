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
import { useAuth } from '../hooks/useAuth';
import { tokenService } from '../services/tokenService';
import { rwaService } from '../services/rwaService';
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
      title: 'Login necessário',
      description: 'Faça login para continuar com a compra.',
      status: 'warning',
      duration: 4000,
      isClosable: true,
    });
    return <Navigate to="/login" replace />;
  }

  const { rwaId, tokenId, quantity, pricePerToken } = params;

  // Validação dos parâmetros
  const rwaIdNum = Number(rwaId);
  const tokenIdNum = Number(tokenId);
  const quantityNum = Number(quantity);
  const pricePerTokenNum = Number(pricePerToken);

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
          <AlertTitle>Invalid parameters</AlertTitle>
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
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [saleInfo, setSaleInfo] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar asset pelo rwaId
        const asset = await rwaService.getById(rwaIdNum);
        setAssetInfo(asset);
        // Buscar todos os tokens do asset
        const tokens = await tokenService.getByRWAId(asset.id);
        const token = tokens.find((t: any) => t.id === tokenIdNum);
        if (!token) {
          setError('Token not found');
          return;
        }
        setTokenInfo(token);
        // Buscar imagens do imóvel pelo endpoint correto
        let img = '';
        try {
          const imagesRes = await apiClient.get(`/api/rwa/images/rwa/${asset.id}`);
          const images = imagesRes.data;
          if (Array.isArray(images) && images.length > 0) {
            img = images[0].cid_link || images[0].file_path || images[0].image_data || '';
          }
        } catch (e) {
          // fallback para asset.images ou asset.metadata.images
          const metaImages = Array.isArray(asset?.metadata?.images) ? asset.metadata.images : [];
          const assetImages = Array.isArray(asset?.images) ? asset.images : [];
          if (metaImages.length > 0) {
            img = metaImages[0];
          } else if (assetImages.length > 0) {
            img = assetImages[0];
          }
        }
        setMainImage(img || 'https://placehold.co/280x160?text=No+Image');
        // Buscar info do vendedor (KYC se possível), sempre autenticado se possível
        let seller = null;
        const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        try {
          const kycRes = await apiClient.get(`/api/kyc/${token.owner_user_id}`, authHeaders);
          seller = kycRes.data;
        } catch (e) {
          try {
            const userRes = await apiClient.get(`/api/users/${token.owner_user_id}`, authHeaders);
            seller = userRes.data;
          } catch (e2) {
            seller = null;
          }
        }
        setSellerInfo(seller);
      } catch (err) {
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
  }, [rwaIdNum, tokenIdNum, toast, token]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      // 1. Iniciar processo de venda
      const sale = await tokenService.initiateSale(
        tokenIdNum,
        quantityNum,
        pricePerTokenNum
      );
      setSaleInfo(sale);
      // 2. Obter endereço da wallet
      const walletAddress = await getAddress();
      // 3. Criar mensagem para assinatura
      const message = `Confirm purchase of ${quantityNum} tokens from ${tokenInfo.token_identifier} for ${pricePerTokenNum * quantityNum} USD`;
      // 4. Obter assinatura
      const signature = await signMessage(message);
      // 5. Confirmar venda
      const confirmedSale = await tokenService.confirmSale(
        sale.id,
        '0x0000000000000000000000000000000000000000000000000000000000000000', // txHash simulado
        signature
      );
      if (confirmedSale.status === 'completed') {
        toast({
          title: 'Success',
          description: 'Token purchase completed successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/wallet');
      } else {
        throw new Error('Sale was not completed');
      }
    } catch (err) {
      setError('Error processing payment');
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Se houver uma venda pendente, tenta cancelá-la
      if (saleInfo?.id) {
        try {
          await tokenService.cancelSale(saleInfo.id);
        } catch (cancelErr) {
          console.error('Failed to cancel sale:', cancelErr);
        }
      }
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
          <AlertTitle>Error</AlertTitle>
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
              alt={assetInfo?.name || 'Asset'}
              w="100%"
              h="260px"
              objectFit="cover"
              borderRadius="2xl"
              fallbackSrc="https://placehold.co/420x260?text=No+Image"
            />
          </Box>
          {/* Infos do imóvel */}
          <Box flex={2} bg="white" borderRadius="2xl" boxShadow="2xl" p={8} minW="320px" maxW="600px" display="flex" flexDirection="column" justifyContent="center">
            <Heading size="lg" color="blue.800" mb={2}>{assetInfo?.name || 'Imóvel'}</Heading>
            <Text color="gray.500" fontSize="md" mb={2}>{assetInfo?.description || 'Sem descrição.'}</Text>
            {/* Exemplo de tags, pode ser adaptado */}
            {assetInfo?.city && (
              <Text color="blue.600" fontWeight="bold" fontSize="sm" mb={1}>{assetInfo.city}, {assetInfo.country}</Text>
            )}
            {/* Outras infos do asset podem ser adicionadas aqui */}
          </Box>
        </Flex>
        {/* Cards de compra, vendedor e comprador */}
        <Flex direction={isMobile ? 'column' : 'row'} gap={6} w="100%" justify="center">
          {/* Seller */}
          <Box flex={1} bgGradient="linear(to-br, #e3f0ff, #b3cfff)" borderRadius="xl" p={7} boxShadow="md" textAlign="center" minW="220px" maxW="260px" display="flex" flexDirection="column" alignItems="center" overflow="hidden">
            <Avatar size="xl" mb={2} />
            <Text fontWeight="bold" fontSize="lg" color="blue.700" mb={1}>Seller</Text>
            <Text fontWeight="bold" color="gray.700" noOfLines={1} maxW="180px" mx="auto">{sellerInfo?.name || sellerInfo?.fullName || sellerInfo?.nome || 'Not available'}</Text>
            <Text fontSize="sm" color="gray.500" wordBreak="break-all" noOfLines={2} maxW="180px" mx="auto">{tokenInfo?.owner_address || sellerInfo?.address || sellerInfo?.wallet_address || 'Not available'}</Text>
          </Box>
          {/* Purchase Details */}
          <Box flex={1.2} bgGradient="linear(to-br, #e3f0ff, #b3cfff)" borderRadius="xl" p={8} boxShadow="lg" borderWidth="3px" borderColor="blue.200" textAlign="center" minW="260px" maxW="320px" display="flex" flexDirection="column" alignItems="center" justifyContent="center" overflow="hidden">
            <Box mb={2}>
              <Avatar bg="blue.100" icon={<svg width="32" height="32" fill="#2b6cb0" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>} size="lg" mb={1} />
            </Box>
            <Text fontWeight="bold" fontSize="lg" color="blue.700" mb={2}>Purchase Summary</Text>
            <Text color="gray.900">Token ID: <b>{tokenInfo?.token_identifier || tokenIdNum}</b></Text>
            <Text color="gray.900">Quantity: <b>{quantityNum}</b></Text>
            <Text color="gray.900">Price per Token: <b style={{ color: '#2b6cb0' }}>${pricePerTokenNum}</b></Text>
            <Text fontWeight="bold" color="green.600" fontSize="xl" mt={2}>Total: ${totalAmount}</Text>
          </Box>
          {/* Buyer */}
          <Box flex={1} bgGradient="linear(to-br, #e3f0ff, #b3cfff)" borderRadius="xl" p={7} boxShadow="md" textAlign="center" minW="220px" maxW="260px" display="flex" flexDirection="column" alignItems="center" overflow="hidden">
            <Avatar size="xl" mb={2} />
            <Text fontWeight="bold" fontSize="lg" color="blue.700" mb={1}>Buyer</Text>
            <Text fontWeight="bold" color="gray.700" noOfLines={1} maxW="180px" mx="auto">{(user as any)?.name || (user as any)?.fullName || (user as any)?.nome || 'Not logged in'}</Text>
            <Text fontSize="sm" color="gray.500" wordBreak="break-all" noOfLines={2} maxW="180px" mx="auto">{user?.address || (user as any)?.wallet_address || 'Not logged in'}</Text>
          </Box>
        </Flex>
        <Box w="100%" maxW="520px">
          <Button
            colorScheme="orange"
            width="100%"
            onClick={handlePayment}
            isLoading={processing}
            loadingText="Processing..."
            isDisabled={!user?.isConnected}
            fontSize="xl"
            py={7}
            borderRadius="xl"
            mt={4}
            boxShadow="xl"
          >
            Finalizar compra
          </Button>
          <Text color="gray.400" fontSize="sm" textAlign="center" mt={2}>
            Transação protegida pela blockchain. Seu investimento é seguro.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}; 
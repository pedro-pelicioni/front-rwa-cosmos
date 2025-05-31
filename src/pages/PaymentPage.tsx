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
import { authService } from '../services/auth';
import { userService } from '../services/userService';
import { kycService } from '../services/kycService';
import { FaIdCard, FaWallet, FaUser, FaLock } from 'react-icons/fa';

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
  const [buyerKYC, setBuyerKYC] = useState<any>(null);
  const [buyerWallet, setBuyerWallet] = useState<string | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [sellerKYC, setSellerKYC] = useState<any>(null);
  const [sellerWallet, setSellerWallet] = useState<string | null>(null);

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
            console.error('[PaymentPage] Error checking token:', err);
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

        // Buscar dados do comprador (usuário logado)
        if (user?.id) {
          kycService.getStatus().then((kyc) => {
            console.log('[PaymentPage] Buyer KYC:', kyc);
            setBuyerKYC(kyc);
          });
          console.log('[PaymentPage] Buyer wallet:', user.address || null);
          setBuyerWallet(user.address || null);
        }
        // Buscar dados do vendedor
        const sellerId = saleInfo?.seller_id || tokenInfo?.owner_user_id;
        if (sellerId) {
          userService.getById(sellerId).then((sellerData) => {
            console.log('[PaymentPage] Seller user:', sellerData);
            setSeller(sellerData);
          });
          kycService.getByUserId(sellerId).then((kyc) => {
            console.log('[PaymentPage] Seller KYC:', kyc);
            setSellerKYC(kyc);
          });
          userService.getById(sellerId).then((u) => {
            console.log('[PaymentPage] Seller wallet:', u.address || null);
            setSellerWallet(u.address || null);
          });
        }
      } catch (err) {
        console.error('[PaymentPage] Error loading data:', err);
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
      
      // Verificar se o token existe
      const token = authService.getToken();
      if (!token) {
        toast({
          title: 'Erro de autenticação',
          description: 'Por favor, faça login novamente',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
        return;
      }

      // 1. Transferir o token diretamente
      const response = await apiClient.post(`/api/rwa/tokens/${tokenIdNum}/transfer`, {
        pricePerToken: pricePerTokenNum,
        quantity: quantityNum
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
        throw new Error('Falha ao transferir token');
      }
    } catch (err) {
      console.error('Erro na transferência:', err);
      setError('Erro ao processar transferência');
      toast({
        title: 'Erro',
        description: 'Falha ao processar transferência do token',
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

  // Card do comprador
  const buyerCard = (
    <Card bg="white" boxShadow="lg" borderRadius="2xl" mb={4} p={0}>
      <CardBody p={4}>
        <HStack spacing={4}>
          <Avatar name={user?.name || buyerKYC?.nome || 'Buyer'} size="lg" bg="blue.500" color="white" icon={<FaUser />} />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="lg">{user?.name || buyerKYC?.nome || 'Not available'}</Text>
            <Text fontSize="sm" color="gray.500">Buyer</Text>
            <HStack fontSize="sm" color="gray.600">
              <FaIdCard />
              <Text ml={1}>CPF: {buyerKYC?.cpf || 'Not available'}</Text>
            </HStack>
            <HStack fontSize="sm" color="gray.600">
              <FaWallet />
              <Text ml={1} wordBreak="break-all">{buyerWallet || 'Not available'}</Text>
            </HStack>
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  );

  // Card do vendedor
  const sellerCard = (
    <Card bg="white" boxShadow="lg" borderRadius="2xl" mb={4} p={0}>
      <CardBody p={4}>
        <HStack spacing={4}>
          <Avatar name={seller?.name || sellerKYC?.nome || 'Seller'} size="lg" bg="red.500" color="white" icon={<FaUser />} />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="lg">{seller?.name || sellerKYC?.nome || 'Not available'}</Text>
            <Text fontSize="sm" color="gray.500">Seller</Text>
            <HStack fontSize="sm" color="gray.600">
              <FaIdCard />
              <Text ml={1}>CPF: {sellerKYC?.cpf || 'Not available'}</Text>
            </HStack>
            <HStack fontSize="sm" color="gray.600">
              <FaWallet />
              <Text ml={1} wordBreak="break-all">{sellerWallet || 'Not available'}</Text>
            </HStack>
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  );

  // Card de taxa da plataforma
  const platformFee = 0.01 * (pricePerTokenNum * quantityNum);
  const platformFeeCard = (
    <Card bg="white" boxShadow="lg" borderRadius="2xl" mb={4} p={0}>
      <CardBody p={4}>
        <HStack spacing={3} align="center">
          <Box flex={1}>
            <Text fontWeight="bold" fontSize="md">Platform Fee</Text>
            <Text color="gray.600" fontSize="sm">A fee charged by the platform for this transaction.</Text>
          </Box>
          <Text fontSize="xl" fontWeight="bold" color="orange.500">${platformFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </HStack>
      </CardBody>
    </Card>
  );

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="center" w="100%">
        <Heading size="lg" color="gray.700" mb={2} fontWeight="extrabold">Review and Confirm your Purchase</Heading>
        <Flex direction={isMobile ? 'column' : 'row'} w="100%" gap={8} align="flex-start" justify="center">
          {/* Coluna da imagem e cards de usuário */}
          <VStack flex={1} spacing={4} align="stretch">
            <Box bg="white" borderRadius="2xl" boxShadow="2xl" p={0} display="flex" alignItems="center" justifyContent="center" minW="320px" maxW="420px" minH="260px">
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
            {buyerCard}
            {sellerCard}
            {platformFeeCard}
          </VStack>

          {/* Coluna dos detalhes da compra */}
          <Box flex={1}>
            <Card variant="outline" w="100%" bg="white" boxShadow="xl" borderRadius="2xl">
              <CardHeader pb={0}>
                <Heading size="md">{assetInfo?.name}</Heading>
                <Text color="gray.500">{assetInfo?.location}</Text>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Text><b>Token ID:</b> {tokenInfo?.token_identifier || tokenInfo?.id}</Text>
                  <Text><b>Quantity:</b> {quantityNum}</Text>
                  <Text><b>Price per token:</b> ${pricePerTokenNum}</Text>
                  <Divider />
                  <Text fontSize="xl"><b>Total:</b> ${totalAmount}</Text>
                </VStack>
              </CardBody>
              <CardFooter>
                <Button
                  colorScheme="orange"
                  size="lg"
                  w="100%"
                  leftIcon={<FaLock />}
                  onClick={handlePayment}
                  isLoading={processing}
                  loadingText="Processing..."
                  fontWeight="bold"
                  fontSize="lg"
                  borderRadius="xl"
                  boxShadow="md"
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
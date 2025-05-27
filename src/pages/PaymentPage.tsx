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
          <AlertTitle>Parâmetros inválidos</AlertTitle>
          <AlertDescription>
            Um ou mais parâmetros são inválidos. Por favor, volte e tente novamente.
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
        const listing = listings.data.find((l: any) => l.token?.id === tokenIdNum);
        
        if (!listing) {
          setError('Token não encontrado ou não está disponível para venda');
          return;
        }

        // Buscar asset pelo rwaId
        const asset = await rwaService.getById(rwaIdNum);
        setAssetInfo(asset);
        setTokenInfo(listing.token);
        setSaleInfo(listing);

        // Buscar imagens do imóvel
        try {
          const imagesRes = await apiClient.get(`/api/rwa/images/rwa/${asset.id}`);
          const images = imagesRes.data;
          if (Array.isArray(images) && images.length > 0) {
            setMainImage(images[0].cid_link || images[0].file_path || images[0].image_data || '');
          }
        } catch (e) {
          // fallback para asset.images ou asset.metadata.images
          const metaImages = Array.isArray(asset?.metadata?.images) ? asset.metadata.images : [];
          const assetImages = Array.isArray(asset?.images) ? asset.images : [];
          if (metaImages.length > 0) {
            setMainImage(metaImages[0]);
          } else if (assetImages.length > 0) {
            setMainImage(assetImages[0]);
          } else {
            setMainImage('https://placehold.co/280x160?text=No+Image');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar informações do pagamento');
        toast({
          title: 'Erro',
          description: 'Falha ao carregar informações do pagamento',
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
          title: 'Sucesso',
          description: 'Compra do token realizada com sucesso',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/wallet');
      } else {
        throw new Error('Venda não foi completada');
      }
    } catch (err) {
      console.error('Erro no pagamento:', err);
      setError('Erro ao processar pagamento');
      toast({
        title: 'Erro',
        description: 'Falha ao processar pagamento',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Se houver uma venda pendente, tenta cancelá-la
      if (saleInfo?.id) {
        try {
          await tokenService.cancelSale(saleInfo.id);
        } catch (cancelErr) {
          console.error('Falha ao cancelar venda:', cancelErr);
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
              alt={assetInfo?.name || 'Imóvel'}
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
                  <Text><b>Quantidade:</b> {quantityNum}</Text>
                  <Text><b>Preço por token:</b> ${pricePerTokenNum}</Text>
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
                  loadingText="Processando..."
                >
                  Confirmar Compra
                </Button>
              </CardFooter>
            </Card>
          </Box>
        </Flex>
      </VStack>
    </Container>
  );
}; 
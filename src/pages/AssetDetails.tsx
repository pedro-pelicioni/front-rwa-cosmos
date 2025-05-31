import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Heading, Text, Button, Grid, GridItem, Flex, 
  Image, Badge, HStack, VStack, Divider, Tabs, TabList, Tab, 
  TabPanels, TabPanel, SimpleGrid, Tag, Stat, StatLabel, 
  StatNumber, StatHelpText, useDisclosure, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, NumberInput, NumberInputField,
  FormControl, FormLabel, useToast, Spinner, Stack, IconButton,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaCoins, FaFileAlt, FaUserAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { Property } from '../types/Property';
import { useAuth } from '../hooks';
import { useProperty } from '../hooks/useProperty';
import { imageService } from '../services/imageService';
import { RWAImage } from '../types/rwa';
import { LatamMap } from '../components/LatamMap';
import { tokenService } from '../services/tokenService';
import { RWANFTToken } from '../types/rwa';
import { getImageFromIDB, setImageToIDB } from '../utils/imageIDBCache';
import { useRWATokens } from '../hooks/useRWATokens';
import { marketplaceService } from '../services/marketplaceService';
import { apiClient } from '../api/client';
import { CreateProperty } from './CreateProperty';
import { getTransferHistoryLink } from '../constants/transferHistoryLinks';

// Hook customizado para gerenciar o carregamento do asset
const useAssetLoader = (id: string | undefined) => {
  const [state, setState] = useState({
    property: null as Property | null,
    images: [] as RWAImage[],
    isLoading: true,
    error: null as string | null,
    isInitialLoad: true
  });

  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const fetchData = useCallback(async () => {
    // Se for criação, não buscar nada!
    if (!id || id === 'new') {
      setState({
        property: null,
        images: [],
        isLoading: false,
        error: null,
        isInitialLoad: false
      });
      return;
    }

    // Cancela requisição anterior se existir
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Busca o property
      const response = await apiClient.get(`/api/rwa/${id}`, {
        signal: abortController.current.signal
      });
      
      if (!isMounted.current) return;

      const propertyData = response.data?.data || response.data;
      
      // Busca as imagens
      const images = await imageService.getByRWAId(parseInt(id, 10));
      
      if (!isMounted.current) return;

      // Atualiza o estado com todos os dados
      setState({
        property: {
          ...propertyData,
          metadata: {
            ...propertyData.metadata,
            images: images.map(img => img.image_data || img.file_path || img.cid_link || '')
          }
        },
        images,
        isLoading: false,
        error: null,
        isInitialLoad: false
      });

      // Reseta o contador de retry em caso de sucesso
      retryCount.current = 0;

    } catch (err: any) {
      if (!isMounted.current) return;
      
      // Ignora erros de cancelamento
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        return;
      }

      // Tenta novamente se não excedeu o limite de retries
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setTimeout(fetchData, 1000 * retryCount.current); // Backoff exponencial
        return;
      }

      console.error('[useAssetLoader] Erro após tentativas:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar detalhes do imóvel',
        isInitialLoad: false
      }));
    }
  }, [id]);

  useEffect(() => {
    isMounted.current = true;
    retryCount.current = 0;
    fetchData();

    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchData]);

  return state;
};

export const AssetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Usa o hook customizado para carregar os dados
  const { property, images, isLoading, error, isInitialLoad } = useAssetLoader(id);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [tokensToInvest, setTokensToInvest] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [nftTokens, setNftTokens] = useState<RWANFTToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [creatingTokens, setCreatingTokens] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<RWANFTToken | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tokenToEdit, setTokenToEdit] = useState<RWANFTToken | null>(null);
  const [editMetadataUri, setEditMetadataUri] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { getOwnershipHistory } = useRWATokens();
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [ownershipHistory, setOwnershipHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);

  // Buscar tokens NFT do asset
  useEffect(() => {
    if (!property?.id) return;
    
    const fetchTokens = async () => {
      setLoadingTokens(true);
      try {
        const response = await tokenService.getByRWAId(
          typeof property.id === 'string' ? parseInt(property.id, 10) : property.id
        );
        setNftTokens(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('[fetchTokens] Erro:', err);
        setNftTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    };
    fetchTokens();
  }, [property?.id]);

  // Buscar vendas ativas do marketplace
  useEffect(() => {
    if (!property?.id) return;
    
    const fetchListings = async () => {
      try {
        const res = await marketplaceService.listAvailable();
        setMarketplaceListings(res.data || []);
      } catch (err) {
        console.error('[fetchListings] Erro:', err);
        setMarketplaceListings([]);
      }
    };
    fetchListings();
  }, [property?.id]);

  const handleInvestment = () => {
    // Encontrar o primeiro token NFT disponível para o imóvel que NÃO pertence ao usuário logado
    const token = nftTokens.length > 0
      ? nftTokens.find(t => t.owner_user_id !== userIdNum)
      : null;
    if (!token || !property) {
      toast({
        title: 'No NFT tokens available for investment',
        description: 'Todos os tokens disponíveis pertencem a você. Não é possível investir neste imóvel.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    const pricePerToken = tokenPriceNum || (property.currentValue ?? property.price ?? 0) / totalTokensNum;
    navigate(`/payment/${property.id}/${token.id}/${tokensToInvestNum}/${pricePerToken}`);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Garantir que property.id e user.id são number
  const propertyIdNum = typeof property?.id === 'string' ? parseInt(property.id, 10) : property?.id ?? 0;
  const userIdNum = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id ?? 0;

  // Função para criar tokens NFT restantes
  const handleCreateTokens = async () => {
    if (!property || !user) return;
    setCreatingTokens(true);
    try {
      const total = typeof property.totalTokens === 'string' ? parseInt(property.totalTokens, 10) : property.totalTokens ?? 0;
      const criados = nftTokens.length;
      const faltam = total - criados;
      const tokensCriados: RWANFTToken[] = [];
      for (let i = 0; i < faltam; i++) {
        const token_identifier = `${propertyIdNum}-${criados + i + 1}`;
        const novo = await tokenService.create({
          rwa_id: propertyIdNum,
          token_identifier,
          owner_user_id: userIdNum,
          metadata_uri: ''
        });
        tokensCriados.push(novo);
      }
      setNftTokens(prev => [...prev, ...tokensCriados]);
      toast({
        title: 'Tokens NFT criados com sucesso!',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao criar tokens NFT',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCreatingTokens(false);
    }
  };

  // Handler para abrir modal de edição
  const handleEditToken = (token: RWANFTToken) => {
    setTokenToEdit(token);
    setEditMetadataUri(token.metadata_uri || '');
  };

  // Handler para salvar edição
  const handleSaveEdit = async () => {
    if (!tokenToEdit) return;
    setIsEditing(true);
    try {
      const updated = await tokenService.update(tokenToEdit.id, { metadata_uri: editMetadataUri });
      setNftTokens(tokens => tokens.map(t => t.id === updated.id ? { ...t, metadata_uri: updated.metadata_uri } : t));
      setTokenToEdit(null);
      toast({ title: 'Token atualizado!', status: 'success', duration: 3000 });
    } catch (err) {
      toast({ title: 'Erro ao editar token', status: 'error', duration: 3000 });
    } finally {
      setIsEditing(false);
    }
  };

  // Handler para abrir confirmação de exclusão
  const openDeleteDialog = (token: RWANFTToken) => setTokenToDelete(token);
  // Handler para cancelar exclusão
  const closeDeleteDialog = () => setTokenToDelete(null);
  // Handler para excluir token
  const handleDeleteToken = async () => {
    if (!tokenToDelete) return;
    setIsDeleting(true);
    try {
      await tokenService.delete(tokenToDelete.id);
      setNftTokens(tokens => tokens.filter(t => t.id !== tokenToDelete.id));
      setTokenToDelete(null);
      toast({ title: 'Token excluído!', status: 'success', duration: 3000 });
    } catch (err) {
      toast({ title: 'Erro ao excluir token', status: 'error', duration: 3000 });
    } finally {
      setIsDeleting(false);
    }
  };

  // Memoize valores computados
  const isOwner = !!user && property && (
    user.id?.toString() === property.owner?.toString()
  );

  const totalTokensNum = typeof property?.totalTokens === 'string' ? parseInt(property.totalTokens, 10) : property?.totalTokens ?? 0;

  const availableTokensNum = useMemo(() => {
    // Tokens NFT que não pertencem ao usuário logado
    const userIdNum = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id ?? 0;
    // IDs dos tokens em processo de venda (listings ativos)
    const tokensEmVenda = marketplaceListings
      .filter((listing: any) => listing.status === 'active' && listing.token?.rwa_id === propertyIdNum)
      .map((listing: any) => listing.token?.id);
    // Filtra tokens NFT disponíveis para investimento
    const disponiveis = nftTokens.filter(t =>
      t.owner_user_id !== userIdNum &&
      !tokensEmVenda.includes(t.id)
    );
    return disponiveis.length;
  }, [nftTokens, user, marketplaceListings, propertyIdNum]);

  const tokenPriceNum = useMemo(() => {
    return typeof property?.metadata?.tokenPrice === 'string' 
      ? parseFloat(property.metadata.tokenPrice) 
      : property?.metadata?.tokenPrice ?? 0;
  }, [property?.metadata?.tokenPrice]);

  const tokensToInvestNum = typeof tokensToInvest === 'string' ? parseInt(tokensToInvest, 10) : tokensToInvest ?? 1;

  // LOGS INTELIGENTES E VARIÁVEL AUXILIAR PARA IMAGENS
  const imagesLength = property?.metadata?.images ? property.metadata.images.length : 0;
  console.log('[render] imagesLength:', imagesLength);
  console.log('[render] property.metadata:', property?.metadata);
  console.log('[render] property:', property);

  // Renderização condicional otimizada
  if (isInitialLoad && isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="accent.500" />
        <Text mt={4}>Loading property details...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={8} textAlign="center" color="red.500">
        <Text>{error}</Text>
        <Button mt={4} onClick={() => navigate('/assets')}>Voltar para Imóveis</Button>
      </Box>
    );
  }

  if (!id || id === 'new') {
    return <CreateProperty />;
  }

  if (!property) {
    return (
      <Box p={8} textAlign="center">
        <Text>Imóvel não encontrado</Text>
        <Button mt={4} onClick={() => navigate('/assets')}>Voltar para Imóveis</Button>
      </Box>
    );
  }

  // Logs detalhados para depuração
  console.log('[render] Dados completos do property:', property);
  console.log('[render] Dados completos do usuário:', user);
  console.log('[render] ID do usuário:', user?.id);
  console.log('[render] ID do proprietário da propriedade:', property.owner);
  console.log('[render] É proprietário?', isOwner);
  
  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
        {/* Left Column - Images and Details */}
        <GridItem>
          {/* Property Image Gallery + Mapa */}
          <Box mb={6} position="relative" borderRadius="xl" overflow="hidden">
            {isLoading ? (
              <Flex 
                width="100%" 
                height="400px" 
                justifyContent="center" 
                alignItems="center"
                bg="rgba(255,255,255,0.05)"
              >
                <Spinner size="xl" color="accent.500" />
              </Flex>
            ) : (
              activeImageIndex < imagesLength ? (
                <Image 
                  src={property.metadata?.images?.[activeImageIndex] || 'https://via.placeholder.com/800x400?text=No+Image'} 
                  alt={property.name}
                  width="100%"
                  height="400px"
                  objectFit="cover"
                  borderRadius="xl"
                />
              ) : (
                property.metadata?.gpsCoordinates && (
                  <Box width="100%" height="400px" borderRadius="xl" overflow="hidden">
                    <LatamMap
                      singleAsset={{
                        id: property.id,
                        name: property.name,
                        gps_coordinates: property.metadata?.gpsCoordinates,
                        images: property.metadata?.images ?? [],
                        currentValue: property.currentValue ?? property.price ?? 0,
                        totalTokens: property.totalTokens ?? 0,
                        availableTokens: property.availableTokens ?? 0,
                        description: property.description,
                      } as any}
                      mapHeight="400px"
                      mapZoom={15}
                      mapInteractive={true}
                    />
                  </Box>
                )
              )
            )}
            <Badge 
              position="absolute" 
              top={4} 
              right={4} 
              bg="accent.500" 
              color="white"
              borderRadius="md"
              px={3}
              py={1}
              fontSize="md"
            >
              ID: {property.id}
            </Badge>
            {isOwner && (
              <Button
                as={RouterLink}
                to={`/assets/${property.id}/edit`}
                position="absolute"
                top={4}
                left={4}
                colorScheme="orange"
                size="sm"
                leftIcon={<FaEdit />}
              >
                Editar Propriedade
              </Button>
            )}
          </Box>
          {/* Thumbnails: imagens + miniatura do mapa */}
          <Flex mb={8} gap={2} overflow="auto" pb={2}>
            {imagesLength > 0 && property.metadata?.images?.map((img, idx) => (
              <Box 
                key={idx} 
                width="80px" 
                height="60px" 
                borderRadius="md" 
                overflow="hidden"
                border="2px solid"
                borderColor={activeImageIndex === idx ? "accent.500" : "transparent"}
                cursor="pointer"
                onClick={() => setActiveImageIndex(idx)}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.05)' }}
              >
                <Image 
                  src={img || 'https://via.placeholder.com/80x60?text=No+Image'} 
                  alt={`${property.name} view ${idx + 1}`}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                />
              </Box>
            ))}
            {/* Miniatura do mapa */}
            {property.metadata?.gpsCoordinates && (
              <Box
                width="80px"
                height="60px"
                borderRadius="md"
                overflow="hidden"
                border="2px solid"
                borderColor={activeImageIndex === imagesLength ? "accent.500" : "transparent"}
                cursor="pointer"
                onClick={() => setActiveImageIndex(imagesLength)}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.05)' }}
                position="relative"
              >
                <LatamMap
                  singleAsset={{
                    id: property.id,
                    name: property.name,
                    gps_coordinates: property.metadata?.gpsCoordinates,
                    images: property.metadata?.images ?? [],
                    currentValue: property.currentValue ?? property.price ?? 0,
                    totalTokens: property.totalTokens ?? 0,
                    availableTokens: property.availableTokens ?? 0,
                    description: property.description,
                  } as any}
                  mapHeight="60px"
                  mapZoom={12}
                  mapInteractive={false}
                />
                <Box position="absolute" top={1} right={1} bg="whiteAlpha.800" borderRadius="full" p={1} zIndex={2}>
                  <FaMapMarkerAlt color="#002D5B" />
                </Box>
              </Box>
            )}
          </Flex>

          {/* Property Details */}
          <Box mb={8}>
            <Heading as="h1" size="xl" mb={2}>{property.name}</Heading>
            <Flex align="center" color="text.dim" mb={4}>
              <FaMapMarkerAlt />
              <Text ml={2}>{property.location}</Text>
            </Flex>
            
            <Text fontSize="lg" color="text.dim" mb={6}>
              {property.description}
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
              <HStack spacing={2}>
                <FaCalendarAlt />
                <Text>
                  Year Built: {property.yearBuilt ?? property.metadata?.yearBuilt ?? 'N/A'}
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaBuilding />
                <Text>
                  Size: {property.sizeM2 ?? property.metadata?.sizeM2 ?? property.metadata?.squareMeters ?? 'N/A'} m²
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaCoins />
                <Text>
                  Total Tokens: {property.totalTokens ?? property.metadata?.totalTokens ?? 'N/A'}
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaCoins />
                <Text>
                  Available Tokens: {property.availableTokens ?? property.metadata?.availableTokens ?? 'N/A'}
                </Text>
              </HStack>
            </SimpleGrid>
            
            <Divider my={6} borderColor="bgGrid" />
            
            {/* Tabs for different sections */}
            <Tabs colorScheme="orange" variant="enclosed">
              <TabList>
                <Tab>Amenities</Tab>
                <Tab>Facilities</Tab>
                <Tab>Owner Info</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                    {property.metadata?.amenities?.map((amenity, idx) => (
                      <Tag key={idx} size="lg" bg="rgba(255,255,255,0.1)" color="text.light" borderRadius="full" py={2} px={4}>
                        {amenity}
                      </Tag>
                    )) || (
                      <Text>No amenities information available</Text>
                    )}
                  </SimpleGrid>
                </TabPanel>
                
                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    {property.facilities && property.facilities.length > 0 ? (
                      property.facilities.map((facility, idx) => (
                        <Flex 
                          key={idx}
                          justify="space-between" 
                          align="center" 
                          p={3} 
                          bg="rgba(255,255,255,0.05)" 
                          borderRadius="md"
                        >
                          <HStack>
                            <FaBuilding />
                            <Box>
                              <Text fontWeight="bold">{facility.name}</Text>
                              <Text fontSize="sm" color="text.dim">{facility.type} - {facility.size_m2 || "N/A"}m²</Text>
                            </Box>
                          </HStack>
                          <Badge colorScheme={facility.status === 'active' ? 'green' : facility.status === 'inactive' ? 'gray' : 'orange'}>
                            {facility.status}
                          </Badge>
                        </Flex>
                      ))
                    ) : (
                      <Text>No facilities information available</Text>
                    )}
                  </VStack>
                </TabPanel>
                
                <TabPanel>
                  <HStack spacing={4} mb={4}>
                    <FaUserAlt size={24} />
                    <Box>
                      <Text fontWeight="bold">Owner Address</Text>
                      <Text color="text.dim">
                        {property.owner?.email || property.owner?.walletAddress || property.owner?.id || '-'}
                      </Text>
                    </Box>
                  </HStack>
                  
                  <Text fontSize="sm" color="text.dim">
                    Created on {new Date(property.createdAt).toLocaleDateString()}
                  </Text>
                  {property.createdAt !== property.updatedAt && (
                    <Text fontSize="sm" color="text.dim">
                      Last updated on {new Date(property.updatedAt).toLocaleDateString()}
                    </Text>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* BOTÃO DE CRIAR TOKENS NFT (apenas para o dono e se faltar tokens) */}
            {isOwner && nftTokens.length < totalTokensNum && (
              <Button
                colorScheme="green"
                size="md"
                mb={4}
                isLoading={creatingTokens}
                onClick={handleCreateTokens}
                disabled={creatingTokens}
              >
                Criar {totalTokensNum - nftTokens.length} tokens NFT
              </Button>
            )}

            {/* BOTÃO PARA ABRIR MODAL DE TOKENS NFT */}
            <Button colorScheme="blue" size="sm" mb={4} onClick={() => setShowTokensModal(true)}>
              List Tokens
            </Button>
          </Box>
        </GridItem>
        
        {/* Right Column - Investment Info */}
        <GridItem>
          <Box 
            bg="rgba(255,255,255,0.05)" 
            borderRadius="xl" 
            p={6} 
            border="1px solid"
            borderColor="bgGrid"
            position="sticky"
            top="20px"
          >
            <Heading size="lg" mb={6}>Investment Overview</Heading>
            
            <SimpleGrid columns={2} spacing={4} mb={6}>
              <Stat>
                <StatLabel>Property Value</StatLabel>
                <StatNumber color="accent.500">
                  {formatCurrency(property.currentValue ?? property.price ?? 0)}
                </StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>Token Price</StatLabel>
                <StatNumber color="accent.500">
                  {formatCurrency(tokenPriceNum || (property.currentValue ?? property.price ?? 0) / totalTokensNum)}
                </StatNumber>
                <StatHelpText>per token</StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Divider my={4} borderColor="bgGrid" />
            
            <VStack spacing={4} mb={6} align="stretch">
              <Flex justify="space-between">
                <Text>Total Tokens</Text>
                <Text fontWeight="bold">{totalTokensNum}</Text>
              </Flex>
              
              <Flex justify="space-between">
                <Text>Available Tokens</Text>
                <Text fontWeight="bold">{availableTokensNum}</Text>
              </Flex>
              
              <Flex justify="space-between">
                <Text>Status</Text>
                <Badge colorScheme={property.status === 'active' ? 'green' : property.status === 'inactive' ? 'gray' : 'red'}>
                  {property.status || 'Unknown'}
                </Badge>
              </Flex>
            </VStack>
            
            <Button 
              width="100%"
              variant="primary"
              size="lg"
              onClick={onOpen}
              isDisabled={!isAuthenticated || availableTokensNum === 0 || property.status !== 'active'}
              mb={4}
            >
              Invest Now
            </Button>
            
            <Text fontSize="sm" color="text.dim" textAlign="center">
              {!isAuthenticated 
                ? "Connect your wallet to invest" 
                : availableTokensNum === 0 
                ? "No tokens available for investment" 
                : property.status !== 'active'
                ? "This property is not active for investment"
                : "Minimum investment: 1 token"}
            </Text>
            
            <Box mt={6} pt={6} borderTop="1px solid" borderColor="bgGrid">
              <Button 
                as={RouterLink}
                to="/assets"
                variant="outline"
                width="100%"
              >
                Back to All Properties
              </Button>
            </Box>
          </Box>
        </GridItem>
      </Grid>
      
      {/* Investment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="var(--color-bg-primary)">
          <ModalHeader>Invest in {property.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Number of Tokens</FormLabel>
              <NumberInput 
                min={1} 
                max={availableTokensNum || 1} 
                value={tokensToInvestNum}
                onChange={(value) => setTokensToInvest(typeof value === 'string' ? parseInt(value, 10) : value)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            
            <Divider my={4} />
            
            <Flex justify="space-between" mb={2}>
              <Text>Price per Token</Text>
              <Text>{formatCurrency(tokenPriceNum || (property.currentValue ?? property.price ?? 0) / totalTokensNum)}</Text>
            </Flex>
            
            <Flex justify="space-between" fontWeight="bold">
              <Text>Total Investment</Text>
              <Text>{formatCurrency((tokenPriceNum || (property.currentValue ?? property.price ?? 0) / totalTokensNum) * tokensToInvestNum)}</Text>
            </Flex>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleInvestment}>
              Confirm Investment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL DE TOKENS NFT */}
      <Modal isOpen={showTokensModal} onClose={() => setShowTokensModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent bg="white" color="black">
          <ModalHeader>NFT Tokens of this Property</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingTokens ? (
              <Spinner size="sm" />
            ) : nftTokens.length === 0 ? (
              <Text color="gray.500">No NFT tokens created yet.</Text>
            ) : (
              <Stack spacing={4}>
                {nftTokens.map(token => {
                  // Busca o listing do marketplace para este token
                  const listing = marketplaceListings.find(l => l.token?.id === token.id);
                  return (
                    <Flex
                      key={token.id}
                      align="center"
                      justify="space-between"
                      p={4}
                      borderRadius="md"
                      boxShadow="md"
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color="accent.500">
                          Token: {token.token_identifier}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          ID: {token.id}
                        </Text>
                        {listing && (
                          <>
                            <Text fontSize="sm" color="green.700">
                              <b>For sale!</b> Price: ${listing.price_per_token} | Status: {listing.status}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              Quantity available: {listing.quantity}
                            </Text>
                          </>
                        )}
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.700">
                          <b>Owner:</b> {token.owner_user_id}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Created at: {new Date(token.created_at).toLocaleString('en-US')}
                        </Text>
                        <Button mt={2} size="xs" colorScheme="blue" 
                          as="a"
                          href={getTransferHistoryLink(token.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View transfer history
                        </Button>
                        {isOwner && (
                          <Flex gap={2} mt={2} justify="flex-end">
                            <IconButton
                              aria-label="Edit token"
                              icon={<FaEdit />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleEditToken(token)}
                            />
                            <IconButton
                              aria-label="Delete token"
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => openDeleteDialog(token)}
                            />
                          </Flex>
                        )}
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL DE EDIÇÃO DE TOKEN */}
      <Modal isOpen={!!tokenToEdit} onClose={() => setTokenToEdit(null)}>
        <ModalOverlay />
        <ModalContent bg="white" color="black">
          <ModalHeader>Edit NFT Token</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Metadata URI</FormLabel>
              <NumberInput value={editMetadataUri} onChange={v => setEditMetadataUri(v)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setTokenToEdit(null)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit} isLoading={isEditing}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ALERTA DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        isOpen={!!tokenToDelete}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Delete NFT Token</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to delete this NFT token? This action cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteToken} ml={3} isLoading={isDeleting}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}; 
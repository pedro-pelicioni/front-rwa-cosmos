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
import { useAuth } from '../hooks/useAuth';
import { useProperty } from '../hooks/useProperty';
import { imageService } from '../services/imageService';
import { RWAImage } from '../types/rwa';
import { LatamMap } from '../components/LatamMap';
import { tokenService } from '../services/tokenService';
import { RWANFTToken } from '../types/rwa';
import { getImageFromIDB, setImageToIDB } from '../utils/imageIDBCache';

export const AssetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { getById, loading, error } = useProperty();
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [tokensToInvest, setTokensToInvest] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [propertyImages, setPropertyImages] = useState<RWAImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
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
  const isMounted = useRef(true);

  // Função para buscar imagens com cache global
  const fetchImagesWithCache = useCallback(async (rwaId: number) => {
    setLoadingImages(true);
    try {
      const images = await imageService.getByRWAId(rwaId);
      setPropertyImages(images);
      const imageUrls = images.map(img => img.image_data || img.file_path || img.cid_link || '');
      setProperty(prev => {
        if (!prev) return null;
        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            images: imageUrls
          }
        };
      });
    } catch (err) {
      console.error('Erro ao buscar imagens da propriedade:', err);
    } finally {
      setLoadingImages(false);
    }
  }, []);

  // Função para buscar propriedade
  const fetchProperty = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getById(id);
      console.log('Propriedade recebida do serviço:', data);
      setProperty(data);
      console.log('Propriedade setada no state:', data);
      const rwaId = parseInt(id, 10);
      await fetchImagesWithCache(rwaId);
    } catch (err) {
      console.error('Erro ao buscar detalhes da propriedade:', err);
      navigate('/assets');
      toast({
        title: "Property not found",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [id, getById, navigate, toast, fetchImagesWithCache]);

  // Efeito principal
  useEffect(() => {
    if (!id) return;
    fetchProperty();

    return () => {
      isMounted.current = false;
    };
  }, [id, fetchProperty]);

  // Buscar tokens NFT do asset
  useEffect(() => {
    if (!property?.id) return;
    const fetchTokens = async () => {
      setLoadingTokens(true);
      try {
        const response = await tokenService.getByRWAId(
          typeof property.id === 'string' ? parseInt(property.id, 10) : property.id
        );
        // Garante que nftTokens sempre será um array
        const tokens = Array.isArray(response) ? response : [];
        setNftTokens(tokens);
      } catch (err) {
        setNftTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    };
    fetchTokens();
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
    const pricePerToken = tokenPriceNum || property.price / totalTokensNum;
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
      const total = typeof property.totalTokens === 'string' ? parseInt(property.totalTokens, 10) : property.totalTokens;
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
    return typeof property?.availableTokens === 'string' 
      ? parseInt(property.availableTokens, 10) 
      : property?.availableTokens ?? 0;
  }, [property?.availableTokens]);

  const tokenPriceNum = useMemo(() => {
    return typeof property?.metadata?.tokenPrice === 'string' 
      ? parseFloat(property.metadata.tokenPrice) 
      : property?.metadata?.tokenPrice ?? 0;
  }, [property?.metadata?.tokenPrice]);

  const tokensToInvestNum = typeof tokensToInvest === 'string' ? parseInt(tokensToInvest, 10) : tokensToInvest ?? 1;

  if (loading) {
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
        <Text>Error loading property: {error}</Text>
        <Button mt={4} onClick={() => navigate('/assets')}>Back to Properties</Button>
      </Box>
    );
  }

  if (!property) {
    console.warn('Property está undefined ou null! property:', property);
    return <Box p={8}>Property not found</Box>;
  }

  // Logs detalhados para depuração
  console.log('Dados completos do usuário:', user);
  console.log('ID do usuário:', user?.id);
  console.log('ID do proprietário da propriedade:', property.owner);
  
  console.log('É proprietário?', isOwner);

  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
        {/* Left Column - Images and Details */}
        <GridItem>
          {/* Property Image Gallery + Mapa */}
          <Box mb={6} position="relative" borderRadius="xl" overflow="hidden">
            {loadingImages ? (
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
              activeImageIndex < property.metadata.images.length ? (
                <Image 
                  src={property.metadata.images[activeImageIndex] || 'https://via.placeholder.com/800x400?text=No+Image'} 
                  alt={property.name}
                  width="100%"
                  height="400px"
                  objectFit="cover"
                  borderRadius="xl"
                />
              ) : (
                // Mostra o mapa como "imagem" final
                property.metadata.gpsCoordinates && (
                  <Box width="100%" height="400px" borderRadius="xl" overflow="hidden">
                    <LatamMap
                      singleAsset={{
                        id: property.id,
                        name: property.name,
                        gps_coordinates: property.metadata.gpsCoordinates,
                        images: property.metadata.images ?? [],
                        currentValue: property.price,
                        totalTokens: property.totalTokens,
                        availableTokens: property.availableTokens,
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
            {property.metadata.images.length > 0 && property.metadata.images.map((img, idx) => (
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
            {property.metadata.gpsCoordinates && (
              <Box
                width="80px"
                height="60px"
                borderRadius="md"
                overflow="hidden"
                border="2px solid"
                borderColor={activeImageIndex === property.metadata.images.length ? "accent.500" : "transparent"}
                cursor="pointer"
                onClick={() => setActiveImageIndex(property.metadata.images.length)}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.05)' }}
                position="relative"
              >
                <LatamMap
                  singleAsset={{
                    id: property.id,
                    name: property.name,
                    gps_coordinates: property.metadata.gpsCoordinates,
                    images: property.metadata.images ?? [],
                    currentValue: property.price,
                    totalTokens: property.totalTokens,
                    availableTokens: property.availableTokens,
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
                <Text>Year Built: {property.metadata.yearBuilt || "N/A"}</Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaBuilding />
                <Text>Size: {property.metadata.squareMeters || "N/A"} m²</Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaCoins />
                <Text>Total Tokens: {totalTokensNum}</Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaCoins />
                <Text>Available Tokens: {availableTokensNum}</Text>
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
                    {property.metadata.amenities?.map((amenity, idx) => (
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
                      <Text color="text.dim">{property.owner}</Text>
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
              Ver tokens NFT
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
                <StatNumber color="accent.500">{formatCurrency(property.price)}</StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>Token Price</StatLabel>
                <StatNumber color="accent.500">
                  {formatCurrency(tokenPriceNum || property.price / totalTokensNum)}
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
              isDisabled={!user?.isConnected || availableTokensNum === 0 || property.status !== 'active'}
              mb={4}
            >
              Invest Now
            </Button>
            
            <Text fontSize="sm" color="text.dim" textAlign="center">
              {!user?.isConnected 
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
                max={availableTokensNum} 
                value={tokensToInvestNum}
                onChange={(value) => setTokensToInvest(typeof value === 'string' ? parseInt(value, 10) : value)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            
            <Divider my={4} />
            
            <Flex justify="space-between" mb={2}>
              <Text>Price per Token</Text>
              <Text>{formatCurrency(tokenPriceNum || property.price / totalTokensNum)}</Text>
            </Flex>
            
            <Flex justify="space-between" fontWeight="bold">
              <Text>Total Investment</Text>
              <Text>{formatCurrency((tokenPriceNum || property.price / totalTokensNum) * tokensToInvestNum)}</Text>
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
          <ModalHeader>Tokens NFT deste imóvel</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingTokens ? (
              <Spinner size="sm" />
            ) : nftTokens.length === 0 ? (
              <Text color="gray.500">Nenhum token NFT criado ainda.</Text>
            ) : (
              <Stack spacing={4}>
                {nftTokens.map(token => (
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
                    </Box>
                    <Box textAlign="right">
                      <Text fontSize="sm" color="gray.700">
                        <b>Dono:</b> {token.owner_user_id}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Criado em: {new Date(token.created_at).toLocaleString('pt-BR')}
                      </Text>
                      {isOwner && (
                        <Flex gap={2} mt={2} justify="flex-end">
                          <IconButton
                            aria-label="Editar token"
                            icon={<FaEdit />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEditToken(token)}
                          />
                          <IconButton
                            aria-label="Excluir token"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => openDeleteDialog(token)}
                          />
                        </Flex>
                      )}
                    </Box>
                  </Flex>
                ))}
              </Stack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL DE EDIÇÃO DE TOKEN */}
      <Modal isOpen={!!tokenToEdit} onClose={() => setTokenToEdit(null)}>
        <ModalOverlay />
        <ModalContent bg="white" color="black">
          <ModalHeader>Editar Token NFT</ModalHeader>
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
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit} isLoading={isEditing}>
              Salvar
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
          <AlertDialogHeader>Excluir Token NFT</AlertDialogHeader>
          <AlertDialogBody>
            Tem certeza que deseja excluir este token NFT? Essa ação não pode ser desfeita.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={closeDeleteDialog}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={handleDeleteToken} ml={3} isLoading={isDeleting}>
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}; 
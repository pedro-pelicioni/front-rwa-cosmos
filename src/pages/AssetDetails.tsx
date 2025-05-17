import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Heading, Text, Button, Grid, GridItem, Flex, 
  Image, Badge, HStack, VStack, Divider, Tabs, TabList, Tab, 
  TabPanels, TabPanel, SimpleGrid, Tag, Stat, StatLabel, 
  StatNumber, StatHelpText, useDisclosure, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, NumberInput, NumberInputField,
  FormControl, FormLabel, useToast, Spinner
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaCoins, FaFileAlt, FaUserAlt, FaEdit } from 'react-icons/fa';
import { Property } from '../types/Property';
import { useAuth } from '../hooks/useAuth';
import { useProperty } from '../hooks/useProperty';
import { imageService } from '../services/imageService';
import { RWAImage } from '../types/rwa';
import { LatamMap } from '../components/LatamMap';

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

  useEffect(() => {
    if (!id) return;
    
    const fetchProperty = async () => {
      try {
        const data = await getById(id);
        setProperty(data);
        
        // Uma vez que temos a propriedade, buscamos as imagens
        fetchPropertyImages(parseInt(id));
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
    };
    
    const fetchPropertyImages = async (rwaId: number) => {
      try {
        setLoadingImages(true);
        console.log('Buscando imagens para o RWA ID:', rwaId);
        
        const images = await imageService.getByRWAId(rwaId);
        console.log('Imagens encontradas:', images);
        
        setPropertyImages(images);
        
        // Se encontrarmos imagens, atualizamos também o property.metadata.images
        if (images.length > 0) {
          setProperty(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              metadata: {
                ...prev.metadata,
                images: images.map(img => {
                  // Se a imagem tiver image_data (base64), usamos diretamente
                  if (img.image_data) return img.image_data;
                  // Caso contrário, tentamos file_path ou cid_link
                  return img.file_path || img.cid_link || '';
                })
              }
            };
          });
        }
      } catch (err) {
        console.error('Erro ao buscar imagens da propriedade:', err);
      } finally {
        setLoadingImages(false);
      }
    };
    
    fetchProperty();
  }, [id, getById, navigate, toast]);

  const handleInvestment = () => {
    toast({
      title: "Investment Successful",
      description: `You have successfully invested in ${tokensToInvest} tokens of ${property?.name}`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

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
    return <Box p={8}>Property not found</Box>;
  }

  // Logs detalhados para depuração
  console.log('Dados completos do usuário:', user);
  console.log('ID do usuário:', user?.id);
  console.log('ID do proprietário da propriedade:', property.owner);
  
  // Verifica se o usuário está autenticado e se os IDs correspondem
  const isOwner = user && user.id && property.owner && 
                 user.id.toString() === property.owner.toString();
  
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
                        country: (property.metadata.country ?? '') as string,
                        images: property.metadata.images ?? [],
                        currentValue: property.price,
                        totalTokens: property.totalTokens,
                        availableTokens: property.availableTokens,
                        description: property.description,
                        city: (property.metadata.city ?? '') as string,
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
                    country: (property.metadata.country ?? '') as string,
                    images: property.metadata.images ?? [],
                    currentValue: property.price,
                    totalTokens: property.totalTokens,
                    availableTokens: property.availableTokens,
                    description: property.description,
                    city: (property.metadata.city ?? '') as string,
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
                <Text>Total Tokens: {property.totalTokens}</Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaCoins />
                <Text>Available Tokens: {property.availableTokens}</Text>
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
                  {formatCurrency(property.metadata.tokenPrice || property.price / property.totalTokens)}
                </StatNumber>
                <StatHelpText>per token</StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Divider my={4} borderColor="bgGrid" />
            
            <VStack spacing={4} mb={6} align="stretch">
              <Flex justify="space-between">
                <Text>Total Tokens</Text>
                <Text fontWeight="bold">{property.totalTokens}</Text>
              </Flex>
              
              <Flex justify="space-between">
                <Text>Available Tokens</Text>
                <Text fontWeight="bold">{property.availableTokens}</Text>
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
              isDisabled={!user?.isConnected || property.availableTokens === 0 || property.status !== 'active'}
              mb={4}
            >
              Invest Now
            </Button>
            
            <Text fontSize="sm" color="text.dim" textAlign="center">
              {!user?.isConnected 
                ? "Connect your wallet to invest" 
                : property.availableTokens === 0 
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
                max={property.availableTokens} 
                value={tokensToInvest}
                onChange={(value) => setTokensToInvest(parseInt(value))}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            
            <Divider my={4} />
            
            <Flex justify="space-between" mb={2}>
              <Text>Price per Token</Text>
              <Text>{formatCurrency(property.metadata.tokenPrice || property.price / property.totalTokens)}</Text>
            </Flex>
            
            <Flex justify="space-between" fontWeight="bold">
              <Text>Total Investment</Text>
              <Text>{formatCurrency((property.metadata.tokenPrice || property.price / property.totalTokens) * tokensToInvest)}</Text>
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
    </Container>
  );
}; 
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Heading, Text, Button, Grid, GridItem, Flex, 
  Image, Badge, HStack, VStack, Divider, Tabs, TabList, Tab, 
  TabPanels, TabPanel, SimpleGrid, Tag, Stat, StatLabel, 
  StatNumber, StatHelpText, useDisclosure, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, NumberInput, NumberInputField,
  FormControl, FormLabel, useToast
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaCoins, FaFileAlt, FaUserAlt } from 'react-icons/fa';
import { properties } from '../data/properties';
import { Property } from '../types/Property';
import { useAuth } from '../hooks/useAuth';

export const AssetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [tokensToInvest, setTokensToInvest] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const foundProperty = properties.find(p => p.id === id);
    if (foundProperty) {
      setProperty(foundProperty);
    } else {
      navigate('/assets');
      toast({
        title: "Property not found",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [id, navigate, toast]);

  if (!property) {
    return <Box p={8}>Loading property details...</Box>;
  }

  const handleInvestment = () => {
    toast({
      title: "Investment Successful",
      description: `You have successfully invested in ${tokensToInvest} tokens of ${property.name}`,
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

  const isOwner = user?.address === property.owner;

  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
        {/* Left Column - Images and Details */}
        <GridItem>
          {/* Property Image Gallery */}
          <Box mb={6} position="relative" borderRadius="xl" overflow="hidden">
            <Image 
              src={property.metadata.images[activeImageIndex]} 
              alt={property.name}
              width="100%"
              height="400px"
              objectFit="cover"
              borderRadius="xl"
            />
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
          </Box>
          
          {/* Thumbnail Gallery */}
          <Flex mb={8} gap={2} overflow="auto" pb={2}>
            {property.metadata.images.map((img, idx) => (
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
                  src={img} 
                  alt={`${property.name} view ${idx + 1}`}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                />
              </Box>
            ))}
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
                <Tab>Documents</Tab>
                <Tab>Owner Info</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                    {property.metadata.amenities?.map((amenity, idx) => (
                      <Tag key={idx} size="lg" bg="rgba(255,255,255,0.1)" color="text.light" borderRadius="full" py={2} px={4}>
                        {amenity}
                      </Tag>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                
                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    {property.metadata.documents.map((doc, idx) => (
                      <Flex 
                        key={idx}
                        justify="space-between" 
                        align="center" 
                        p={3} 
                        bg="rgba(255,255,255,0.05)" 
                        borderRadius="md"
                      >
                        <HStack>
                          <FaFileAlt />
                          <Text>{doc}</Text>
                        </HStack>
                        <Button size="sm" variant="outline">View</Button>
                      </Flex>
                    ))}
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
            
            <Box mb={6}>
              <Flex justify="space-between" mb={2}>
                <Text>Available Tokens</Text>
                <Text>{property.availableTokens} / {property.totalTokens}</Text>
              </Flex>
              
              <Box 
                w="100%" 
                h="8px" 
                bg="rgba(255,255,255,0.1)" 
                borderRadius="full" 
                overflow="hidden"
              >
                <Box 
                  w={`${(property.availableTokens / property.totalTokens) * 100}%`} 
                  h="100%" 
                  bg="accent.500" 
                  borderRadius="full"
                />
              </Box>
            </Box>
            
            {user?.isConnected ? (
              isOwner ? (
                <VStack spacing={4} align="stretch">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    width="100%"
                    as={RouterLink}
                    to={`/assets/${property.id}/edit`}
                  >
                    Edit Property
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    width="100%"
                  >
                    Add Fungible Tokens
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    width="100%"
                    onClick={onOpen}
                    isDisabled={property.availableTokens === 0}
                  >
                    Invest Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    width="100%"
                  >
                    Add to Watchlist
                  </Button>
                </VStack>
              )
            ) : (
              <Button 
                variant="primary" 
                size="lg" 
                width="100%"
                as={RouterLink}
                to="/wallet"
              >
                Connect Wallet to Invest
              </Button>
            )}
            
            <VStack spacing={4} mt={8} align="stretch">
              <Heading size="sm">Property Documents</Heading>
              {property.metadata.documents.slice(0, 2).map((doc, idx) => (
                <Flex 
                  key={idx}
                  justify="space-between" 
                  align="center" 
                  p={3} 
                  bg="rgba(255,255,255,0.03)" 
                  borderRadius="md"
                >
                  <Text fontSize="sm">{doc}</Text>
                  <Button size="xs" variant="ghost">View</Button>
                </Flex>
              ))}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
      
      {/* Investment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg="primary.700" borderColor="bgGrid" borderWidth="1px">
          <ModalHeader color="text.light">Invest in {property.name}</ModalHeader>
          <ModalCloseButton color="text.light" />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Stat>
                <StatLabel>Token Price</StatLabel>
                <StatNumber color="accent.500">
                  {formatCurrency(property.metadata.tokenPrice || property.price / property.totalTokens)}
                </StatNumber>
                <StatHelpText>per token</StatHelpText>
              </Stat>
              
              <FormControl>
                <FormLabel>Number of Tokens</FormLabel>
                <NumberInput 
                  min={1} 
                  max={property.availableTokens}
                  value={tokensToInvest}
                  onChange={(valueString) => setTokensToInvest(Number(valueString))}
                >
                  <NumberInputField bg="rgba(255,255,255,0.1)" borderColor="bgGrid" />
                </NumberInput>
              </FormControl>
              
              <Divider borderColor="bgGrid" />
              
              <Flex justify="space-between">
                <Text>Total Investment</Text>
                <Text fontWeight="bold" color="accent.500">
                  {formatCurrency((property.metadata.tokenPrice || property.price / property.totalTokens) * tokensToInvest)}
                </Text>
              </Flex>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="primary" mr={3} onClick={handleInvestment}>
              Confirm Investment
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 
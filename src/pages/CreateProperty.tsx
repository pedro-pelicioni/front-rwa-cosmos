import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  InputGroup,
  InputLeftElement,
  Divider,
  useToast,
  FormHelperText,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { FaDollarSign, FaPlus } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export const CreateProperty = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    price: '',
    totalTokens: '',
    images: [] as string[],
    documents: [] as string[],
    amenities: [] as string[],
    yearBuilt: '',
    squareMeters: '',
  });
  
  const [newImage, setNewImage] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addImage = () => {
    if (newImage.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, newImage] }));
      setNewImage('');
    }
  };
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const addDocument = () => {
    if (newDocument.trim()) {
      setFormData(prev => ({ ...prev, documents: [...prev.documents, newDocument] }));
      setNewDocument('');
    }
  };
  
  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };
  
  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData(prev => ({ ...prev, amenities: [...prev.amenities, newAmenity] }));
      setNewAmenity('');
    }
  };
  
  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.location || !formData.price || !formData.totalTokens) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // In a real application, this would send data to the backend
    // For now, we'll just show a success message and navigate back
    toast({
      title: "Property Created",
      description: `Property "${formData.name}" has been created successfully`,
      status: "success",
      duration: 5000,
      isClosable: true
    });
    
    setTimeout(() => {
      navigate('/assets');
    }, 1000);
  };

  if (!user?.isConnected) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading>Connect Your Wallet</Heading>
          <Text>You need to connect your wallet before creating a new property listing.</Text>
          <Button variant="primary" onClick={onOpen}>
            Connect Wallet
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch" as="form" onSubmit={handleSubmit}>
        <Box>
          <Heading size="xl" mb={2}>Create New Property</Heading>
          <Text color="text.dim">List a new tokenized real estate property for investment</Text>
        </Box>
        
        <Divider borderColor="bgGrid" />
        
        <Heading size="md">Basic Information</Heading>
        
        <FormControl isRequired>
          <FormLabel>Property Name</FormLabel>
          <Input 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor="bgGrid"
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Location</FormLabel>
          <Input 
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="City, Country"
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor="bgGrid"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea 
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the property and investment opportunity"
            rows={5}
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor="bgGrid"
          />
        </FormControl>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Property Value</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaDollarSign color="gray.300" />
              </InputLeftElement>
              <NumberInput 
                min={1} 
                value={formData.price} 
                onChange={(value) => handleNumberInputChange('price', value)}
                width="100%"
              >
                <NumberInputField 
                  borderStartRadius="md"
                  pl={8}
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid"
                  borderColor="bgGrid"
                />
              </NumberInput>
            </InputGroup>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>Total Tokens</FormLabel>
            <NumberInput 
              min={1} 
              value={formData.totalTokens} 
              onChange={(value) => handleNumberInputChange('totalTokens', value)}
            >
              <NumberInputField 
                bg="rgba(255,255,255,0.05)"
                border="1px solid"
                borderColor="bgGrid"
              />
            </NumberInput>
            <FormHelperText>Number of tokens to divide the property into</FormHelperText>
          </FormControl>
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>Year Built</FormLabel>
            <NumberInput 
              min={1900} 
              max={new Date().getFullYear()} 
              value={formData.yearBuilt} 
              onChange={(value) => handleNumberInputChange('yearBuilt', value)}
            >
              <NumberInputField 
                bg="rgba(255,255,255,0.05)"
                border="1px solid"
                borderColor="bgGrid"
              />
            </NumberInput>
          </FormControl>
          
          <FormControl>
            <FormLabel>Size (m²)</FormLabel>
            <NumberInput 
              min={1} 
              value={formData.squareMeters} 
              onChange={(value) => handleNumberInputChange('squareMeters', value)}
            >
              <NumberInputField 
                bg="rgba(255,255,255,0.05)"
                border="1px solid"
                borderColor="bgGrid"
              />
            </NumberInput>
          </FormControl>
        </SimpleGrid>
        
        <Divider borderColor="bgGrid" />
        
        <Heading size="md">Media & Documents</Heading>
        
        <FormControl>
          <FormLabel>Property Images (URLs)</FormLabel>
          <HStack mb={2}>
            <Input 
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="Enter image URL"
              bg="rgba(255,255,255,0.05)"
              border="1px solid"
              borderColor="bgGrid"
            />
            <Button 
              leftIcon={<FaPlus />} 
              onClick={addImage}
              variant="outline"
              px={8}
            >
              Add
            </Button>
          </HStack>
          <HStack spacing={2} flexWrap="wrap">
            {formData.images.map((img, index) => (
              <Tag 
                key={index}
                size="lg" 
                borderRadius="full"
                variant="outline"
                bg="rgba(255,255,255,0.05)"
                my={1}
              >
                <TagLabel>{img.length > 30 ? img.substring(0, 30) + '...' : img}</TagLabel>
                <TagCloseButton onClick={() => removeImage(index)} />
              </Tag>
            ))}
          </HStack>
        </FormControl>
        
        <FormControl>
          <FormLabel>Property Documents</FormLabel>
          <HStack mb={2}>
            <Input 
              value={newDocument}
              onChange={(e) => setNewDocument(e.target.value)}
              placeholder="Enter document name (e.g., property_deed.pdf)"
              bg="rgba(255,255,255,0.05)"
              border="1px solid"
              borderColor="bgGrid"
            />
            <Button 
              leftIcon={<FaPlus />} 
              onClick={addDocument}
              variant="outline"
              px={8}
            >
              Add
            </Button>
          </HStack>
          <HStack spacing={2} flexWrap="wrap">
            {formData.documents.map((doc, index) => (
              <Tag 
                key={index}
                size="lg" 
                borderRadius="full"
                variant="outline"
                bg="rgba(255,255,255,0.05)"
                my={1}
              >
                <TagLabel>{doc}</TagLabel>
                <TagCloseButton onClick={() => removeDocument(index)} />
              </Tag>
            ))}
          </HStack>
        </FormControl>
        
        <FormControl>
          <FormLabel>Property Amenities</FormLabel>
          <HStack mb={2}>
            <Input 
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Enter amenity (e.g., Swimming Pool)"
              bg="rgba(255,255,255,0.05)"
              border="1px solid"
              borderColor="bgGrid"
            />
            <Button 
              leftIcon={<FaPlus />} 
              onClick={addAmenity}
              variant="outline"
              px={8}
            >
              Add
            </Button>
          </HStack>
          <HStack spacing={2} flexWrap="wrap">
            {formData.amenities.map((amenity, index) => (
              <Tag 
                key={index}
                size="lg" 
                borderRadius="full"
                variant="outline"
                bg="rgba(255,255,255,0.05)"
                my={1}
              >
                <TagLabel>{amenity}</TagLabel>
                <TagCloseButton onClick={() => removeAmenity(index)} />
              </Tag>
            ))}
          </HStack>
        </FormControl>
        
        <Divider borderColor="bgGrid" />
        
        <HStack spacing={4} justify="flex-end">
          <Button 
            variant="outline"
            onClick={() => navigate('/assets')}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            type="submit"
          >
            Create Property
          </Button>
        </HStack>
      </VStack>
      
      {/* Wallet connection modal (reusing the existing modal from elsewhere) */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="primary.500" borderColor="bgGrid" borderWidth="1px">
          <ModalHeader color="text.light">Choose Your Wallet</ModalHeader>
          <ModalCloseButton color="text.light" />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Button
                variant="primary"
                size="lg"
                width="100%"
              >
                Connect Keplr
              </Button>
              <Button
                variant="primary"
                size="lg"
                width="100%"
              >
                Connect Noble
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 
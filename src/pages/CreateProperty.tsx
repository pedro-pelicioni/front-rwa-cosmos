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
  ModalCloseButton,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  ButtonGroup
} from '@chakra-ui/react';
import { FaDollarSign, FaPlus, FaTrash, FaUpload, FaImage } from 'react-icons/fa';
import { useAuth } from '../hooks';
import { useProperty } from '../hooks/useProperty';
import { imageService } from '../services/imageService';
import keplrIcon from '../constants/keplr-icon.webp';
import metamaskIcon from '../constants/metamask-icon.png';
import coinbaseIcon from '../constants/coinbase-icon.webp';
import { WalletConnectModal } from '../components/WalletConnectModal';

export const CreateProperty = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isLoading, handleConnect } = useAuth();
  const { create, loading, error } = useProperty();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formError, setFormError] = useState<string | null>(null);
  
  // Adiciona estado para campos com erro
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  
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
    gpsCoordinates: '',
  });
  
  const [newImage, setNewImage] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa o erro quando o usuário começa a editar
    setFormError(null);
    // Limpa o erro do campo específico
    setFieldErrors(prev => ({ ...prev, [name]: false }));
  };
  
  const handleNumberInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa o erro quando o usuário começa a editar
    setFormError(null);
    // Limpa o erro do campo específico
    setFieldErrors(prev => ({ ...prev, [name]: false }));
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
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files).slice(0, 3 - uploadedImages.length);
    setUploadedImages(prev => [...prev, ...fileArr]);
    fileArr.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeUploadedImg = (idx: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
    setUploadPreviews(prev => prev.filter((_, i) => i !== idx));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    
    if (uploadedImages.length === 0) {
      setFormError('Please upload at least one image.');
      return;
    }
    
    // Basic validation
    const newFieldErrors: {[key: string]: boolean} = {};
    let hasErrors = false;
    
    if (!formData.name) {
      newFieldErrors.name = true;
      hasErrors = true;
    }
    
    // Validar formato da localização
    if (!formData.location) {
      newFieldErrors.location = true;
      hasErrors = true;
    } 
    
    if (!formData.gpsCoordinates) {
      newFieldErrors.gpsCoordinates = true;
      hasErrors = true;
    }
    
    if (!formData.price) {
      newFieldErrors.price = true;
      hasErrors = true;
    }
    
    if (!formData.totalTokens) {
      newFieldErrors.totalTokens = true;
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      setFormError("Preencha todos os campos obrigatórios");
      toast({
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios (Nome, Localização, Coordenadas GPS, Valor e Total de Tokens)",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      // 1. Cria a propriedade normalmente
      const property = await create({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        totalTokens: parseInt(formData.totalTokens),
        availableTokens: parseInt(formData.totalTokens),
        metadata: {
          images: [], // imagens serão vinculadas depois
          documents: formData.documents,
          amenities: formData.amenities,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
          squareMeters: formData.squareMeters ? parseFloat(formData.squareMeters) : undefined,
          gpsCoordinates: formData.gpsCoordinates
        },
        owner: user?.address || '',
        status: 'active'
      });

      // 2. Faz upload das imagens e vincula à propriedade
      setIsUploading(true);
      await Promise.all(uploadedImages.map(async (file) => {
        await imageService.upload(Number(property.id), file, file.name);
      }));
      setIsUploading(false);

      toast({
        title: "Propriedade Criada",
        description: `Propriedade "${formData.name}" foi criada com sucesso` + (uploadedImages.length ? ' com imagens.' : '.'),
        status: "success",
        duration: 5000,
        isClosable: true
      });
      navigate('/assets');
    } catch (err: any) {
      setIsUploading(false);
      console.error('Error creating property:', err);
      
      // Captura o erro específico da resposta ou do estado do hook
      let errorMessage = "";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors) {
        // Processa erros em formato array ou objeto
        if (Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.join('; ');
        } else if (typeof err.response.data.errors === 'object') {
          errorMessage = Object.values(err.response.data.errors).flat().join('; ');
        } else {
          errorMessage = String(err.response.data.errors);
        }
      } else if (error) {
        // Se não encontrar erro específico na resposta, usa o erro do hook
        errorMessage = error;
      } else {
        errorMessage = "Ocorreu um erro ao criar a propriedade";
      }
      
      // Destaca campos específicos baseado na mensagem de erro
      const newFieldErrors: {[key: string]: boolean} = {};
      const errorLower = errorMessage.toLowerCase();
      
      if (errorLower.includes('nome') || errorLower.includes('name')) newFieldErrors.name = true;
      if (errorLower.includes('coordenadas') || errorLower.includes('gps')) newFieldErrors.gpsCoordinates = true;
      if (errorLower.includes('localização') || errorLower.includes('location') || 
          errorLower.includes('cidade') || errorLower.includes('país') || 
          errorLower.includes('city') || errorLower.includes('country')) newFieldErrors.location = true;
      if (errorLower.includes('preço') || errorLower.includes('valor') || errorLower.includes('price')) newFieldErrors.price = true;
      if (errorLower.includes('tokens')) newFieldErrors.totalTokens = true;
      
      setFieldErrors(newFieldErrors);
      setFormError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
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
        
        {formError && (
          <Alert status="error" variant="solid" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{formError}</AlertDescription>
            <CloseButton position="absolute" right="8px" top="8px" onClick={() => setFormError(null)} />
          </Alert>
        )}
        
        <Divider borderColor="bgGrid" />
        
        <Heading size="md">Basic Information</Heading>
        
        <FormControl isRequired isInvalid={!!fieldErrors.name}>
          <FormLabel>Property Name</FormLabel>
          <Input 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor={fieldErrors.name ? "red.500" : "bgGrid"}
          />
        </FormControl>
        
        <FormControl isRequired isInvalid={!!fieldErrors.location}>
          <FormLabel>Location</FormLabel>
          <Input 
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="City, Country"
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor={fieldErrors.location ? "red.500" : "bgGrid"}
          />
          <FormHelperText color={fieldErrors.location ? "red.300" : "text.dim"}>
            Formato obrigatório: Cidade, País (ex: São Paulo, Brasil)
          </FormHelperText>
        </FormControl>
        
        <FormControl isInvalid={!!fieldErrors.gpsCoordinates}>
          <FormLabel>GPS Coordinates</FormLabel>
          <Input 
            name="gpsCoordinates"
            value={formData.gpsCoordinates}
            onChange={handleInputChange}
            placeholder="e.g., -23.5505, -46.6333"
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor={fieldErrors.gpsCoordinates ? "red.500" : "bgGrid"}
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
          <FormControl isRequired isInvalid={!!fieldErrors.price}>
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
                  borderColor={fieldErrors.price ? "red.500" : "bgGrid"}
                />
              </NumberInput>
            </InputGroup>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!fieldErrors.totalTokens}>
            <FormLabel>Total Tokens</FormLabel>
            <NumberInput 
              min={1} 
              value={formData.totalTokens} 
              onChange={(value) => handleNumberInputChange('totalTokens', value)}
            >
              <NumberInputField 
                bg="rgba(255,255,255,0.05)"
                border="1px solid"
                borderColor={fieldErrors.totalTokens ? "red.500" : "bgGrid"}
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
        
        <FormControl isRequired>
          <FormLabel>Property Images</FormLabel>
          <VStack align="flex-start" spacing={2} mb={2}>
            <HStack>
              <Button
                as="label"
                leftIcon={<FaUpload />}
                variant="outline"
                isDisabled={uploadedImages.length >= 3}
              >
                Upload Image
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageChange}
                  disabled={uploadedImages.length >= 3}
                />
              </Button>
              <Text fontSize="sm" color="gray.400">{uploadedImages.length}/3 images</Text>
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              {uploadPreviews.map((src, idx) => (
                <Box key={idx} position="relative">
                  <img src={src} alt={`preview-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #444' }} />
                  <Button size="xs" colorScheme="red" position="absolute" top={0} right={0} borderRadius="full" onClick={() => removeUploadedImg(idx)}>
                    <FaTrash />
                  </Button>
                </Box>
              ))}
            </HStack>
          </VStack>
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
          <FormLabel>Amenities</FormLabel>
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
        
        <Divider borderColor="bgGrid" my={4} />
        
        <HStack justifyContent="space-between">
          <Button 
            variant="outline"
            onClick={() => navigate('/assets')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="primary"
            isLoading={loading || isUploading}
            loadingText="Creating..."
          >
            Create Property
          </Button>
        </HStack>
      </VStack>
      
      <WalletConnectModal isOpen={isOpen} onClose={onClose} handleConnect={handleConnect} isLoading={isLoading} />
    </Container>
  );
}; 
import { useState, useEffect } from 'react';
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
import { FaDollarSign, FaPlus, FaTrash, FaUpload, FaImage, FaRandom } from 'react-icons/fa';
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
  const { user, isLoading, connect } = useAuth();
  const { create, loading, error } = useProperty();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formError, setFormError] = useState<string | null>(null);
  
  // Adiciona estado para campos com erro
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    country: '',
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
    if (name === 'gpsCoordinates') {
      console.log('[GPS Input] handleInputChange:', value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
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
  
  const handleRandomFill = () => {
    console.log('[CreateProperty] Iniciando preenchimento aleatório');
    const timestamp = new Date().getTime();
    const randomIndex = timestamp % 10;
    console.log('[CreateProperty] Índice aleatório gerado:', randomIndex);
    
    fetch('/random-rwa-data.json')
      .then(response => {
        console.log('[CreateProperty] Resposta do fetch:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[CreateProperty] Dados carregados do JSON:', data);
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Dados inválidos no arquivo JSON');
        }
        const randomRWA = data[randomIndex];
        console.log('[CreateProperty] RWA aleatório selecionado:', randomRWA);
        
        if (!randomRWA) {
          throw new Error('Índice aleatório inválido');
        }
        setFormData({
          ...formData,
          name: randomRWA.name || '',
          description: randomRWA.description || '',
          city: randomRWA.city || '',
          country: randomRWA.country || '',
          price: randomRWA.currentValue?.toString() || '',
          totalTokens: randomRWA.totalTokens?.toString() || '',
          yearBuilt: randomRWA.yearBuilt?.toString() || '',
          squareMeters: randomRWA.sizeM2?.toString() || '',
          gpsCoordinates: randomRWA.gpsCoordinates || '',
        });
        console.log('[CreateProperty] Formulário atualizado com dados aleatórios');
      })
      .catch(error => {
        console.error('[CreateProperty] Error loading random data:', error);
        toast({
          title: "Error",
          description: "Could not load random data. Please check if the random-rwa-data.json file is in the public folder.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateProperty] Iniciando submissão do formulário');
    console.log('[CreateProperty] formData no início do submit:', formData);
    console.log('[CreateProperty] formData.gpsCoordinates no início do submit:', formData.gpsCoordinates);
    
    setFormError(null);
    setFieldErrors({});
    
    // Basic validation
    const newFieldErrors: {[key: string]: boolean} = {};
    let hasErrors = false;
    
    if (!formData.name) {
      newFieldErrors.name = true;
      hasErrors = true;
    }
    
    if (!formData.city) {
      newFieldErrors.city = true;
      hasErrors = true;
    }
    
    if (!formData.country) {
      newFieldErrors.country = true;
      hasErrors = true;
    }
    
    if (!formData.gpsCoordinates) {
      newFieldErrors.gpsCoordinates = true;
      hasErrors = true;
    }
    
    if (!formData.price) {
      newFieldErrors.price = true;
      hasErrors = true;
      console.log('[CreateProperty] Erro: Preço ausente');
    }
    
    if (!formData.totalTokens) {
      newFieldErrors.totalTokens = true;
      hasErrors = true;
    }
    
    if (hasErrors) {
      console.log('[CreateProperty] Erros de validação encontrados:', newFieldErrors);
      setFieldErrors(newFieldErrors);
      setFormError("Please fill in all required fields");
      toast({
        title: "Incomplete Fields",
        description: "Please fill in all required fields",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description || '',
        location: `${formData.city}, ${formData.country}`,
        city: formData.city,
        country: formData.country,
        currentValue: parseFloat(formData.price),
        totalTokens: parseInt(formData.totalTokens),
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : 0,
        sizeM2: formData.squareMeters ? parseInt(formData.squareMeters) : 0,
        gpsCoordinates: formData.gpsCoordinates,
        status: 'active' as 'active',
        geometry: {},
        metadata: {
          images: formData.images,
          documents: formData.documents,
          amenities: formData.amenities,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : 0,
          squareMeters: formData.squareMeters ? parseInt(formData.squareMeters) : 0,
          gpsCoordinates: formData.gpsCoordinates,
        },
      };
      console.log('[CreateProperty] gpsCoordinates no formData:', formData.gpsCoordinates);
      console.log('[CreateProperty] gpsCoordinates no payload:', payload.gpsCoordinates);
      console.log('[CreateProperty] gpsCoordinates no payload.metadata:', payload.metadata.gpsCoordinates);
      
      // Validação adicional para campos obrigatórios
      if (!formData.city || !formData.country) {
        console.log('[CreateProperty] Error: City or country missing');
        throw new Error('City and country are required');
      }
      
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        console.log('[CreateProperty] Error: Invalid price');
        throw new Error('Property value is required and must be a valid number');
      }
      
      console.log('[CreateProperty] Payload antes do envio:', JSON.stringify(payload, null, 2));
      console.log('[CreateProperty] Tipos dos campos:', {
        name: typeof payload.name,
        description: typeof payload.description,
        location: typeof payload.location,
        city: typeof payload.city,
        country: typeof payload.country,
        currentValue: typeof payload.currentValue,
        totalTokens: typeof payload.totalTokens,
        yearBuilt: typeof payload.yearBuilt,
        sizeM2: typeof payload.sizeM2,
        gpsCoordinates: typeof payload.gpsCoordinates,
        status: typeof payload.status,
        geometry: typeof payload.geometry,
        metadata: typeof payload.metadata
      });

      const property = await create(payload);
      console.log('[CreateProperty] Resposta do backend:', property);

      toast({
        title: "Property Created",
        description: `Property "${formData.name}" was created successfully`,
        status: "success",
        duration: 5000,
        isClosable: true
      });
      navigate('/assets');
    } catch (err: any) {
      console.error('[CreateProperty] Erro ao criar propriedade:', err);
      console.error('[CreateProperty] Stack trace:', err.stack);
      
      if (err.response) {
        console.error('[CreateProperty] Erro detalhado do backend:', err.response.data);
        console.error('[CreateProperty] Status do erro:', err.response.status);
        console.error('[CreateProperty] Headers da resposta:', err.response.headers);
      }
      
      let errorMessage = "";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors) {
        if (Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.join('; ');
        } else if (typeof err.response.data.errors === 'object') {
          errorMessage = Object.values(err.response.data.errors).flat().join('; ');
        } else {
          errorMessage = String(err.response.data.errors);
        }
      } else if (error) {
        errorMessage = error;
      } else {
        errorMessage = "An error occurred while creating the property";
      }
      
      const newFieldErrors: {[key: string]: boolean} = {};
      const errorLower = errorMessage.toLowerCase();
      
      if (errorLower.includes('name')) newFieldErrors.name = true;
      if (errorLower.includes('city')) newFieldErrors.city = true;
      if (errorLower.includes('country')) newFieldErrors.country = true;
      if (errorLower.includes('coordinates') || errorLower.includes('gps')) newFieldErrors.gpsCoordinates = true;
      if (errorLower.includes('price') || errorLower.includes('value')) newFieldErrors.price = true;
      if (errorLower.includes('tokens')) newFieldErrors.totalTokens = true;
      
      console.log('[CreateProperty] Campos com erro:', newFieldErrors);
      
      setFieldErrors(newFieldErrors);
      setFormError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
  };

  useEffect(() => {
    console.log('[CreateProperty] formData atualizado:', formData);
    if (formData.gpsCoordinates !== undefined) {
      console.log('[CreateProperty] formData.gpsCoordinates:', formData.gpsCoordinates);
    }
  }, [formData]);

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
        
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="md">Basic Information</Heading>
          <Button
            leftIcon={<FaRandom />}
            onClick={handleRandomFill}
            variant="outline"
            colorScheme="blue"
          >
            Fill Randomly
          </Button>
        </HStack>
        
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
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired isInvalid={!!fieldErrors.city}>
            <FormLabel>City</FormLabel>
            <Input 
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Ex: New York"
              bg="rgba(255,255,255,0.05)"
              border="1px solid"
              borderColor={fieldErrors.city ? "red.500" : "bgGrid"}
            />
          </FormControl>
          
          <FormControl isRequired isInvalid={!!fieldErrors.country}>
            <FormLabel>Country</FormLabel>
            <Input 
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Ex: United States"
              bg="rgba(255,255,255,0.05)"
              border="1px solid"
              borderColor={fieldErrors.country ? "red.500" : "bgGrid"}
            />
          </FormControl>
        </SimpleGrid>
        
        <FormControl isRequired isInvalid={!!fieldErrors.gpsCoordinates}>
          <FormLabel>GPS Coordinates</FormLabel>
          <Input 
            name="gpsCoordinates"
            value={formData.gpsCoordinates}
            onChange={e => {
              console.log('[GPS Input] Valor digitado:', e.target.value);
              handleInputChange(e);
            }}
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
            isLoading={loading}
            loadingText="Creating..."
          >
            Create Property
          </Button>
        </HStack>
      </VStack>
      
      <WalletConnectModal
        isOpen={isOpen}
        onClose={onClose}
        isLoading={isLoading}
        handleConnect={connect}
      />
    </Container>
  );
}; 
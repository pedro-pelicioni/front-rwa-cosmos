import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  AlertDescription,
  CloseButton,
  Image,
  Flex,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Icon as ChakraIcon,
  IconProps
} from '@chakra-ui/react';
import { FaDollarSign, FaPlus, FaTrash, FaUpload, FaImage } from 'react-icons/fa';
import { useAuth } from '../hooks';
import { useProperty } from '../hooks/useProperty';
import { imageService } from '../services/imageService';
import { RWAImage } from '../types/rwa';
import { getImageCookie, setImageCookie } from '../utils/imageCookieCache';
import { WalletConnectModal } from '../components/WalletConnectModal';

export const EditProperty = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const { user, connect } = useAuth();
  const { getById, update, loading, error } = useProperty();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [propertyImages, setPropertyImages] = useState<RWAImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!id) {
      navigate('/assets');
      return;
    }

    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const property = await getById(id);
        
        // Preencher o formulário com os dados da propriedade
        setFormData({
          name: property.name || '',
          description: property.description || '',
          location: property.location || '',
          price: property.price?.toString() || '',
          totalTokens: property.totalTokens?.toString() || '',
          images: property.metadata?.images || [],
          documents: property.metadata?.documents || [],
          amenities: property.metadata?.amenities || [],
          yearBuilt: property.metadata?.yearBuilt?.toString() || '',
          squareMeters: property.metadata?.squareMeters?.toString() || '',
          gpsCoordinates: property.metadata?.gpsCoordinates || '',
        });
        
        // Buscar as imagens da propriedade
        fetchPropertyImages(parseInt(id));
      } catch (err) {
        console.error('Erro ao buscar propriedade:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da propriedade.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/assets');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchPropertyImages = async (rwaId: number) => {
      try {
        setLoadingImages(true);
        console.log('Buscando imagens para o RWA ID:', rwaId);
        const images = await imageService.getByRWAId(rwaId);
        console.log('Imagens encontradas:', images);
        setPropertyImages(images);
        // Se encontrarmos imagens, atualizamos também o formData.images
        if (images.length > 0) {
          setFormData(prev => {
            return {
              ...prev,
              images: images.map(img => {
                const cacheKey = `rwa_image_${rwaId}_${img.id}`;
                let url = getImageCookie(cacheKey);
                if (!url) {
                  url = img.image_data || img.file_path || img.cid_link || '';
                  setImageCookie(cacheKey, url);
                }
                return url;
              })
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !id) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Simulação de progresso para melhor experiência de usuário
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload da imagem
      const result = await imageService.upload(
        parseInt(id), 
        selectedFile, 
        `Imagem ${formData.images.length + 1}`, 
        `Imagem para a propriedade ${formData.name}`
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Adicionar a URL da imagem à lista
      if (result.file_path || result.cid_link) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.file_path || result.cid_link]
        }));
      }

      toast({
        title: 'Upload concluído',
        description: 'A imagem foi adicionada com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Limpar após o upload
      setSelectedFile(null);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer o upload da imagem.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para editar uma propriedade.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setFormError(null);
    setFieldErrors({});
    
    // Validação básica
    const newFieldErrors: {[key: string]: boolean} = {};
    let hasErrors = false;
    
    if (!formData.name) {
      newFieldErrors.name = true;
      hasErrors = true;
    }
    
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
    
    if (!id) {
      navigate('/assets');
      return;
    }
    
    try {
      await update(id, {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        totalTokens: parseInt(formData.totalTokens),
        metadata: {
          images: formData.images,
          documents: formData.documents,
          amenities: formData.amenities,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
          squareMeters: formData.squareMeters ? parseFloat(formData.squareMeters) : undefined,
          gpsCoordinates: formData.gpsCoordinates
        }
      });
      
      toast({
        title: "Propriedade Atualizada",
        description: `Propriedade "${formData.name}" foi atualizada com sucesso`,
        status: "success",
        duration: 5000,
        isClosable: true
      });
      
      navigate(`/assets/${id}`);
    } catch (err: any) {
      console.error('Erro ao atualizar propriedade:', err);
      
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
        errorMessage = "Ocorreu um erro ao atualizar a propriedade";
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

  // Nova função para deletar imagem de verdade
  const handleDeleteImage = async (imageId: number, index: number) => {
    try {
      await imageService.delete(imageId);
      setPropertyImages(images => images.filter(img => img.id !== imageId));
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      toast({
        title: 'Imagem excluída',
        description: 'A imagem foi removida com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: 'Erro ao excluir imagem',
        description: 'Não foi possível remover a imagem.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error loading property data</p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch" as="form" onSubmit={handleSubmit}>
        <Box>
          <Heading size="xl" mb={2}>Edit Property</Heading>
          <Text color="text.dim">Atualize the information of this tokenized property</Text>
        </Box>
        
        {formError && (
          <Alert status="error" variant="solid" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{formError}</AlertDescription>
            <CloseButton position="absolute" right="8px" top="8px" onClick={() => setFormError(null)} />
          </Alert>
        )}
        
        <Divider borderColor="bgGrid" />
        
        <Tabs variant="enclosed" colorScheme="orange">
          <TabList>
            <Tab>Basic Information</Tab>
            <Tab>Images</Tab>
            <Tab>Extras</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
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
                    Required format: City, Country (ex: São Paulo, Brasil)
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
                        <ChakraIcon as={FaDollarSign as any} color="gray.300" />
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
              </VStack>
            </TabPanel>
            
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>Property Images</Heading>
                  
                  <FormControl mb={6}>
                    <FormLabel>Add Image by URL</FormLabel>
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
                        leftIcon={<ChakraIcon as={FaPlus as any} />} 
                        onClick={addImage}
                        variant="outline"
                        px={8}
                      >
                        Add
                      </Button>
                    </HStack>
                  </FormControl>
                  
                  <FormControl mb={6}>
                    <FormLabel>Upload New Image</FormLabel>
                    <HStack mb={2}>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        bg="rgba(255,255,255,0.05)"
                        border="1px solid"
                        borderColor="bgGrid"
                        py={1}
                        height="auto"
                      />
                      <Button
                        leftIcon={<ChakraIcon as={FaUpload as any} />}
                        onClick={handleFileUpload}
                        variant="outline"
                        px={8}
                        isLoading={isUploading}
                        loadingText="Sending..."
                        isDisabled={!selectedFile}
                      >
                        Upload
                      </Button>
                    </HStack>
                    
                    {uploadProgress > 0 && (
                      <Box mt={2} h="8px" w="100%" bg="gray.200" borderRadius="md">
                        <Box 
                          h="100%" 
                          w={`${uploadProgress}%`} 
                          bg="green.400" 
                          borderRadius="md"
                          transition="width 0.3s ease-in-out"
                        />
                      </Box>
                    )}
                  </FormControl>
                  
                  <Divider my={4} />
                  
                  <Heading size="sm" mb={4}>Current Images</Heading>
                  
                  {loadingImages ? (
                    <Flex 
                      width="100%" 
                      height="200px" 
                      justifyContent="center" 
                      alignItems="center"
                      bg="rgba(255,255,255,0.05)"
                      borderRadius="md"
                    >
                      <Spinner size="xl" color="accent.500" />
                    </Flex>
                  ) : formData.images.length === 0 ? (
                    <Box 
                      p={6} 
                      bg="rgba(255,255,255,0.05)" 
                      borderRadius="md" 
                      textAlign="center"
                    >
                      <ChakraIcon as={FaImage as any} size={40} style={{ margin: '0 auto 16px' }} />
                      <Text>No image added</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                      {formData.images.map((image, index) => (
                        <Box 
                          key={index}
                          position="relative"
                          borderRadius="md"
                          overflow="hidden"
                          border="1px solid"
                          borderColor="bgGrid"
                        >
                          <Image 
                            src={image}
                            alt={`Property image ${index + 1}`}
                            width="100%"
                            height="150px"
                            objectFit="cover"
                          />
                          <Flex 
                            position="absolute"
                            top={0}
                            right={0}
                            p={2}
                          >
                            <IconButton
                              icon={<ChakraIcon as={FaTrash as any} />}
                              aria-label="Remove image"
                              size="sm"
                              colorScheme="red"
                              variant="solid"
                              onClick={() => handleDeleteImage(propertyImages[index]?.id, index)}
                            />
                          </Flex>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              </VStack>
            </TabPanel>
            
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
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
                      leftIcon={<ChakraIcon as={FaPlus as any} />} 
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
                      leftIcon={<ChakraIcon as={FaPlus as any} />} 
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
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Divider borderColor="bgGrid" my={4} />
        
        <HStack justifyContent="space-between">
          <Button 
            variant="outline"
            onClick={() => navigate(`/assets/${id}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="primary"
            isLoading={loading}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
      
      {/* Wallet connection modal */}
      <WalletConnectModal 
        isOpen={isOpen} 
        onClose={onClose} 
        handleConnect={connect} 
        isLoading={loading} 
      />
    </Container>
  );
}; 
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Flex,
  Spinner,
  Avatar,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image
} from '@chakra-ui/react';
import { useAuth } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { tokenService } from '../services/tokenService';
import { kycService } from '../services/kycService';
import { imageService } from '../services/imageService';

interface Token {
  id: number;
  token_identifier: string;
  owner_user_id: number;
  rwa_id: number;
  metadata_uri: string;
  created_at: string;
  property?: {
    name: string;
    currentValue: number;
  };
}

interface Property {
  id: number;
  name: string;
  city: string;
  currentValue: number;
  totalTokens: number;
  availableTokens: number;
  status: string;
}

export const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [kycData, setKycData] = useState<any>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    documento_frente: null as File | null,
    documento_verso: null as File | null,
    selfie_1: null as File | null,
    selfie_2: null as File | null,
  });
  const [docPreviews, setDocPreviews] = useState<{[key: string]: string}>({});
  const [propertyImagesCount, setPropertyImagesCount] = useState<{[propertyId: number]: number}>({});
  const [uploadModal, setUploadModal] = useState<{ open: boolean; propertyId: number | null }>({ open: false, propertyId: null });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('[UserDashboard] Componente montado');
    return () => {
      console.log('[UserDashboard] Componente desmontado');
    };
  }, []);

  const fetchData = useCallback(async () => {
    console.log('[UserDashboard] fetchData chamado');
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Busca dados KYC
      const kycResponse = await kycService.getStatus();
      setKycData(kycResponse);

      // Busca tokens
      const tokensResponse = await tokenService.getByOwner(Number(user.id));
      setTokens(tokensResponse);

      // Busca propriedades (RWAs do usuário)
      const propertiesResponse = await apiClient.get('/api/rwa');
      const allProperties = propertiesResponse.data || [];
      console.log('[UserDashboard] Todos os RWAs recebidos da API:', allProperties);
      console.log('[UserDashboard] Usuário logado:', user);
      // Filtro flexível
      const userProperties = allProperties.filter((p: any) =>
        p.userId === user.id ||
        (p.owner && p.owner.id === user.id)
      );
      console.log('[UserDashboard] Properties after filter:', userProperties);
      setProperties(userProperties);
      setTotalPages(Math.ceil((userProperties.length || 0) / itemsPerPage));
      console.log('[UserDashboard] setProperties chamado com:', userProperties);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    console.log('[UserDashboard] useEffect: properties mudou para:', properties);
  }, [properties]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Novo: tratar status unauthorized
  useEffect(() => {
    if (kycData?.status === 'unauthorized') {
      toast({
        title: 'Session expired',
        description: 'Please log in again to access your data.',
        status: 'warning',
        duration: 8000,
        isClosable: true,
      });
    }
  }, [kycData, toast]);

  // Buscar quantidade de imagens para cada property
  useEffect(() => {
    async function fetchImagesCount() {
      const counts: {[propertyId: number]: number} = {};
      for (const property of properties) {
        try {
          const imgs = await imageService.getByRWAId(property.id);
          counts[property.id] = imgs.length;
        } catch {
          counts[property.id] = 0;
        }
      }
      setPropertyImagesCount(counts);
    }
    if (properties.length > 0) fetchImagesCount();
  }, [properties]);

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await kycService.submitBasic({
        nome: formData.fullName,
        cpf: formData.cpf
      });
      onClose();
      toast({ title: 'Data sent!', status: 'success' });
      setIsDocModalOpen(true);
      fetchData();
    } catch (err: any) {
      toast({ 
        title: 'Error sending data', 
        description: err.message,
        status: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartKYC = () => {
    if (!kycData?.fullName) {
      onOpen();
    } else {
      setIsDocModalOpen(true);
    }
  };

  const getKYCStatus = () => {
    if (!kycData) return 'not_started';
    return kycData.status;
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  // Manipula input de arquivos
  const handleDocInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setDocForm(prev => ({ ...prev, [name]: files[0] }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocPreviews(prev => ({ ...prev, [name]: reader.result as string }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  // Submit dos documentos
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (docForm.documento_frente) formData.append('documento_frente', docForm.documento_frente);
      if (docForm.documento_verso) formData.append('documento_verso', docForm.documento_verso);
      if (docForm.selfie_1) formData.append('selfie_1', docForm.selfie_1);
      if (docForm.selfie_2) formData.append('selfie_2', docForm.selfie_2);
      
      await kycService.submitDocuments(formData);
      toast({ title: 'Documents sent!', status: 'success' });
      setIsDocModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ 
        title: 'Error sending documents', 
        description: err.message,
        status: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para upload de imagem
  const handleImageUpload = async () => {
    if (!selectedFile || !uploadModal.propertyId) return;
    if (selectedFile.size > 1024 * 1024) {
      toast({ title: 'Image too large. Please select a file up to 1MB.', status: 'error' });
      return;
    }
    setUploading(true);
    try {
      await imageService.upload(
        uploadModal.propertyId,
        selectedFile,
        `Image for property ${uploadModal.propertyId}`,
        ''
      );
      toast({ title: 'Image uploaded successfully!', status: 'success' });
      // Atualiza a contagem de imagens
      setPropertyImagesCount(prev => ({
        ...prev,
        [uploadModal.propertyId!]: (prev[uploadModal.propertyId!] || 0) + 1
      }));
      setUploadModal({ open: false, propertyId: null });
      setSelectedFile(null);
    } catch (err) {
      toast({ title: 'Error uploading image', status: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // LOG: propriedades antes do render
  console.log('[UserDashboard] Properties to render:', properties);

  if (kycData?.status === 'unauthorized') {
    return (
      <Box p={8} textAlign="center">
        <Alert status="warning" mb={6} justifyContent="center">
          <AlertIcon />
          Your session has expired. Please log in again.
        </Alert>
        <Button colorScheme="blue" onClick={() => navigate('/login')}>Log In</Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading wallet data...</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Card with logged-in user information */}
      <Card mb={8} bg="rgba(255,255,255,0.10)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <HStack spacing={4} align="center">
            <Avatar name={user?.name || user?.email} size="lg" />
            <Box>
              <Heading size="md" color="white">{user?.name || 'User'}</Heading>
              <Text color="gray.300">{user?.email}</Text>
              {user?.address && (
                <Text color="gray.400" fontSize="sm">Wallet: {user.address}</Text>
              )}
              {kycData?.nome && kycData?.cpf && (
                <VStack align="start" spacing={0} mt={2}>
                  <Text color="gray.300" fontSize="sm">Name: {kycData.nome}</Text>
                  <Text color="gray.300" fontSize="sm">Document (CPF): {kycData.cpf}</Text>
                </VStack>
              )}
            </Box>
          </HStack>
        </CardHeader>
      </Card>
      <Grid templateColumns="repeat(2, 1fr)" gap={8}>
        {/* Summary */}
        <GridItem colSpan={2}>
          <Flex gap={8}>
            <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
              <CardHeader>
                <Heading size="md" color="white">My Investments</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Text color="text.dim">Total Invested</Text>
                    <Text fontSize="xl" fontWeight="bold">${tokens.reduce((acc, t) => acc + (t.property?.currentValue || 0), 0).toLocaleString('en-US')}</Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text color="text.dim">Tokens Owned</Text>
                    <Text fontSize="xl" fontWeight="bold">{tokens.length}</Text>
                  </Flex>
                  <Divider />
                  <Button variant="outline" onClick={() => navigate('/marketplace')}>View History</Button>
                </VStack>
              </CardBody>
            </Card>

            {/* KYC Status */}
            <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
              <CardHeader>
                <Heading size="md" color="white">KYC Status</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Text color="text.dim">Status:</Text>
                    <Badge colorScheme={getKYCStatusColor(getKYCStatus())}>
                      {getKYCStatus() === 'not_started' ? 'Pending' : getKYCStatus()}
                    </Badge>
                  </Flex>
                  {getKYCStatus() !== 'approved' && (
                    <Alert status="warning">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>KYC Pending</AlertTitle>
                        <AlertDescription>
                          Complete your registration to invest and create RWA tokens
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                  <Button colorScheme="blue" onClick={handleStartKYC} isDisabled={getKYCStatus() === 'approved'}>
                    {getKYCStatus() === 'not_started' ? 'Start KYC' : 'Check KYC'}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Flex>
        </GridItem>

        {/* Detailed Tokens and Properties */}
        <GridItem colSpan={2}>
          <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" color="white">My Properties</Heading>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => navigate('/assets/new')}
                >
                  Add RWA
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              {properties.length > 0 ? (
                <TableContainer borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.700" bg="rgba(255,255,255,0.01)">
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.800">
                      <Tr>
                        <Th color="gray.300" fontWeight="bold" py={3}>NAME</Th>
                        <Th color="gray.300" fontWeight="bold" py={3}>LOCATION</Th>
                        <Th color="gray.300" fontWeight="bold" py={3}>VALUE</Th>
                        <Th color="gray.300" fontWeight="bold" py={3}>STATUS</Th>
                        <Th color="gray.300" fontWeight="bold" py={3}>IMAGES</Th>
                        <Th color="gray.300" fontWeight="bold" py={3}>UPLOAD</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {properties.map((property, idx) => (
                        <Tr
                          key={property.id}
                          bg={idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'}
                          _hover={{ bg: 'blue.900' }}
                          transition="background 0.2s"
                        >
                          <Td color="gray.100" fontWeight="medium" py={3}>{property.name}</Td>
                          <Td color="gray.200" py={3}>{property.city}</Td>
                          <Td color="gray.200" py={3}>${property.currentValue.toLocaleString('en-US')}</Td>
                          <Td py={3}>
                            <Badge
                              px={3}
                              py={1}
                              borderRadius="md"
                              fontWeight="bold"
                              colorScheme={
                                property.status === 'active' ? 'green' :
                                property.status === 'inactive' ? 'gray' : 'red'
                              }
                              variant="solid"
                              fontSize="sm"
                              textTransform="uppercase"
                              letterSpacing="wider"
                            >
                              {property.status}
                            </Badge>
                          </Td>
                          <Td color="gray.200" py={3}>{propertyImagesCount[property.id] ?? <Spinner size="xs" />}</Td>
                          <Td color="gray.200" py={3}>
                            <Button size="xs" onClick={() => setUploadModal({ open: true, propertyId: property.id })}>
                              Upload Image
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Text color="text.dim">No properties found</Text>
              )}
              {totalPages > 1 && (
                <HStack justify="center" mt={4}>
                  <Button
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    isDisabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Text>Page {page} of {totalPages}</Text>
                  <Button
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    isDisabled={page === totalPages}
                  >
                    Next
                  </Button>
                </HStack>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* KYC Initial Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="primary.500" color="text.light">
          <form onSubmit={handleKYCSubmit}>
            <ModalHeader>Complete your Registration</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>CPF</FormLabel>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="Enter your CPF"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue">
                Save
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Document Upload Modal */}
      <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)}>
        <ModalOverlay />
        <ModalContent bg="primary.500" color="text.light">
          <form onSubmit={handleDocSubmit}>
            <ModalHeader>Upload KYC Documents</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Document (front)</FormLabel>
                  <Input name="documento_frente" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.documento_frente && (
                    <Image src={docPreviews.documento_frente} alt="Front" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Document (back)</FormLabel>
                  <Input name="documento_verso" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.documento_verso && (
                    <Image src={docPreviews.documento_verso} alt="Back" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Selfie holding document</FormLabel>
                  <Input name="selfie_1" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.selfie_1 && (
                    <Image src={docPreviews.selfie_1} alt="Selfie 1" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Additional Selfie</FormLabel>
                  <Input name="selfie_2" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.selfie_2 && (
                    <Image src={docPreviews.selfie_2} alt="Selfie 2" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setIsDocModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue">
                Send
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Image Upload Modal */}
      <Modal isOpen={uploadModal.open} onClose={() => { setUploadModal({ open: false, propertyId: null }); setSelectedFile(null); }} isCentered>
        <ModalOverlay />
        <ModalContent bg="primary.500" color="text.light" borderRadius="lg" boxShadow="2xl" border="1px solid #2a3656" minW="350px">
          <ModalHeader fontWeight="bold">Upload Image</ModalHeader>
          <ModalCloseButton color="gray.200" />
          <ModalBody>
            <FormControl>
              <FormLabel>Select image (max 1MB)</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                bg="rgba(30,40,70,0.95)"
                color="gray.100"
                borderColor="#3a4a6a"
                _placeholder={{ color: 'gray.400' }}
                _hover={{ borderColor: 'blue.400' }}
                _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3182ce' }}
              />
              {selectedFile && (
                <Text mt={2} fontSize="sm" color="blue.200">{selectedFile.name}</Text>
              )}
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => { setUploadModal({ open: false, propertyId: null }); setSelectedFile(null); }}
              color="gray.200"
              _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleImageUpload}
              isLoading={uploading}
              isDisabled={!selectedFile}
              fontWeight="bold"
              px={6}
              boxShadow="md"
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 
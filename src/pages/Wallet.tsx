import { useState, useEffect, useCallback, useRef } from 'react';
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
import { marketplaceService } from '../services/marketplaceService';
import { imageService } from '../services/imageService';

interface KYCData {
  id?: number;
  userId: number;
  nome: string;
  cpf: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_started';
}

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
  location: string;
  currentValue: number;
  totalTokens: number;
  availableTokens: number;
  status: string;
}

export const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [kycData, setKycData] = useState<KYCData | null>(null);
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
  const isMounted = useRef(true);
  const fetchAttempted = useRef(false);
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
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id || fetchAttempted.current) {
      setLoading(false);
      return;
    }

    fetchAttempted.current = true;
    setLoading(true);

    try {
      // Busca dados KYC
      const kycResponse = await apiClient.get('/api/users/kyc');
      if (isMounted.current) {
        setKycData(kycResponse.data);
      }

      // Busca tokens
      const tokensResponse = await tokenService.getByOwner(Number(user.id));
      if (isMounted.current) {
        setTokens(tokensResponse);
      }

      // Busca propriedades
      const propertiesResponse = await apiClient.get(`/api/rwa/user/${user.id}`);
      if (isMounted.current) {
        setProperties(propertiesResponse.data || []);
        setTotalPages(Math.ceil((propertiesResponse.data?.length || 0) / itemsPerPage));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      const response = await apiClient.post('/api/users/kyc/basic', {
        nome: formData.fullName,
        cpf: formData.cpf
      });
      // Se quiser, salve o kyc_id: response.data.kyc_id
      onClose();
      toast({ title: 'Dados enviados!', status: 'success' });
      // Agora mostre o botão para upload de documentos
    } catch (err) {
      toast({ title: 'Erro ao enviar dados', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartKYC = () => {
    if (!kycData?.nome) {
      onOpen();
    } else {
      navigate('/kyc');
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

  // Função para abrir modal de documentos após dados básicos
  const openDocModal = () => setIsDocModalOpen(true);
  const closeDocModal = () => setIsDocModalOpen(false);

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
      await apiClient.post('/api/users/kyc/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Documentos enviados!', status: 'success' });
      closeDocModal();
      // Atualize o status do KYC se desejar
    } catch (err) {
      toast({ title: 'Erro ao enviar documentos', status: 'error' });
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
      <Heading size="xl" mb={8}>My Account</Heading>
      <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
        {/* Profile */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Heading size="md" color="white">Profile</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={4}>
                <Avatar size="xl" name={user?.name || user?.address || 'User'} />
                <Box>
                  <Text fontSize="lg" fontWeight="bold">{user?.name || 'User'}</Text>
                  <Text color="text.dim">{user?.address}</Text>
                  {kycData?.nome && kycData?.cpf && (
                    <VStack align="start" spacing={0} mt={2}>
                      <Text color="text.dim" fontSize="sm">Nome: {kycData.nome}</Text>
                      <Text color="text.dim" fontSize="sm">CPF: {kycData.cpf}</Text>
                    </VStack>
                  )}
                </Box>
              </Flex>
              <Divider />
              <Button variant="outline">Edit Profile</Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Investments */}
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
      </Flex>

      {/* KYC Status */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" mt={8}>
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

      {/* Tokens and Properties */}
      <Flex gap={8} direction={{ base: 'column', lg: 'row' }} mt={8}>
        {/* Tokens */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Heading size="md" color="white">My Tokens</Heading>
          </CardHeader>
          <CardBody>
            {tokens.length > 0 ? (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Token</Th>
                      <Th>Property</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tokens.map(token => (
                      <Tr key={token.id}>
                        <Td>{token.token_identifier}</Td>
                        <Td>{token.property?.name || 'N/A'}</Td>
                        <Td>${token.property?.currentValue || 0}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Text color="text.dim">No tokens found</Text>
            )}
          </CardBody>
        </Card>

        {/* Properties */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
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
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Location</Th>
                      <Th>Value</Th>
                      <Th>Status</Th>
                      <Th>Images</Th>
                      <Th>Upload</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {properties
                      .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                      .map(property => (
                        <Tr key={property.id}>
                          <Td>{property.name}</Td>
                          <Td>{property.location}</Td>
                          <Td>${property.currentValue}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                property.status === 'active' ? 'green' :
                                property.status === 'inactive' ? 'gray' : 'red'
                              }
                            >
                              {property.status}
                            </Badge>
                          </Td>
                          <Td>{propertyImagesCount[property.id] ?? <Spinner size="xs" />}</Td>
                          <Td>
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
      </Flex>

      {/* Button to open document modal after basic data */}
      <Button colorScheme="blue" mt={4} onClick={openDocModal}>
        Upload Documents (KYC)
      </Button>

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

      {/* Document upload modal */}
      <Modal isOpen={isDocModalOpen} onClose={closeDocModal}>
        <ModalOverlay />
        <ModalContent bg="primary.500" color="text.light">
          <form onSubmit={handleDocSubmit}>
            <ModalHeader>KYC Document Upload</ModalHeader>
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
                  <FormLabel>Additional selfie</FormLabel>
                  <Input name="selfie_2" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.selfie_2 && (
                    <Image src={docPreviews.selfie_2} alt="Selfie 2" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={closeDocModal}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue">
                Send
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal isOpen={uploadModal.open} onClose={() => { setUploadModal({ open: false, propertyId: null }); setSelectedFile(null); }}>
        <ModalOverlay />
        <ModalContent bg="primary.500" color="text.light">
          <ModalHeader>Upload Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Select image (max 1MB)</FormLabel>
              <Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { setUploadModal({ open: false, propertyId: null }); setSelectedFile(null); }}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleImageUpload} isLoading={uploading} isDisabled={!selectedFile}>
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 
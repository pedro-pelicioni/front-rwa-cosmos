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

interface KYCData {
  id?: number;
  userId: number;
  fullName: string;
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
      console.error('Erro ao buscar dados:', error);
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
    if (!kycData?.fullName) {
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

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando dados da carteira...</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="xl" mb={8}>Minha Conta</Heading>
      <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
        {/* Perfil */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Heading size="md" color="white">Perfil</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={4}>
                <Avatar size="xl" name={user?.name || user?.address || 'Usuário'} />
                <Box>
                  <Text fontSize="lg" fontWeight="bold">{user?.name || 'Usuário'}</Text>
                  <Text color="text.dim">{user?.address}</Text>
                </Box>
              </Flex>
              <Divider />
              <Button variant="outline">Editar Perfil</Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Investimentos */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Heading size="md" color="white">Meus Investimentos</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Text color="text.dim">Total Investido</Text>
                <Text fontSize="xl" fontWeight="bold">${tokens.reduce((acc, t) => acc + (t.property?.currentValue || 0), 0).toLocaleString('en-US')}</Text>
              </Flex>
              <Flex justify="space-between" align="center">
                <Text color="text.dim">Tokens Possuídos</Text>
                <Text fontSize="xl" fontWeight="bold">{tokens.length}</Text>
              </Flex>
              <Divider />
              <Button variant="outline" onClick={() => navigate('/marketplace')}>Ver Histórico</Button>
            </VStack>
          </CardBody>
        </Card>
      </Flex>

      {/* Status KYC */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" mt={8}>
        <CardHeader>
          <Heading size="md" color="white">Status KYC</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text color="text.dim">Status:</Text>
              <Badge colorScheme={getKYCStatusColor(getKYCStatus())}>
                {getKYCStatus() === 'not_started' ? 'Pendente' : getKYCStatus()}
              </Badge>
            </Flex>
            {getKYCStatus() !== 'approved' && (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>KYC Pendente</AlertTitle>
                  <AlertDescription>
                    Complete seu cadastro para poder investir e criar tokens RWA
                  </AlertDescription>
                </Box>
              </Alert>
            )}
            <Button colorScheme="blue" onClick={handleStartKYC} isDisabled={getKYCStatus() === 'approved'}>
              {getKYCStatus() === 'not_started' ? 'Iniciar KYC' : 'Verificar KYC'}
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Tokens e Propriedades detalhados */}
      <Flex gap={8} direction={{ base: 'column', lg: 'row' }} mt={8}>
        {/* Tokens */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Heading size="md" color="white">Meus Tokens</Heading>
          </CardHeader>
          <CardBody>
            {tokens.length > 0 ? (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Token</Th>
                      <Th>Propriedade</Th>
                      <Th>Valor</Th>
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
              <Text color="text.dim">Nenhum token encontrado</Text>
            )}
          </CardBody>
        </Card>

        {/* Propriedades */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md" color="white">Minhas Propriedades</Heading>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => navigate('/assets/new')}
                isDisabled={getKYCStatus() !== 'approved'}
              >
                Adicionar RWA
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            {properties.length > 0 ? (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Nome</Th>
                      <Th>Localização</Th>
                      <Th>Valor</Th>
                      <Th>Status</Th>
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
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Text color="text.dim">Nenhuma propriedade encontrada</Text>
            )}
            {totalPages > 1 && (
              <HStack justify="center" mt={4}>
                <Button
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  isDisabled={page === 1}
                >
                  Anterior
                </Button>
                <Text>Página {page} de {totalPages}</Text>
                <Button
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  isDisabled={page === totalPages}
                >
                  Próxima
                </Button>
              </HStack>
            )}
          </CardBody>
        </Card>
      </Flex>

      {/* Botão para abrir modal de documentos após dados básicos */}
      <Button colorScheme="blue" mt={4} onClick={openDocModal}>
        Enviar Documentos (KYC)
      </Button>

      {/* Modal de KYC Inicial */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleKYCSubmit}>
            <ModalHeader>Complete seu Cadastro</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nome Completo</FormLabel>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Digite seu nome completo"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>CPF</FormLabel>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="Digite seu CPF"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" colorScheme="blue">
                Salvar
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de upload de documentos */}
      <Modal isOpen={isDocModalOpen} onClose={closeDocModal}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleDocSubmit}>
            <ModalHeader>Upload de Documentos KYC</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Documento (frente)</FormLabel>
                  <Input name="documento_frente" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.documento_frente && (
                    <Image src={docPreviews.documento_frente} alt="Frente" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Documento (verso)</FormLabel>
                  <Input name="documento_verso" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.documento_verso && (
                    <Image src={docPreviews.documento_verso} alt="Verso" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Selfie segurando documento</FormLabel>
                  <Input name="selfie_1" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.selfie_1 && (
                    <Image src={docPreviews.selfie_1} alt="Selfie 1" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Selfie adicional</FormLabel>
                  <Input name="selfie_2" type="file" accept="image/*" onChange={handleDocInput} />
                  {docPreviews.selfie_2 && (
                    <Image src={docPreviews.selfie_2} alt="Selfie 2" boxSize="60px" objectFit="cover" borderRadius="md" border="1px solid #444" />
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={closeDocModal}>
                Cancelar
              </Button>
              <Button type="submit" colorScheme="blue" isLoading={loading}>
                Enviar Documentos
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 
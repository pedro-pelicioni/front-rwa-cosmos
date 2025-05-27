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
  Spinner
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
      const kycResponse = await apiClient.get(`/api/kyc/${user.id}`);
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
    try {
      if (kycData?.id) {
        await apiClient.put(`/api/kyc/${kycData.id}`, formData);
      } else {
        await apiClient.post('/api/kyc', {
          ...formData,
          userId: user?.id,
          status: 'pending'
        });
      }

      toast({
        title: 'Dados salvos com sucesso!',
        status: 'success',
        duration: 3000
      });

      onClose();
      fetchData();
    } catch (error) {
      toast({
        title: 'Erro ao salvar dados',
        description: 'Tente novamente mais tarde',
        status: 'error',
        duration: 3000
      });
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
      <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={8}>
        {/* My Account Card */}
        <GridItem>
          <Box p={6} borderWidth={1} borderRadius="xl" bg="white" color="black">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Minha Conta</Heading>
              
              <Box>
                <Text fontWeight="bold">Status KYC</Text>
                <Badge colorScheme={getKYCStatusColor(getKYCStatus())}>
                  {getKYCStatus() === 'not_started' ? 'Não iniciado' : getKYCStatus()}
                </Badge>
              </Box>

              <Box>
                <Text fontWeight="bold">Número de Tokens</Text>
                <Text>{tokens.length}</Text>
              </Box>

              <Button
                colorScheme="blue"
                onClick={handleStartKYC}
                isDisabled={getKYCStatus() === 'approved'}
              >
                {getKYCStatus() === 'not_started' ? 'Iniciar KYC' : 'Verificar KYC'}
              </Button>
            </VStack>
          </Box>
        </GridItem>

        {/* My Tokens Card */}
        <GridItem>
          <Box p={6} borderWidth={1} borderRadius="xl" bg="white" color="black">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Meus Tokens</Heading>
              
              <Text>Total de Tokens: {tokens.length}</Text>

              <Button
                colorScheme="blue"
                onClick={() => navigate('/marketplace')}
                isDisabled={getKYCStatus() !== 'approved'}
              >
                Comprar Novos Tokens
              </Button>

              {tokens.length > 0 && (
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
              )}
            </VStack>
          </Box>
        </GridItem>

        {/* My Properties Card */}
        <GridItem>
          <Box p={6} borderWidth={1} borderRadius="xl" bg="white" color="black">
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Minhas Propriedades</Heading>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => navigate('/assets/new')}
                  isDisabled={getKYCStatus() !== 'approved'}
                >
                  Adicionar RWA
                </Button>
              </Flex>

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
                <Text>Nenhuma propriedade encontrada</Text>
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
            </VStack>
          </Box>
        </GridItem>
      </Grid>

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
    </Container>
  );
}; 
import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Heading, Text, Card, CardHeader, CardBody, CardFooter, SimpleGrid, Button, Flex, Badge, VStack, HStack, Divider, Spinner, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ButtonGroup, Image, Input, FormControl, FormLabel, Alert, AlertIcon, useToast, TableContainer, Table, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';
import { useAuth } from '../hooks';
import { useProperty } from '../hooks/useProperty';
import { Property } from '../types/Property';
import { tokenService } from '../services/tokenService';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { imageService } from '../services/imageService';
import { apiClient } from '../api/client';
import { getImageCookie, setImageCookie } from '../utils/imageCookieCache';
import keplrIcon from '../constants/keplr-icon.webp';
import metamaskIcon from '../constants/metamask-icon.png';
import coinbaseIcon from '../constants/coinbase-icon.webp';
import { WalletConnectModal } from '../components/WalletConnectModal';
import { kycService } from '../services/kycService';
import { FALLBACK_IMAGES } from '../constants/images';
import { authService } from '../services/authService';

interface KycData {
  id: number;
  userId: number;
  status: 'pending' | 'approved' | 'rejected';
  documentType: string;
  documentNumber: string;
  documentUrl: string;
  createdAt: string;
  updatedAt: string;
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export const UserDashboard = () => {
  const { user, connect, isLoading: authLoading, isAuthenticated } = useAuth();
  const { getAll, loading: loadingProperties } = useProperty();
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [propertyImages, setPropertyImages] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const toast = useToast();
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);
  const isMounted = useRef(false);
  const fetchAttempted = useRef(false);

  // KYC
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycForm, setKycForm] = useState({
    documentType: '',
    documentNumber: '',
    document: null as File | null
  });

  const [showKycModal, setShowKycModal] = useState(false);
  const [kycModalForm, setKycModalForm] = useState({
    nome: '',
    cpf: ''
  });

  const fetchKyc = useCallback(async () => {
    if (!isAuthenticated || !user?.id || fetchAttempted.current) return;
    fetchAttempted.current = true;

    try {
      const response = await kycService.getByUserId(user.id);
      if (!isMounted.current) return;
      setKycData(response);
    } catch (error: any) {
      if (!isMounted.current) return;
      console.error('Erro ao buscar dados KYC:', error);
      if (error?.response?.status === 401) {
        navigate('/login');
      }
      // Se não for erro 401, apenas define kycData como null
      setKycData(null);
    } finally {
      if (isMounted.current) {
        setIsLoadingKyc(false);
      }
    }
  }, [isAuthenticated, user?.id, navigate]);

  useEffect(() => {
    isMounted.current = true;
    if (isAuthenticated) {
      fetchKyc();
    } else {
      setIsLoadingKyc(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, fetchKyc]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Buscar propriedades do usuário
        const allProps = await getAll();
        const myProps = allProps.filter(p => p.owner === user.id?.toString() || p.owner === user.address);
        setMyProperties(myProps);

        // Buscar imagens das propriedades
        const imagesObj: {[key: string]: string} = {};
        await Promise.all(myProps.map(async (property) => {
          try {
            const images = await imageService.getByRWAId(Number(property.id));
            if (images.length > 0) {
              const img = images[0];
              const cacheKey = `rwa_image_${property.id}_${img.id}`;
              let url = getImageCookie(cacheKey);
              if (!url) {
                url = img.image_data || img.file_path || img.cid_link || '';
                setImageCookie(cacheKey, url);
              }
              imagesObj[property.id] = url;
            }
          } catch (error) {
            console.error(`Erro ao buscar imagem da propriedade ${property.id}:`, error);
          }
        }));
        setPropertyImages(imagesObj);

        // Buscar tokens do usuário
        setLoadingTokens(true);
        try {
          // Buscar tokens comprados
          const userTokens = await tokenService.getByOwner(Number(user.id));
          // Buscar tokens de propriedades do usuário
          const propertyTokens = await Promise.all(
            myProps.map(async (property) => {
              try {
                const tokens = await tokenService.getByRWAId(Number(property.id));
                return tokens.map(token => ({
                  ...token,
                  isPropertyOwner: true,
                  propertyName: property.name
                }));
              } catch (error) {
                console.error(`Erro ao buscar tokens da propriedade ${property.id}:`, error);
                return [];
              }
            })
          );
          // Combinar e remover duplicatas
          const allTokens = [
            ...userTokens,
            ...propertyTokens.flat()
          ].filter((token, index, self) => 
            index === self.findIndex(t => t.id === token.id)
          );
          setTokens(allTokens);
        } catch (error) {
          console.error('Erro ao buscar tokens:', error);
          setTokens([]);
        } finally {
          setLoadingTokens(false);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };
    fetchData();
  }, [user, getAll]);

  useEffect(() => {
    if (user && !kycData?.documentNumber) {
      setShowKycModal(true);
    }
  }, [user, kycData]);

  const handleKycInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setKycForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setKycForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);
    setKycLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentType', kycForm.documentType);
      formData.append('documentNumber', kycForm.documentNumber);
      if (kycForm.document) formData.append('document', kycForm.document);
      await apiClient.post('/api/users/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setKycStatus('pending');
      setShowKycForm(false);
    } catch (err: any) {
      setKycError(err.response?.data?.message || 'Erro ao enviar KYC');
    } finally {
      setKycLoading(false);
    }
  };

  const handleKycModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nome', kycModalForm.nome);
      formData.append('cpf', kycModalForm.cpf);
      
      await kycService.submitKyc(formData);
      
      setShowKycModal(false);
      fetchKyc();
      toast({
        title: 'Dados salvos com sucesso!',
        status: 'success',
        duration: 3000
      });
    } catch (error: any) {
      console.error('Erro ao salvar dados KYC:', error);
      
      if (error.message === 'Falha ao autenticar. Por favor, faça login novamente.') {
        toast({
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente',
          status: 'error',
          duration: 5000
        });
        navigate('/login');
        return;
      }
      
      toast({
        title: 'Erro ao salvar dados',
        description: error.response?.data?.message || 'Tente novamente mais tarde',
        status: 'error',
        duration: 3000
      });
    }
  };

  const getKycStatus = () => {
    if (!kycData) return 'not_started';
    if (!kycData.documentNumber) return 'not_started';
    if (!kycData.documentUrl) return 'pending';
    return kycData.status;
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'not_started': return 'Não iniciado';
      default: return 'Desconhecido';
    }
  };

  const isKycBlocked = () => {
    const status = getKycStatus();
    return status === 'not_started' || status === 'rejected';
  };

  if (!user) {
    return (
      <>
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
          <CardBody>
            <VStack spacing={6} py={8}>
              <Heading size="md">My Account</Heading>
              <Text textAlign="center" color="text.dim">
                To access your account, you need to connect your wallet first.
              </Text>
              <Button
                variant="primary"
                onClick={onOpen}
                isLoading={isLoadingKyc}
                loadingText="Connecting..."
              >
                Connect Wallet
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Wallet Selection Modal */}
        <WalletConnectModal isOpen={isOpen} onClose={onClose} handleConnect={connect} isLoading={isLoadingKyc} />
      </>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Card 1: Basic Info */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <Heading size="md" color="white">My Account</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text color="gray.200">Wallet Address:</Text>
              <Text color="white" fontFamily="mono" fontSize="sm">
                {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="gray.200">Number of Properties:</Text>
              <Text color="white">{myProperties.length}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="gray.200">Number of Tokens:</Text>
              <Text color="white">{tokens.length}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="gray.200">KYC Status:</Text>
              <Badge colorScheme={getKycStatusColor(getKycStatus())}>
                {getKycStatusText(getKycStatus())}
              </Badge>
            </Flex>
          </VStack>
        </CardBody>
      </Card>

      {/* Card 2: My Properties */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md" color="white">My Properties</Heading>
            <Button
              as={RouterLink}
              to="/create-property"
              variant="primary"
              size="sm"
            >
              Add New Property
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {loadingProperties ? (
            <Spinner />
          ) : myProperties.length === 0 ? (
            <Text color="gray.200">You don't have any properties.</Text>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color="white">Name</Th>
                    <Th color="white">Location</Th>
                    <Th color="white">Value</Th>
                    <Th color="white">Status</Th>
                    <Th color="white">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {myProperties.map((property) => (
                    <Tr key={property.id}>
                      <Td color="gray.200">{property.name}</Td>
                      <Td color="gray.200">{property.location}</Td>
                      <Td color="gray.200">{property.price ? `$${property.price.toLocaleString()}` : '-'}</Td>
                      <Td>
                        <Badge colorScheme={property.status === 'active' ? 'green' : 'yellow'}>
                          {property.status}
                        </Badge>
                      </Td>
                      <Td>
                        <ButtonGroup size="sm">
                          <Button
                            as={RouterLink}
                            to={`/assets/${property.id}`}
                            variant="outline"
                          >
                            View
                          </Button>
                          <Button
                            as={RouterLink}
                            to={`/assets/${property.id}/edit`}
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Card 3: My Tokens */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md" color="white">My Tokens</Heading>
            <Button
              as={RouterLink}
              to="/marketplace"
              variant="primary"
              size="sm"
            >
              Buy New Tokens
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {loadingTokens ? (
            <Spinner />
          ) : tokens.length === 0 ? (
            <Text color="gray.200">You don't have any tokens.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {tokens.map(token => (
                <Box key={token.id} borderWidth="1px" borderRadius="lg" p={4} bg="rgba(255,255,255,0.05)" borderColor="bgGrid">
                  <Badge colorScheme={token.isPropertyOwner ? "green" : "blue"} mb={2}>
                    {token.isPropertyOwner ? "Property Owner" : "Purchased"}
                  </Badge>
                  <Text color="gray.200"><b>Token ID:</b> {token.id}</Text>
                  <Text color="gray.200"><b>Property:</b> {token.propertyName || token.rwa_id}</Text>
                  <Text color="gray.200"><b>Quantity:</b> {token.quantity || '-'}</Text>
                  <Text color="gray.200"><b>Value:</b> {token.value ? `${token.value} USD` : '-'}</Text>
                  <Button as={RouterLink} to={`/tokens/${token.id}`} size="sm" mt={2} variant="outline">View Details</Button>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Card 4: KYC */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <Heading size="md" color="white">KYC Status</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text color="gray.200">Status:</Text>
              <Badge colorScheme={getKycStatusColor(getKycStatus())}>
                {getKycStatusText(getKycStatus())}
              </Badge>
            </Flex>
            {isKycBlocked() && (
              <Alert status="warning">
                <AlertIcon />
                <Text>
                  {getKycStatus() === 'not_started' 
                    ? 'Complete seu cadastro para poder investir e criar tokens RWA'
                    : 'Seu KYC foi rejeitado. Por favor, atualize seus documentos.'}
                </Text>
              </Alert>
            )}
            <Button
              colorScheme="blue"
              onClick={() => navigate('/kyc')}
              isDisabled={getKycStatus() === 'approved'}
            >
              {getKycStatus() === 'approved' ? 'KYC Aprovado' : 'Iniciar/Atualizar KYC'}
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Modal de KYC */}
      <Modal isOpen={showKycModal} onClose={() => setShowKycModal(false)}>
        <ModalOverlay />
        <ModalContent bg="primary.500" color="white">
          <ModalHeader>Complete seu cadastro</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleKycModalSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nome completo</FormLabel>
                  <Input
                    value={kycModalForm.nome}
                    onChange={(e) => setKycModalForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite seu nome completo"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>CPF</FormLabel>
                  <Input
                    value={kycModalForm.cpf}
                    onChange={(e) => setKycModalForm(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="Digite seu CPF"
                  />
                </FormControl>
                <Button type="submit" colorScheme="blue" width="full">
                  Salvar
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}; 
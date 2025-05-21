import { useEffect, useState } from 'react';
import { Box, Heading, Text, Card, CardHeader, CardBody, CardFooter, SimpleGrid, Button, Flex, Badge, VStack, HStack, Divider, Spinner, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ButtonGroup, Image, Input, FormControl, FormLabel, Alert, AlertIcon } from '@chakra-ui/react';
import { useAuth } from '../hooks/useAuth';
import { useProperty } from '../hooks/useProperty';
import { Property } from '../types/Property';
import { tokenService } from '../services/tokenService';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { imageService } from '../services/imageService';
import { apiClient } from '../api/client';
import { getImageCookie, setImageCookie } from '../utils/imageCookieCache';

export const UserDashboard = () => {
  const { user, handleConnect, isLoading } = useAuth();
  const { getAll, loading: loadingProperties } = useProperty();
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [propertyImages, setPropertyImages] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();

  // KYC
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycForm, setKycForm] = useState({
    nome: '',
    cpf: '',
    documento_frente: null as File | null,
    documento_verso: null as File | null,
    selfie_1: null as File | null,
    selfie_2: null as File | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      // Buscar propriedades do usuário
      const allProps = await getAll();
      const myProps = allProps.filter(p => p.owner === user.id?.toString() || p.owner === user.address);
      setMyProperties(myProps);
      // Buscar imagens das propriedades
      const imagesObj: {[key: string]: string} = {};
      await Promise.all(myProps.map(async (property) => {
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
      }));
      setPropertyImages(imagesObj);
      // Buscar tokens do usuário
      setLoadingTokens(true);
      try {
        const userTokens = await tokenService.getByOwner(Number(user.id));
        setTokens(userTokens);
      } catch {
        setTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    };
    fetchData();
  }, [user, getAll]);

  useEffect(() => {
    // Buscar status do KYC ao carregar
    const fetchKyc = async () => {
      try {
        setKycLoading(true);
        setKycError(null);
        const resp = await apiClient.get('/api/users/kyc');
        setKycStatus(resp.data.status);
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          setKycStatus(null); // Não enviado ainda
        } else {
          setKycError('Erro ao buscar status do KYC');
        }
      } finally {
        setKycLoading(false);
      }
    };
    fetchKyc();
  }, []);

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
      formData.append('nome', kycForm.nome);
      formData.append('cpf', kycForm.cpf);
      if (kycForm.documento_frente) formData.append('documento_frente', kycForm.documento_frente);
      if (kycForm.documento_verso) formData.append('documento_verso', kycForm.documento_verso);
      if (kycForm.selfie_1) formData.append('selfie_1', kycForm.selfie_1);
      if (kycForm.selfie_2) formData.append('selfie_2', kycForm.selfie_2);
      await apiClient.post('/api/users/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setKycStatus('pendente');
      setShowKycForm(false);
    } catch (err: any) {
      setKycError(err.response?.data?.message || 'Erro ao enviar KYC');
    } finally {
      setKycLoading(false);
    }
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
                isLoading={isLoading}
                loadingText="Connecting..."
              >
                Connect Wallet
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Wallet Selection Modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="primary.500" borderColor="bgGrid" borderWidth="1px">
            <ModalHeader color="text.light">Choose Your Wallet</ModalHeader>
            <ModalCloseButton color="text.light" />
            <ModalBody pb={6}>
              <ButtonGroup spacing={4} display="flex" flexDirection="column">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={async () => { await handleConnect('keplr'); onClose(); }}
                  mb={4}
                  isLoading={isLoading}
                  loadingText="Connecting..."
                >
                  Connect Keplr
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={async () => { await handleConnect('noble'); onClose(); }}
                  isLoading={isLoading}
                  loadingText="Connecting..."
                >
                  Connect Noble
                </Button>
              </ButtonGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
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
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            <Box>
              <Text fontWeight="bold" color="gray.200">Name:</Text>
              <Text color="white">-</Text>
            </Box>
            <Box>
              <Text fontWeight="bold" color="gray.200">Wallet ID:</Text>
              <Text color="white">{user?.address || '-'}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold" color="gray.200">Connected Chain:</Text>
              <Text color="white">{user?.walletType === 'keplr' ? 'Keplr' : user?.walletType === 'noble' ? 'Noble' : '-'}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold" color="gray.200">Number of Properties:</Text>
              <Text color="white">{myProperties.length}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold" color="gray.200">Number of Tokens:</Text>
              <Text color="white">{tokens.length}</Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Card 2: My Properties */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <Heading size="md" color="white">My Properties</Heading>
        </CardHeader>
        <CardBody>
          {loadingProperties ? (
            <Spinner />
          ) : myProperties.length === 0 ? (
            <Text color="gray.200">No properties found.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              {myProperties.map(property => (
                <Box
                  key={property.id}
                  bg="rgba(255,255,255,0.05)"
                  p={0}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="bgGrid"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{
                    transform: 'translateY(-5px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    borderColor: 'accent.500',
                  }}
                >
                  <Box height="220px" position="relative" overflow="hidden">
                    <Image
                      src={propertyImages[property.id] || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={property.name}
                      objectFit="cover"
                      width="100%"
                      height="100%"
                    />
                  </Box>
                  <Box p={6}>
                    <Heading size="md" mb={2} noOfLines={1} color="white">{property.name}</Heading>
                    <Text color="gray.200" fontSize="sm" mb={3}>{property.location}</Text>
                    <Text fontSize="sm" noOfLines={3} mb={4} color="gray.200">
                      {property.description}
                    </Text>
                    <Divider my={4} borderColor="bgGrid" />
                    <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                      <VStack align="flex-start" spacing={1}>
                        <Text fontWeight="bold" fontSize="xl" color="accent.500">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(property.price)}
                        </Text>
                      </VStack>
                      <HStack spacing={2}>
                        <Button as={RouterLink} to={`/assets/${property.id}`} size="sm" variant="primary">View Details</Button>
                        <Button as={RouterLink} to={`/edit-property/${property.id}`} size="sm" variant="outline">Edit</Button>
                      </HStack>
                    </Flex>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Card 3: My Tokens */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
        <CardHeader>
          <Heading size="md" color="white">My Tokens</Heading>
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
                  <Text color="gray.200"><b>Token ID:</b> {token.id}</Text>
                  <Text color="gray.200"><b>Property:</b> {token.rwa_id}</Text>
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
          <Heading size="md" color="white">KYC</Heading>
        </CardHeader>
        <CardBody>
          {kycLoading ? (
            <Spinner />
          ) : kycStatus ? (
            <HStack spacing={4} mb={4}>
              <Badge colorScheme={kycStatus === 'aprovado' ? 'green' : kycStatus === 'rejeitado' ? 'red' : 'yellow'}>
                {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
              </Badge>
              <Text color="gray.200">
                {kycStatus === 'pendente' && 'Seu KYC está em análise.'}
                {kycStatus === 'aprovado' && 'KYC aprovado!'}
                {kycStatus === 'rejeitado' && 'KYC rejeitado. Entre em contato para mais informações.'}
              </Text>
            </HStack>
          ) : showKycForm ? (
            <Box as="form" onSubmit={handleKycSubmit} p={4} bg="rgba(255,255,255,0.03)" borderRadius="md" boxShadow="md">
              <Heading size="sm" mb={4}>Envie seus documentos para KYC</Heading>
              {kycError && <Alert status="error" mb={4}><AlertIcon />{kycError}</Alert>}
              <FormControl mb={3} isRequired>
                <FormLabel>Nome completo</FormLabel>
                <Input name="nome" value={kycForm.nome} onChange={handleKycInput} autoComplete="off" />
              </FormControl>
              <FormControl mb={3} isRequired>
                <FormLabel>CPF</FormLabel>
                <Input name="cpf" value={kycForm.cpf} onChange={handleKycInput} autoComplete="off" />
              </FormControl>
              <FormControl mb={3} isRequired>
                <FormLabel>Documento (frente)</FormLabel>
                <Input name="documento_frente" type="file" accept="image/*" onChange={handleKycInput} />
              </FormControl>
              <FormControl mb={3} isRequired>
                <FormLabel>Documento (verso)</FormLabel>
                <Input name="documento_verso" type="file" accept="image/*" onChange={handleKycInput} />
              </FormControl>
              <FormControl mb={3} isRequired>
                <FormLabel>Selfie segurando documento</FormLabel>
                <Input name="selfie_1" type="file" accept="image/*" onChange={handleKycInput} />
              </FormControl>
              <FormControl mb={3} isRequired>
                <FormLabel>Selfie adicional</FormLabel>
                <Input name="selfie_2" type="file" accept="image/*" onChange={handleKycInput} />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={kycLoading} w="100%" mt={4}>
                Enviar documentos
              </Button>
              <Button variant="ghost" w="100%" mt={2} onClick={() => setShowKycForm(false)}>
                Cancelar
              </Button>
            </Box>
          ) : (
            <Button colorScheme="blue" onClick={() => navigate('/kyc')}>
              Iniciar KYC
            </Button>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}; 
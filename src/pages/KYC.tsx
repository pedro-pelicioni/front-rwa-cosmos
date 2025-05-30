import { useState, useEffect } from 'react';
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
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  SimpleGrid,
  Badge
} from '@chakra-ui/react';
import { useAuth } from '../hooks';
import { apiClient } from '../api/client';

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'not_started';

interface KYCData {
  id?: number;
  userId: number;
  fullName: string;
  cpf: string;
  status: KYCStatus;
  documents?: {
    id: number;
    type: string;
    url: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

export const KYC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchKYCData();
    }
  }, [user?.id]);

  const fetchKYCData = async () => {
    try {
      const response = await apiClient.get(`/api/kyc/${user?.id}`);
      setKycData(response.data);
      if (response.data) {
        setFormData({
          fullName: response.data.fullName || '',
          cpf: response.data.cpf || ''
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (kycData?.id) {
        // Atualiza KYC existente
        await apiClient.put(`/api/kyc/${kycData.id}`, formData);
      } else {
        // Cria novo KYC
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

      fetchKYCData();
    } catch (error) {
      toast({
        title: 'Erro ao salvar dados',
        description: 'Tente novamente mais tarde',
        status: 'error',
        duration: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('userId', user?.id?.toString() || '');

    try {
      await apiClient.post('/api/kyc/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast({
        title: 'Documento enviado com sucesso!',
        status: 'success',
        duration: 3000
      });

      fetchKYCData();
    } catch (error) {
      toast({
        title: 'Erro ao enviar documento',
        description: 'Tente novamente mais tarde',
        status: 'error',
        duration: 3000
      });
    }
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando dados do KYC...</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8} bg="primary.500" color="text.light">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Verificação KYC</Heading>
          <Text color="text.dim">
            Complete seu cadastro para poder investir e criar tokens RWA
          </Text>
        </Box>

        {kycData?.status === 'rejected' && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Sua verificação foi rejeitada</AlertTitle>
              <AlertDescription>
                Por favor, verifique os documentos e tente novamente
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Tabs>
          <TabList>
            <Tab>Dados Pessoais</Tab>
            <Tab>Documentos</Tab>
            <Tab>Status</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <form onSubmit={handleSubmit}>
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

                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={saving}
                    width="full"
                  >
                    Salvar Dados
                  </Button>
                </VStack>
              </form>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6}>
                <Box width="full">
                  <Text mb={2}>RG ou CNH (Frente)</Text>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'rg_front');
                    }}
                  />
                </Box>

                <Box width="full">
                  <Text mb={2}>RG ou CNH (Verso)</Text>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'rg_back');
                    }}
                  />
                </Box>

                <Box width="full">
                  <Text mb={2}>Comprovante de Residência</Text>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'residence');
                    }}
                  />
                </Box>

                {kycData?.documents && kycData.documents.length > 0 && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="full">
                    {kycData.documents.map((doc) => (
                      <Box
                        key={doc.id}
                        p={4}
                        borderWidth={1}
                        borderRadius="md"
                        position="relative"
                      >
                        <Badge
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme={
                            doc.status === 'approved' ? 'green' :
                            doc.status === 'rejected' ? 'red' : 'yellow'
                          }
                        >
                          {doc.status}
                        </Badge>
                        <Image
                          src={doc.url}
                          alt={doc.type}
                          maxH="200px"
                          objectFit="contain"
                        />
                        <Text mt={2} fontSize="sm">{doc.type}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold">Status da Verificação</Text>
                  <Badge
                    colorScheme={
                      kycData?.status === 'approved' ? 'green' :
                      kycData?.status === 'rejected' ? 'red' :
                      kycData?.status === 'pending' ? 'yellow' : 'gray'
                    }
                    mt={2}
                  >
                    {kycData?.status || 'Não iniciado'}
                  </Badge>
                </Box>

                {kycData?.status === 'pending' && (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Verificação em andamento</AlertTitle>
                      <AlertDescription>
                        Seus documentos estão sendo analisados. Você receberá uma notificação quando a verificação for concluída.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {kycData?.status === 'approved' && (
                  <Alert status="success">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Verificação aprovada!</AlertTitle>
                      <AlertDescription>
                        Você já pode investir e criar tokens RWA.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}; 
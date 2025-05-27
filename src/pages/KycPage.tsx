import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Text, Button, VStack, FormControl, FormLabel, Input, Alert, AlertIcon, HStack, Image, Spinner, useToast
} from '@chakra-ui/react';
import { useAuth } from '../hooks';
import { apiClient } from '../api/client';

export const KycPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    documento_frente: null as File | null,
    documento_verso: null as File | null,
    selfie_1: null as File | null,
    selfie_2: null as File | null,
  });
  const [previews, setPreviews] = useState<{[key: string]: string}>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verifica autenticação ao montar o componente
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Acesso restrito",
        description: "Por favor, faça login para continuar",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      navigate('/wallet');
    }
  }, [isAuthenticated, navigate, toast]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setForm(prev => ({ ...prev, [name]: files[0] }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [name]: reader.result as string }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nome', form.nome);
      formData.append('cpf', form.cpf);
      if (form.documento_frente) formData.append('documento_frente', form.documento_frente);
      if (form.documento_verso) formData.append('documento_verso', form.documento_verso);
      if (form.selfie_1) formData.append('selfie_1', form.selfie_1);
      if (form.selfie_2) formData.append('selfie_2', form.selfie_2);

      await apiClient.post('/api/users/kyc', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      toast({
        title: 'Sucesso!',
        description: 'Seus documentos foram enviados com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/wallet');
    } catch (err: any) {
      console.error('Erro ao enviar KYC:', err);
      
      let errorMessage = 'Erro ao enviar documentos. Tente novamente.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
          navigate('/wallet');
        } else if (err.response.status === 404) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Se não estiver autenticado, não renderiza o formulário
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={8} align="stretch" as="form" onSubmit={handleSubmit}>
        <Heading size="lg">Verificação KYC</Heading>
        <Text color="text.dim">Preencha seus dados e envie os documentos para verificação de identidade.</Text>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <FormControl isRequired>
          <FormLabel>Nome completo</FormLabel>
          <Input 
            name="nome" 
            value={form.nome} 
            onChange={handleInput} 
            autoComplete="off"
            isDisabled={loading}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>CPF</FormLabel>
          <Input 
            name="cpf" 
            value={form.cpf} 
            onChange={handleInput} 
            autoComplete="off"
            isDisabled={loading}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Documento (frente)</FormLabel>
          <HStack>
            <Button 
              as="label" 
              variant="outline" 
              colorScheme="blue"
              isDisabled={loading}
            >
              Upload
              <Input 
                name="documento_frente" 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={handleInput}
                disabled={loading}
              />
            </Button>
            {previews.documento_frente && (
              <Image 
                src={previews.documento_frente} 
                alt="Frente" 
                boxSize="60px" 
                objectFit="cover" 
                borderRadius="md" 
                border="1px solid #444" 
              />
            )}
          </HStack>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Documento (verso)</FormLabel>
          <HStack>
            <Button 
              as="label" 
              variant="outline" 
              colorScheme="blue"
              isDisabled={loading}
            >
              Upload
              <Input 
                name="documento_verso" 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={handleInput}
                disabled={loading}
              />
            </Button>
            {previews.documento_verso && (
              <Image 
                src={previews.documento_verso} 
                alt="Verso" 
                boxSize="60px" 
                objectFit="cover" 
                borderRadius="md" 
                border="1px solid #444" 
              />
            )}
          </HStack>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Selfie segurando documento</FormLabel>
          <HStack>
            <Button 
              as="label" 
              variant="outline" 
              colorScheme="blue"
              isDisabled={loading}
            >
              Upload
              <Input 
                name="selfie_1" 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={handleInput}
                disabled={loading}
              />
            </Button>
            {previews.selfie_1 && (
              <Image 
                src={previews.selfie_1} 
                alt="Selfie 1" 
                boxSize="60px" 
                objectFit="cover" 
                borderRadius="md" 
                border="1px solid #444" 
              />
            )}
          </HStack>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Selfie adicional</FormLabel>
          <HStack>
            <Button 
              as="label" 
              variant="outline" 
              colorScheme="blue"
              isDisabled={loading}
            >
              Upload
              <Input 
                name="selfie_2" 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={handleInput}
                disabled={loading}
              />
            </Button>
            {previews.selfie_2 && (
              <Image 
                src={previews.selfie_2} 
                alt="Selfie 2" 
                boxSize="60px" 
                objectFit="cover" 
                borderRadius="md" 
                border="1px solid #444" 
              />
            )}
          </HStack>
        </FormControl>

        <Button 
          type="submit" 
          colorScheme="blue" 
          isLoading={loading} 
          loadingText="Enviando..."
          w="100%" 
          size="lg"
        >
          Enviar documentos
        </Button>

        <Button 
          variant="ghost" 
          w="100%" 
          onClick={() => navigate('/wallet')}
          isDisabled={loading}
        >
          Cancelar
        </Button>
      </VStack>
    </Container>
  );
}; 
import { Box, Container, VStack, Heading, Text, Button, Avatar, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useKeplr } from '../hooks/useKeplr';
import { useAuth } from '../hooks';

const LoginPage = () => {
  const navigate = useNavigate();
  const { connectKeplr } = useKeplr();
  const { user } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');

  const handleLogin = async () => {
    try {
      await connectKeplr();
      navigate('/');
    } catch (err) {
      // pode exibir um toast de erro se quiser
    }
  };

  return (
    <Container centerContent minH="100vh" display="flex" justifyContent="center" alignItems="center">
      <Box bg={bg} p={10} borderRadius="xl" boxShadow="2xl" minW="340px" textAlign="center">
        <VStack spacing={6}>
          <Avatar size="2xl" icon={<svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>} />
          <Heading size="lg" color="blue.700">Você não está logado</Heading>
          <Text color="gray.600">Para acessar esta funcionalidade, conecte sua carteira.</Text>
          <Button colorScheme="blue" size="lg" onClick={handleLogin} fontWeight="bold" px={8} py={6} borderRadius="md">
            Conectar carteira
          </Button>
        </VStack>
      </Box>
    </Container>
  );
};

export default LoginPage; 
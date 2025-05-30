import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Button, Container, Heading, VStack, Text } from '@chakra-ui/react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { connect } = useAuth();

  const handleKeplrRegister = async () => {
    try {
      await connect('keplr');
<<<<<<< HEAD
      navigate('/wallet');
=======
      navigate('/dashboard');
>>>>>>> main
    } catch (error) {
      console.error('Erro ao registrar com Keplr:', error);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Registro</Heading>
        <Text>Conecte sua carteira para criar uma conta</Text>
        <Button colorScheme="blue" onClick={handleKeplrRegister}>
          Registrar com Keplr
        </Button>
      </VStack>
    </Container>
  );
}; 
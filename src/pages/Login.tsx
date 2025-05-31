import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Button, Container, Heading, VStack, Text } from '@chakra-ui/react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { connect } = useAuth();

  const handleKeplrLogin = async () => {
    try {
      await connect('keplr');
      navigate('/wallet');
    } catch (error) {
      console.error('Erro ao conectar com Keplr:', error);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Login</Heading>
        <Text>Connect your wallet to continue</Text>
        <Button colorScheme="blue" onClick={handleKeplrLogin}>
          Connect with Keplr
        </Button>
      </VStack>
    </Container>
  );
}; 
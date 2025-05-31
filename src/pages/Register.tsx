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
      navigate('/wallet');
    } catch (error) {
      console.error('Error registering with Keplr:', error);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Register</Heading>
        <Text>Connect your wallet to create an account</Text>
        <Button colorScheme="blue" onClick={handleKeplrRegister}>
          Register with Keplr
        </Button>
      </VStack>
    </Container>
  );
}; 
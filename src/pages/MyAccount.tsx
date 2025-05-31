import React from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  useToast,
  Avatar,
  Flex,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

export const MyAccount: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  if (!user) {
    toast({
      title: 'Login required',
      description: 'Please login to access your account.',
      status: 'warning',
      duration: 4000,
      isClosable: true,
    });
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="xl" mb={8}>My Account</Heading>

      <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
        {/* Perfil */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" flex="1">
          <CardHeader>
            <Heading size="md" color="white">Perfil</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={4}>
                <Avatar size="xl" name={user.name || user.address} />
                <Box>
                  <Text fontSize="lg" fontWeight="bold">{user.name || 'Usuário'}</Text>
                  <Text color="text.dim">{user.address}</Text>
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
                <Text fontSize="xl" fontWeight="bold">$0.00</Text>
              </Flex>
              <Flex justify="space-between" align="center">
                <Text color="text.dim">Tokens Possuídos</Text>
                <Text fontSize="xl" fontWeight="bold">0</Text>
              </Flex>
              <Divider />
              <Button variant="outline">Ver Histórico</Button>
            </VStack>
          </CardBody>
        </Card>
      </Flex>

      {/* Status KYC */}
      <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px" mt={8}>
        <CardHeader>
          <Heading size="md" color="white">KYC Status</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text color="text.dim">Status:</Text>
              <Badge colorScheme="yellow">Pending</Badge>
            </Flex>
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>KYC Pending</AlertTitle>
                <AlertDescription>
                  Complete your registration to invest and create RWA tokens
                </AlertDescription>
              </Box>
            </Alert>
            <Button colorScheme="blue">Start KYC</Button>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
}; 
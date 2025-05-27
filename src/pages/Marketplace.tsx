import React from 'react';
import { Container, Heading, SimpleGrid, Box, Text } from '@chakra-ui/react';
import { useProperty } from '../hooks/useProperty';
import { Property } from '../types/Property';

export const Marketplace: React.FC = () => {
  const { getAll, loading, error } = useProperty();
  const [properties, setProperties] = React.useState<Property[]>([]);

  React.useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getAll();
        setProperties(data);
      } catch (error) {
        console.error('Erro ao carregar propriedades:', error);
      }
    };

    loadProperties();
  }, [getAll]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <Text>Carregando...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={10}>
        <Text color="red.500">Erro ao carregar propriedades: {error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={8}>Marketplace</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
        {properties.map((property: any) => (
          <Box
            key={property.id}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={4}
          >
            <Heading size="md" mb={2}>
              {property.name}
            </Heading>
            <Text>{property.description}</Text>
            <Text mt={2} fontWeight="bold">
              {property.price} tokens
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Container>
  );
}; 
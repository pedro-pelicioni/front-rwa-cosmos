import { useState } from 'react';
import { Box, Container, Heading, Text, SimpleGrid, Button, Flex, Image, Badge, HStack, VStack, Divider, useColorModeValue, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaSearch, FaSort, FaFilter } from 'react-icons/fa';
import { properties } from '../data/properties';
import { useAuth } from '../hooks/useAuth';

export const Assets = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProperties = properties.filter(property => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" mb={2}>Tokenized Properties</Heading>
          <Text color="text.dim">Discover investment opportunities in premium real estate</Text>
        </Box>
        
        {user?.isConnected && (
          <Button 
            as={RouterLink} 
            to="/create-property"
            variant="primary"
          >
            + Create New Property
          </Button>
        )}
      </Flex>
      
      <Box mb={8}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.300" />
          </InputLeftElement>
          <Input 
            placeholder="Search properties by name, location or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="rgba(255,255,255,0.1)"
            border="1px solid"
            borderColor="bgGrid"
            _placeholder={{ color: "text.dim" }}
          />
        </InputGroup>
      </Box>
      
      <Flex justify="space-between" align="center" mb={4}>
        <Text>Showing {filteredProperties.length} properties</Text>
        
        <HStack spacing={4}>
          <Button leftIcon={<FaSort />} variant="outline" size="sm">
            Sort
          </Button>
          <Button leftIcon={<FaFilter />} variant="outline" size="sm">
            Filter
          </Button>
        </HStack>
      </Flex>
      
      {filteredProperties.length === 0 ? (
        <Box 
          textAlign="center" 
          p={8} 
          bg="rgba(255,255,255,0.05)" 
          borderRadius="xl"
          border="1px solid"
          borderColor="bgGrid"
        >
          <Heading size="md" mb={4}>No properties found</Heading>
          <Text>Try adjusting your search terms or filters</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {filteredProperties.map(property => (
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
                borderColor: 'accent.500'
              }}
            >
              <Box height="220px" position="relative" overflow="hidden">
                <Image 
                  src={property.metadata.images[0]} 
                  alt={property.name}
                  objectFit="cover"
                  width="100%"
                  height="100%"
                />
                <Badge 
                  position="absolute" 
                  top={4} 
                  right={4} 
                  bg="accent.500" 
                  color="white"
                  borderRadius="md"
                  px={2}
                  py={1}
                >
                  {formatCurrency(property.metadata.tokenPrice || property.price / property.totalTokens)} per token
                </Badge>
              </Box>
              
              <Box p={6}>
                <Heading size="md" mb={2} noOfLines={1}>{property.name}</Heading>
                <Text color="text.dim" fontSize="sm" mb={3}>{property.location}</Text>
                
                <Text fontSize="sm" noOfLines={3} mb={4} color="text.dim">
                  {property.description}
                </Text>
                
                <Divider my={4} borderColor="bgGrid" />
                
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontWeight="bold" fontSize="xl" color="accent.500">
                      {formatCurrency(property.price)}
                    </Text>
                    <Text fontSize="xs" color="text.dim">
                      {property.availableTokens} of {property.totalTokens} tokens available
                    </Text>
                  </VStack>
                  
                  <Button 
                    as={RouterLink}
                    to={`/assets/${property.id}`}
                    variant="primary"
                    size="sm"
                  >
                    View Details
                  </Button>
                </Flex>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}; 
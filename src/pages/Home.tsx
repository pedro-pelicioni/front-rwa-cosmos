import { Box, Heading, Text, Stack, Container, SimpleGrid, Button, Flex, Image } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom';
import homeIllustration from '../assets/home-illustration.svg'
import { properties } from '../data/properties';

export const Home = () => {
  return (
    <Box py={12}>
      {/* Hero Section */}
      <Container maxW="container.xl" py={12}>
        <Flex 
          direction={{ base: 'column', lg: 'row' }}
          align="center" 
          justify="space-between"
          gap={8}
        >
          {/* Left Content */}
          <Stack spacing={8} maxW={{ lg: '60%' }}>
            <Heading 
              as="h1" 
              fontSize={{ base: '4xl', md: '5xl' }} 
              fontWeight="bold"
              textTransform="uppercase"
              lineHeight="1.2"
            >
              <Text as="span">TOKENIZED REAL ESTATE</Text>{' '}
              <Text as="span" color="accent.500">INVESTMENT</Text>{' '}
              <Text as="span">IN LATIN AMERICA</Text>
            </Heading>
            
            <Text fontSize="xl" color="text.dim">
              Invest in fractions of premium properties with high profitability and liquidity through blockchain technology. Start with just $100.
            </Text>
            
            <Flex gap={4} mt={4}>
              <Button 
                variant="primary"
                size="lg" 
                px={8}
                as={RouterLink}
                to="/assets"
              >
                View Properties
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                px={8}
                as={RouterLink}
                to="/how-it-works"
              >
                How It Works
              </Button>
            </Flex>
          </Stack>
          
          {/* Right Content - Graphic Illustration */}
          <Box 
            p={8}
            bg="primary.500"
            border="1px solid"
            borderColor="bgGrid"
            borderRadius="xl"
            position="relative"
          >
            <Box position="relative" width={{ base: "100%", md: "350px" }} height={{ base: "300px", md: "350px" }}>
              <Image src={homeIllustration} alt="Real Estate Investment Illustration" />
            </Box>
          </Box>
        </Flex>
      </Container>
      
      {/* Featured Properties Section */}
      <Container maxW="container.xl" py={16}>
        <Heading 
          as="h2" 
          fontSize="3xl" 
          mb={12}
          textAlign="center"
          color="text.light"
        >
          Featured <Text as="span" color="accent.500">Tokenized</Text> Properties
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {properties.slice(0, 3).map((property) => (
            <Box 
              key={property.id}
              bg="rgba(255,255,255,0.05)"
              p={0}
              borderRadius="xl"
              border="1px solid"
              borderColor="bgGrid"
              overflow="hidden"
              _hover={{ 
                transform: 'translateY(-5px)', 
                transition: 'all 0.3s ease',
                borderColor: 'accent.500',
              }}
            >
              <Box height="200px" overflow="hidden">
                <Image 
                  src={property.metadata.images[0]}
                  alt={property.name}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                />
              </Box>
              
              <Box p={6}>
                <Heading size="md" mb={2}>{property.name}</Heading>
                <Text color="text.dim" mb={2}>{property.location}</Text>
                <Text fontWeight="bold" color="accent.500" fontSize="lg" mb={4}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  }).format(property.price)}
                </Text>
                
                <Button 
                  width="full"
                  variant="primary"
                  as={RouterLink}
                  to={`/assets/${property.id}`}
                >
                  View Details
                </Button>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
        
        <Flex justify="center" mt={10}>
          <Button 
            variant="outline" 
            size="lg"
            as={RouterLink}
            to="/assets"
          >
            View All Properties
          </Button>
        </Flex>
      </Container>
    </Box>
  )
} 
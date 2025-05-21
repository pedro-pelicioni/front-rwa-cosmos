import { useState, useEffect } from 'react';
import { Box, Heading, Text, Stack, Container, SimpleGrid, Button, Flex, Image, useInterval, SlideFade, Fade } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom';
import homeIllustration from '../assets/home-illustration.svg'
import { useProperty } from '../hooks/useProperty';
import { Property } from '../types/Property';
import { imageService } from '../services/imageService';
import { getImageCookie, setImageCookie } from '../utils/imageCookieCache';

export const Home = () => {
  const { getAll, loading, error } = useProperty();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyImages, setPropertyImages] = useState<{[key: string]: string}>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Property[][]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getAll();
        // Limitar a 12 propriedades
        const limitedData = data.slice(0, 12);
        setProperties(limitedData);
        
        // Buscar a primeira imagem de cada propriedade
        const imagesObj: {[key: string]: string} = {};
        await Promise.all(limitedData.map(async (property) => {
          const images = await imageService.getByRWAId(Number(property.id));
          if (images.length > 0) {
            const img = images[0];
            const cacheKey = `rwa_image_${property.id}_${img.id}`;
            let url = getImageCookie(cacheKey);
            if (!url) {
              url = img.image_data || img.file_path || img.cid_link || '';
              setImageCookie(cacheKey, url);
            }
            imagesObj[property.id] = url;
          }
        }));
        setPropertyImages(imagesObj);

        // Organizar propriedades em slides de 3
        const slidesArray: Property[][] = [];
        for (let i = 0; i < limitedData.length; i += 3) {
          slidesArray.push(limitedData.slice(i, i + 3));
        }
        setSlides(slidesArray);
      } catch (err) {
        console.error('Erro ao buscar propriedades:', err);
      }
    };
    
    fetchProperties();
  }, [getAll]);

  // Mudar slide automaticamente a cada 5 segundos
  useInterval(() => {
    if (slides.length > 0 && !isTransitioning) {
      handleSlideChange((currentSlide + 1) % slides.length);
    }
  }, 5000);

  const handleSlideChange = (newSlide: number) => {
    setIsTransitioning(true);
    setCurrentSlide(newSlide);
    setTimeout(() => setIsTransitioning(false), 500); // Tempo da animação
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

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
      {properties.length > 0 && (
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
          
          <Box position="relative">
            <SlideFade in={!isTransitioning} offsetY="20px">
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                {slides[currentSlide]?.map((property) => (
                  <Fade in={!isTransitioning} key={property.id}>
                    <Box 
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
                          src={propertyImages[property.id] || 'https://via.placeholder.com/400x300?text=No+Image'}
                          alt={property.name}
                          width="100%"
                          height="100%"
                          objectFit="cover"
                          transition="transform 0.3s ease"
                          _hover={{ transform: 'scale(1.05)' }}
                        />
                      </Box>
                      
                      <Box p={6}>
                        <Heading size="md" mb={2}>{property.name}</Heading>
                        <Text color="text.dim" mb={2}>{property.location}</Text>
                        <Text fontWeight="bold" color="accent.500" fontSize="lg" mb={4}>
                          {formatCurrency(property.price)}
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
                  </Fade>
                ))}
              </SimpleGrid>
            </SlideFade>

            {/* Indicadores de slide */}
            {slides.length > 1 && (
              <Flex justify="center" mt={8} gap={2}>
                {slides.map((_, index) => (
                  <Box
                    key={index}
                    w={3}
                    h={3}
                    borderRadius="full"
                    bg={currentSlide === index ? "accent.500" : "rgba(255,255,255,0.2)"}
                    cursor="pointer"
                    onClick={() => handleSlideChange(index)}
                    transition="all 0.3s"
                    _hover={{ transform: 'scale(1.2)' }}
                  />
                ))}
              </Flex>
            )}
          </Box>
          
          <Flex justify="center" mt={12}>
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
      )}
    </Box>
  )
} 
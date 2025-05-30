import { useEffect, useState, useRef } from 'react';
import { Box, Container, Heading, Text, VStack, Card, CardBody, Image, HStack, Badge, useToast, Select, NumberInput, NumberInputField, Flex, Spinner, Center } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaBuilding, FaDollarSign } from 'react-icons/fa';
import { rwaService } from '../services/rwaService';
import { imageService } from '../services/imageService';
import { tokenService } from '../services/tokenService';
import { useNavigate } from 'react-router-dom';
import { getImageCookie, setImageCookie } from '../utils/imageCookieCache';

// Corrige o ícone padrão do Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Constantes do mapa
const MAP_CENTER: [number, number] = [-15, -60]; // Centro aproximado da América Latina
const MAP_ZOOM = 3.5;
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-56, -120], // Sudoeste (sul do Chile/Argentina, oeste do México)
  [33, -25]    // Nordeste (norte do México, Caribe, parte do sul dos EUA)
];
const LATAM_COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominican Republic',
  'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay',
  'Peru', 'Uruguay', 'Venezuela', 'Guiana', 'Suriname', 'Belize', 'French Guiana'
];

// Componente para centralizar o mapa
function MapCenter({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Componente para o popup do imóvel
function PropertyPopup({ property, images }: { property: any, images: string[] }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  console.log('[PropertyPopup] property:', property);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Busca os campos corretos para preço por token e preço total
  const pricePerToken = property.tokenPrice ?? property.token_price ?? '-';
  const totalPrice = property.price ?? property.currentValue ?? property.current_value ?? '-';
  const roi = property.roi !== undefined && property.roi !== null ? `${property.roi}%` : '-';

  return (
    <Box maxW="320px" minW="220px" p={0} m={0}>
      {images.length > 0 && (
        <Box mb={0.5} borderRadius="md" overflow="hidden" m={0}>
          <Image
            src={images[currentSlide]}
            alt={property.name}
            width="100%"
            height="70px"
            objectFit="cover"
            borderRadius="md"
            style={{ marginBottom: 0 }}
          />
        </Box>
      )}
      <VStack align="start" spacing={0} gap={0} style={{ lineHeight: 1 }} m={0}>
        <Text fontWeight="bold" fontSize="sm" color="gray.800" m={0} lineHeight={1}>{property.name}</Text>
        <HStack fontSize="xs" spacing={0} gap={0} py={0} my={0} m={0}>
          <FaMapMarkerAlt fontSize="11px" color="#2D3748" style={{ marginBottom: 0 }} />
          <Text color="gray.700" fontSize="xs" lineHeight={1} mb={0} m={0}>{property.city || property.location || '-'}</Text>
        </HStack>
        <HStack fontSize="xs" spacing={0} gap={0} py={0} my={0} m={0}>
          <FaBuilding fontSize="11px" color="#2D3748" style={{ marginBottom: 0 }} />
          <Text color="gray.700" fontSize="xs" lineHeight={1} mb={0} m={0}>{property.type || '-'}</Text>
        </HStack>
        <HStack fontSize="xs" spacing={0} gap={0} py={0} my={0} m={0}>
          <FaDollarSign fontSize="11px" color="#2D3748" style={{ marginBottom: 0 }} />
          <Text color="gray.700" fontSize="xs" lineHeight={1} mb={0} m={0}>Price per token: {pricePerToken !== '-' ? formatCurrency(Number(pricePerToken)) : '-'}</Text>
        </HStack>
        <HStack fontSize="xs" spacing={0} gap={0} py={0} my={0} m={0}>
          <FaDollarSign fontSize="11px" color="#2D3748" style={{ marginBottom: 0 }} />
          <Text color="gray.700" fontSize="xs" lineHeight={1} mb={0} m={0}>Total property price: {totalPrice !== '-' ? formatCurrency(Number(totalPrice)) : '-'}</Text>
        </HStack>
        {/* Separador visual sutil */}
        <Box h="2px" m={0} />
        <Text fontSize="xs" color="green.700" fontWeight="bold" mt={0} mb={0} m={0} lineHeight={1}>ROI: {roi}</Text>
        <Text fontSize="xs" color="gray.600" noOfLines={2} mt={0} mb={0} m={0} lineHeight={1}>
          {property.description}
        </Text>
        <Box w="100%" pt={0} mt={0} mb={0} m={0}>
          <Text 
            color="blue.600" 
            cursor="pointer" 
            onClick={() => navigate(`/assets/${property.id}`)}
            _hover={{ textDecoration: 'underline' }}
            fontSize="xs"
            lineHeight={1}
            mb={0}
            m={0}
          >
            See details
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export const LatamMap: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [propertyImages, setPropertyImages] = useState<{[key: string]: string[]}>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>(MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const loadingRef = useRef(false);
  const markerRefs = useRef<{[key: number]: L.Marker}>({});

  // Carrega os imóveis e suas imagens
  useEffect(() => {
    const loadProperties = async () => {
      if (loadingRef.current) return;
      
      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);
        
        const data = await rwaService.getAll();
        
        // Carrega imagens para cada imóvel
        const imagesObj: {[key: string]: string[]} = {};
        const imagePromises = data.map(async (property) => {
          try {
            // Buscar imagens do imóvel
            if (property.id) {
              const images = await imageService.getByRWAId(property.id);
              const urls = images.map(img => img.image_data || img.file_path || img.cid_link).filter(Boolean);
              imagesObj[property.id] = urls;
            }
          } catch (e) {
            if (property.id) {
              imagesObj[property.id] = [];
            }
          }
        });

        await Promise.all(imagePromises);
        setProperties(data);
        setPropertyImages(imagesObj);
      } catch (err) {
        console.error('[LatamMap] Erro ao carregar imóveis:', err);
        setError('Não foi possível carregar os imóveis. Tente novamente mais tarde.');
        toast({
          title: 'Erro ao carregar imóveis',
          description: 'Não foi possível carregar os imóveis. Tente novamente mais tarde.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadProperties();
  }, [toast]);

  // Filtra os países únicos dos imóveis
  const countries = Array.from(new Set(
    properties.map(p => p.country?.trim())
      .filter(Boolean)
      .filter(c => LATAM_COUNTRIES.includes(c))
  ));

  // Filtra os imóveis por país e preço
  const filteredProperties = properties.filter(property => {
    const countryMatch = selectedCountry ? property.country === selectedCountry : true;
    const price = property.price || 0;
    const minPriceMatch = minPrice !== undefined ? price >= minPrice : true;
    const maxPriceMatch = maxPrice !== undefined ? price <= maxPrice : true;
    return countryMatch && minPriceMatch && maxPriceMatch;
  });

  // Filtra apenas os que têm coordenadas válidas
  const propertiesWithCoords = filteredProperties.filter(p => {
    if (!p.gpsCoordinates) return false;
    const coords = p.gpsCoordinates.split(',').map((s: string) => Number(s.trim()));
    return coords.length === 2 && coords.every((c: number) => !isNaN(c));
  });

  // Log para depuração
  console.log('[LatamMap] Imóveis recebidos:', properties);
  console.log('[LatamMap] Imóveis filtrados:', filteredProperties);
  console.log('[LatamMap] Imóveis com coordenadas:', propertiesWithCoords);

  // Atualiza o centro do mapa quando o país é selecionado
  useEffect(() => {
    if (selectedCountry && filteredProperties.length > 0) {
      const property = filteredProperties[0];
      if (property.gpsCoordinates) {
        const coords = property.gpsCoordinates.split(',').map(Number);
        if (coords.length === 2) {
          setMapCenter([coords[0], coords[1]] as [number, number]);
          setMapZoom(7);
        }
      }
    } else {
      setMapCenter(MAP_CENTER);
      setMapZoom(MAP_ZOOM);
    }
  }, [selectedCountry, filteredProperties]);

  // Função para centralizar e abrir popup do asset
  const handleAssetClick = (property: any) => {
    if (!property.gpsCoordinates) return;
    const [lat, lng] = property.gpsCoordinates.split(',').map(Number);
    setMapCenter([lat, lng]);
    setMapZoom(13);
    setSelectedPropertyId(property.id);
    setTimeout(() => {
      const marker = markerRefs.current[property.id];
      if (marker) marker.openPopup();
    }, 300);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center h="600px">
          <Spinner size="xl" color="accent.500" />
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading color="white">Mapa de Assets</Heading>

        {/* Filtros */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
          <CardBody>
            <Flex gap={4} wrap="wrap">
              <Select
                placeholder="Filtrar por país"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                bg="rgba(255,255,255,0.08)"
                color="white"
                borderColor="bgGrid"
                _hover={{ borderColor: 'accent.500' }}
                maxW="200px"
              >
                {countries.map(country => (
                  <option key={country} value={country} style={{ color: '#002D5B', background: '#fff' }}>
                    {country}
                  </option>
                ))}
              </Select>

              <Flex align="center" gap={2}>
                <Text color="gray.200" fontSize="sm">Preço:</Text>
                <NumberInput
                  size="sm"
                  value={minPrice ?? ''}
                  onChange={(_, v) => setMinPrice(Number.isNaN(v) ? undefined : v)}
                  min={0}
                  max={maxPrice ?? undefined}
                  w="100px"
                  bg="rgba(255,255,255,0.08)"
                  color="white"
                  borderColor="bgGrid"
                >
                  <NumberInputField placeholder="Mín" />
                </NumberInput>
                <Text color="gray.400">-</Text>
                <NumberInput
                  size="sm"
                  value={maxPrice ?? ''}
                  onChange={(_, v) => setMaxPrice(Number.isNaN(v) ? undefined : v)}
                  min={minPrice ?? 0}
                  w="100px"
                  bg="rgba(255,255,255,0.08)"
                  color="white"
                  borderColor="bgGrid"
                >
                  <NumberInputField placeholder="Máx" />
                </NumberInput>
              </Flex>
            </Flex>
          </CardBody>
        </Card>

        {/* Mapa */}
        <Card bg="rgba(255,255,255,0.05)" borderColor="bgGrid" borderWidth="1px">
          <CardBody>
            <Box 
              height="600px" 
              borderRadius="lg"
              overflow="hidden"
            >
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                maxBounds={MAP_BOUNDS}
                maxBoundsViscosity={1.0}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={mapCenter} zoom={mapZoom} />
                
                {propertiesWithCoords.length === 0 && (
                  <div style={{position: 'absolute', top: 20, left: 20, zIndex: 1000, color: 'white', background: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8}}>
                    Nenhum imóvel com coordenada válida para exibir no mapa.
                  </div>
                )}
                {propertiesWithCoords.map(property => {
                  const [lat, lng] = property.gpsCoordinates.split(',').map((s: string) => Number(s.trim()));
                  return (
                    <Marker
                      key={property.id}
                      position={[lat, lng] as [number, number]}
                      ref={ref => { if (ref) markerRefs.current[property.id] = ref }}
                    >
                      <Tooltip>
                        <Text fontWeight="bold">{property.name}</Text>
                        <Text fontSize="sm">{property.location}</Text>
                      </Tooltip>
                      <Popup autoPan={true}>
                        <PropertyPopup 
                          property={property} 
                          images={propertyImages[property.id] || []} 
                        />
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}; 
import { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Spinner, Select, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, NumberInput, NumberInputField, Flex, Image, Button, useDisclosure, IconButton } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { rwaService } from '../services/rwaService';
import { imageService } from '../services/imageService';
import { tokenService } from '../services/tokenService';
import { Map as LeafletMap } from 'leaflet';
import type { LeafletEvent } from 'leaflet';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { RWA, RWAImage } from '../types/rwa';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';

// Corrige o ícone padrão do Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LATAM_BOUNDS = [
  [-80, -160], // Sudoeste (mais abaixo e à esquerda)
  [45, 10],    // Nordeste (mais acima e à direita)
];
const LATAM_RECT = [
  [-56, -120], // Sudoeste (Chile, Argentina)
  [15, -30],  // Nordeste (México, Caribe)
];
const MAP_CENTER = [-15, -60]; // Centro aproximado da América Latina
const MAP_ZOOM = 3.5;

// Lista de países latino-americanos para filtro correto
const LATAM_COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominican Republic',
  'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay',
  'Peru', 'Uruguay', 'Venezuela', 'Guiana', 'Suriname', 'Belize', 'French Guiana'
];

const AMERICAS_BOUNDS = [
  [-70, -170], // Sudoeste (abaixo da América do Sul, mais à esquerda do Alasca)
  [85, -10],   // Nordeste (acima do Canadá, até o Atlântico)
];

// Custom hook para centralizar o mapa ao filtrar
function MapFlyTo({ center, zoom, shouldFly, onMapClick }: { center: [number, number], zoom: number, shouldFly: boolean, onMapClick: () => void }) {
  const map = useMap();
  const hasFlownRef = useRef(false);

  useEffect(() => {
    if (shouldFly && !hasFlownRef.current) {
      map.flyTo(center, zoom, { duration: 1.2 });
      hasFlownRef.current = true;
    }
  }, [shouldFly, center, zoom, map]);

  useMapEvents({
    click: (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target?.classList?.contains('leaflet-container')) {
        onMapClick();
      }
    },
  });

  useEffect(() => {
    hasFlownRef.current = false;
  }, [center, zoom]);

  return null;
}

function MapAutoCenter({ center, zoom, shouldCenter }: { center: [number, number], zoom: number, shouldCenter: boolean }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (shouldCenter && !hasCentered.current) {
      map.setView(center, zoom, { animate: false });
      hasCentered.current = true;
    }
  }, [shouldCenter, center, zoom, map]);

  useMapEvents({
    dragstart: () => { hasCentered.current = true; },
    zoomstart: () => { hasCentered.current = true; },
    click: () => { hasCentered.current = true; },
  });

  useEffect(() => {
    hasCentered.current = false;
  }, [center, zoom]);

  return null;
}

function PropertyPopup({ asset }: { asset: any }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = asset.images || [];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Box minW="300px" p={2}>
      {images.length > 0 ? (
        <Box position="relative" mb={3} borderRadius="md" overflow="hidden">
          <Box h="200px" position="relative">
            <Image
              src={images[currentSlide]}
              alt={`${asset.name} - Image ${currentSlide + 1}`}
              objectFit="cover"
              w="100%"
              h="100%"
            />
            {images.length > 1 && (
              <>
                <IconButton
                  aria-label="Previous image"
                  icon={<ChevronLeftIcon />}
                  position="absolute"
                  left={2}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={prevSlide}
                  bg="rgba(255,255,255,0.8)"
                  _hover={{ bg: "rgba(255,255,255,0.9)" }}
                />
                <IconButton
                  aria-label="Next image"
                  icon={<ChevronRightIcon />}
                  position="absolute"
                  right={2}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={nextSlide}
                  bg="rgba(255,255,255,0.8)"
                  _hover={{ bg: "rgba(255,255,255,0.9)" }}
                />
              </>
            )}
          </Box>
          {images.length > 1 && (
            <Flex justify="center" gap={1} mt={2}>
              {images.map((_: string, index: number) => (
                <Box
                  key={index}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={currentSlide === index ? "blue.500" : "gray.300"}
                  cursor="pointer"
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </Flex>
          )}
        </Box>
      ) : (
        <Box h="200px" bg="gray.100" borderRadius="md" mb={3} display="flex" alignItems="center" justifyContent="center">
          <Text color="gray.500">No images available</Text>
        </Box>
      )}
      
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>{asset.name}</Text>
        <Text color="gray.600" mb={1}>{asset.city}, {asset.country}</Text>
        
        <Flex justify="space-between" align="center" mt={3} p={2} bg="blue.50" borderRadius="md">
          <Box>
            <Text fontSize="sm" color="gray.600">Token Price</Text>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              ${asset.currentValue?.toLocaleString('en-US') || '-'}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600">Available Tokens</Text>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              {asset.totalTokens?.toLocaleString('en-US') || '-'}
            </Text>
          </Box>
        </Flex>

        {asset.description && (
          <Text mt={3} fontSize="sm" color="gray.600" noOfLines={3}>
            {asset.description}
          </Text>
        )}
      </Box>
    </Box>
  );
}

// Tooltip customizado fixo
function FixedTooltip({ asset, position, images, onClose, onViewDetails }: { asset: any, position: [number, number], images: string[], onClose: () => void, onViewDetails: () => void }) {
  const map = useMap();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Converte coordenadas do mapa para pixel na tela
  const point = map.latLngToContainerPoint(position);

  return ReactDOM.createPortal(
    <Box
      ref={tooltipRef}
      position="fixed"
      left={point.x}
      top={point.y - 80}
      zIndex={2000}
      bg="white"
      borderRadius="md"
      boxShadow="xl"
      minW="150px"
      maxW="220px"
      p={1}
      maxHeight="60vh"
      overflowY="auto"
    >
      <PropertyTooltip
        asset={{ ...asset, images }}
        showImages={!!images.length}
        onViewDetails={onViewDetails}
        compact={true}
      />
    </Box>,
    document.body
  );
}

function PropertyTooltip({ asset, showImages, onViewDetails, compact }: { asset: any, showImages?: boolean, onViewDetails?: () => void, compact?: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = asset.images || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const price = asset.price ?? asset.currentValue ?? 0;
  const totalTokens = asset.totalTokens ?? 0;
  const availableTokens = asset.availableTokens ?? totalTokens;
  const tokenPrice = asset.metadata?.tokenPrice || (totalTokens > 0 ? price / totalTokens : 0);
  const status = asset.status || 'active';

  return (
    <Box
      p={0.5}
      bg="white"
      borderRadius="md"
      boxShadow="md"
      minW={compact ? '220px' : showImages ? '340px' : '220px'}
      maxW="320px"
      maxHeight="50vh"
      overflowY="auto"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
    >
      <Text fontWeight="bold" mb={0.5} fontSize="sm" noOfLines={1} lineHeight={1}>{asset.name}</Text>
      <Text fontSize="xs" color="gray.600" mb={0.5} noOfLines={1} lineHeight={1}>{asset.city}, {asset.country}</Text>
      <Box as="dl" fontSize="xs" mb={0.25}>
        <Box display="grid" gridTemplateColumns="auto 1fr auto 1fr" gap={1} alignItems="center">
          <Text color="gray.600" fontSize="xs" lineHeight={1}>Property Value:</Text>
          <Text fontWeight="bold" color="blue.600" fontSize="xs" lineHeight={1}>{formatCurrency(price)}</Text>
          <Text color="gray.600" fontSize="xs" lineHeight={1}>Token Price:</Text>
          <Text fontWeight="bold" color="blue.600" fontSize="xs" lineHeight={1}>{formatCurrency(tokenPrice)}</Text>

          <Text color="gray.600" fontSize="xs" lineHeight={1}>Total Tokens:</Text>
          <Text fontWeight="bold" color="blue.600" fontSize="xs" lineHeight={1}>{totalTokens}</Text>
          <Text color="gray.600" fontSize="xs" lineHeight={1}>Available:</Text>
          <Text fontWeight="bold" color="blue.600" fontSize="xs" lineHeight={1}>{availableTokens}</Text>

          <Text color="gray.600" fontSize="xs" lineHeight={1}>Status:</Text>
          <Text
            fontWeight="bold"
            color={status === 'active' ? 'green.600' : status === 'inactive' ? 'gray.600' : 'red.600'}
            fontSize="xs"
            lineHeight={1}
            style={{ gridColumn: '2 / span 3' }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </Box>
      </Box>
      {showImages && onViewDetails && (
        <Button
          size="xs"
          colorScheme="blue"
          w="100%"
          onClick={onViewDetails}
          fontSize="xs"
          h={6}
          mt={0.25}
        >
          View Details
        </Button>
      )}
    </Box>
  );
}

// Novo componente auxiliar para centralizar com offset
function PanToWithOffset({ position, trigger }: { position: [number, number], trigger: any }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      // Offset: latitude - desloca para baixo (ex: 3 graus)
      const offsetLat = position[0] - 3;
      map.panTo([offsetLat, position[1]], { animate: true });
    }
    // eslint-disable-next-line
  }, [trigger]);
  return null;
}

type LatamMapProps = {
  selectedCountry?: string;
  singleAsset?: any;
  mapHeight?: string;
  mapZoom?: number;
  mapInteractive?: boolean;
};

export function LatamMap({
  selectedCountry,
  singleAsset,
  mapHeight = '300px',
  mapZoom = 15,
  mapInteractive = false,
}: LatamMapProps) {
  const [assets, setAssets] = useState<RWA[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [assetImages, setAssetImages] = useState<{[key: number]: RWAImage[]}>({});
  const [center, setCenter] = useState<[number, number]>(MAP_CENTER as [number, number]);
  const [zoom, setZoom] = useState(MAP_ZOOM);
  const [shouldCenter, setShouldCenter] = useState(false);
  const [panToPosition, setPanToPosition] = useState<[number, number] | null>(null);
  const [panToTrigger, setPanToTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const data = await rwaService.getAll();
        // Buscar imagens e tokens para cada asset
        const imagesObj: {[key: number]: RWAImage[]} = {};
        const tokensObj: {[key: number]: number} = {};
        await Promise.all(data.map(async (asset) => {
          try {
            const images = await imageService.getByRWAId(asset.id);
            imagesObj[asset.id] = images;
          } catch (err) {
            imagesObj[asset.id] = [];
          }
          try {
            const tokens = await tokenService.getByRWAId(asset.id);
            tokensObj[asset.id] = Array.isArray(tokens) ? tokens.length : 0;
          } catch (err) {
            tokensObj[asset.id] = 0;
          }
        }));
        // Mapeia os assets para incluir availableTokens
        const mapped = data.map(asset => ({
          ...asset,
          totalTokens: asset.totalTokens ?? asset.total_tokens ?? 0,
          availableTokens: tokensObj[asset.id] ?? (asset.totalTokens ?? asset.total_tokens ?? 0),
        }));
        setAssets(mapped);
        setAssetImages(imagesObj);
      } catch (err) {
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Extrai países únicos válidos dos assets
  const countries = Array.from(new Set(
    assets.map(a => a.country?.trim())
      .filter(Boolean)
      .filter(c => LATAM_COUNTRIES.includes(c))
  ));

  // Filtra assets por país e faixa de preço
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const countryOk = countryFilter ? a.country === countryFilter : true;
      const price = a.currentValue || 0;
      const minOk = minPrice !== undefined ? price >= minPrice : true;
      const maxOk = maxPrice !== undefined ? price <= maxPrice : true;
      return countryOk && minOk && maxOk;
    });
  }, [assets, countryFilter, minPrice, maxPrice]);

  useEffect(() => {
    if (countryFilter && filteredAssets.length > 0) {
      const [lat, lng] = filteredAssets[0].gps_coordinates
        ? filteredAssets[0].gps_coordinates.split(',').map((v: string) => parseFloat(v.trim()))
        : [MAP_CENTER[0], MAP_CENTER[1]];
      setCenter([lat, lng]);
      setZoom(7);
      setShouldCenter(true);
    } else {
      setCenter(MAP_CENTER as [number, number]);
      setZoom(MAP_ZOOM);
      setShouldCenter(true);
    }
  }, [countryFilter, filteredAssets.length]);

  const handleUserInteraction = () => setShouldCenter(false);

  const handleViewDetails = (asset: RWA) => {
    navigate(`/assets/${asset.id}`);
  };

  // Se singleAsset, renderizar mapa focado apenas nele
  if (singleAsset) {
    // Extrair coordenadas
    const [lat, lng] = singleAsset.gps_coordinates
      ? singleAsset.gps_coordinates.split(',').map((v: string) => parseFloat(v.trim()))
      : [null, null];
    if (!lat || !lng) return null;
    const images = singleAsset.images || [];
    return (
      <Box w="100%" h={mapHeight} borderRadius="xl" overflow="hidden">
        <MapContainer
          center={[lat, lng] as [number, number]}
          zoom={mapZoom}
          minZoom={3}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={mapInteractive}
          zoomControl={mapInteractive}
          dragging={mapInteractive}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng] as [number, number]}>
            <Popup minWidth={220} maxWidth={250} closeButton={true} closeOnClick={true} autoPan={false}>
              <PropertyTooltip
                asset={{ ...singleAsset, images }}
                showImages={!!images.length}
                compact
              />
            </Popup>
          </Marker>
        </MapContainer>
      </Box>
    );
  }

  // --- Renderização ---
  return (
    <Box 
      w="100vw" 
      h="calc(100vh - 64px)"
      position="fixed" 
      top="64px"
      left={0} 
      zIndex={1}
    >
      {/* Header de filtros fixo no topo */}
      <Flex
        w="100%"
        position="absolute"
        top={0}
        left={0}
        zIndex={1000}
        bg="rgba(0,45,91,0.96)"
        p={4}
        gap={4}
        align="center"
        justify="center"
        flexWrap="wrap"
        boxShadow="0 4px 16px 0 rgba(0,0,0,0.15)"
        borderBottom="1.5px solid #2a4365"
      >
        <Select
          placeholder="Filter by country"
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
          size="sm"
          bg="rgba(255,255,255,0.08)"
          color="white"
          borderColor="#2a4365"
          _placeholder={{ color: 'gray.300' }}
          _hover={{ borderColor: 'accent.500' }}
          maxW="200px"
        >
          {countries.map(c => (
            <option key={c} value={c} style={{ color: '#002D5B', background: '#fff' }}>{c}</option>
          ))}
        </Select>
        <Flex align="center" gap={2} minW="200px">
          <Text color="gray.200" fontSize="sm">Token Price:</Text>
          <NumberInput
            size="sm"
            value={minPrice ?? ''}
            onChange={(_, v) => setMinPrice(Number.isNaN(v) ? undefined : v)}
            min={0}
            max={maxPrice ?? undefined}
            _placeholder="Min"
            w="70px"
            bg="rgba(255,255,255,0.08)"
            color="white"
            borderColor="#2a4365"
          >
            <NumberInputField />
          </NumberInput>
          <Text color="gray.400">-</Text>
          <NumberInput
            size="sm"
            value={maxPrice ?? ''}
            onChange={(_, v) => setMaxPrice(Number.isNaN(v) ? undefined : v)}
            min={minPrice ?? 0}
            _placeholder="Max"
            w="70px"
            bg="rgba(255,255,255,0.08)"
            color="white"
            borderColor="#2a4365"
          >
            <NumberInputField />
          </NumberInput>
        </Flex>
      </Flex>

      {/* Mapa em tela cheia */}
      <Box
        w="100%"
        h="calc(100% - 64px)"
        position="relative"
        mt="64px"
      >
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={3}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          maxBounds={AMERICAS_BOUNDS as [[number, number], [number, number]]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          zoomControl={true}
          dragging={true}
        >
          <MapFlyTo center={center} zoom={zoom} shouldFly={shouldCenter} onMapClick={handleUserInteraction} />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Renderiza todos os marcadores com Tooltip (hover) e Popup (click) controlados pelo Leaflet */}
          {filteredAssets.map(asset => {
            const [lat, lng] = asset.gps_coordinates
              ? asset.gps_coordinates.split(',').map((v: string) => parseFloat(v.trim()))
              : [null, null];
            if (!lat || !lng) return null;

            const images = assetImages[asset.id] || [];
            const imageUrls = images.map(img => img.image_data || img.file_path || img.cid_link).filter(Boolean);

            return (
              <Marker
                key={asset.id}
                position={[lat, lng] as [number, number]}
                eventHandlers={{
                  click: (e) => {
                    e.target.openPopup();
                    setPanToPosition([lat, lng]);
                    setPanToTrigger(prev => prev + 1);
                  }
                }}
              >
                {/* Tooltip do Leaflet apenas para hover */}
                <Tooltip
                  direction="top"
                  offset={[0, -20]}
                  opacity={1}
                  permanent={false}
                  sticky={true}
                  interactive={true}
                >
                  <PropertyTooltip asset={{ ...asset }} />
                </Tooltip>
                {/* Popup do Leaflet para seleção/click */}
                <Popup
                  closeButton={true}
                  closeOnClick={true}
                  autoPan={false}
                  minWidth={150}
                  maxWidth={220}
                >
                  <PropertyTooltip
                    asset={{ ...asset, images: imageUrls }}
                    showImages={!!imageUrls.length}
                    onViewDetails={() => handleViewDetails(asset)}
                    compact={true}
                  />
                </Popup>
                {panToPosition && (
                  <PanToWithOffset position={panToPosition} trigger={panToTrigger} />
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
} 
import React from 'react';
import {
  Box,
  Input,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  HStack,
  VStack,
  Text,
  Button,
} from '@chakra-ui/react';

interface MarketplaceFiltersProps {
  onChange: (filters: any) => void;
}

export function MarketplaceFilters({ onChange }: MarketplaceFiltersProps) {
  const [filters, setFilters] = React.useState({
    search: '',
    status: '',
    minPrice: 0,
    maxPrice: 1000000,
    type: '',
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      status: '',
      minPrice: 0,
      maxPrice: 1000000,
      type: '',
    };
    setFilters(defaultFilters);
    onChange(defaultFilters);
  };

  // Fundo azul escuro e texto branco
  const bgColor = '#003366';
  const borderColor = 'transparent';
  const textColor = 'white';

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      color={textColor}
    >
      <VStack spacing={4} align="stretch">
        <Input
          placeholder="Search properties..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          bg={bgColor}
          color={textColor}
          borderColor={textColor}
          _placeholder={{ color: 'rgba(255,255,255,0.7)' }}
        />

        <HStack spacing={4}>
          <Select
            placeholder="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            bg={bgColor}
            color={textColor}
            borderColor={textColor}
            _placeholder={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <option style={{ color: 'black' }} value="active">Active</option>
            <option style={{ color: 'black' }} value="sold">Sold</option>
            <option style={{ color: 'black' }} value="cancelled">Cancelled</option>
            <option style={{ color: 'black' }} value="expired">Expired</option>
          </Select>

          <Select
            placeholder="Property Type"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            bg={bgColor}
            color={textColor}
            borderColor={textColor}
            _placeholder={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <option style={{ color: 'black' }} value="residential">Residential</option>
            <option style={{ color: 'black' }} value="commercial">Commercial</option>
            <option style={{ color: 'black' }} value="land">Land</option>
          </Select>
        </HStack>

        <Text mb={2} color={textColor}>Price Range (USD)</Text>
        <RangeSlider
          defaultValue={[filters.minPrice, filters.maxPrice]}
          min={0}
          max={1000000}
          step={10000}
          onChange={(val) => {
            handleFilterChange('minPrice', val[0]);
            handleFilterChange('maxPrice', val[1]);
          }}
          colorScheme="blue"
        >
          <RangeSliderTrack>
            <RangeSliderFilledTrack />
          </RangeSliderTrack>
          <RangeSliderThumb index={0} />
          <RangeSliderThumb index={1} />
        </RangeSlider>
        <HStack justify="space-between" mt={2}>
          <Text color={textColor}>${filters.minPrice.toLocaleString()}</Text>
          <Text color={textColor}>${filters.maxPrice.toLocaleString()}</Text>
        </HStack>

        <Button
          colorScheme="whiteAlpha"
          variant="outline"
          onClick={clearFilters}
          alignSelf="flex-end"
        >
          Clear Filters
        </Button>
      </VStack>
    </Box>
  );
} 
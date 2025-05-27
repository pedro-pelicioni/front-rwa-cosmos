export interface Property {
  id: string | number;
  name: string;
  description?: string;
  location?: string;
  price?: number;
  currentValue?: number;
  sizeM2?: number;
  yearBuilt?: number;
  totalTokens?: number;
  availableTokens?: number;
  status?: 'active' | 'inactive' | 'sold' | 'pending';
  images?: any[];
  owner?: any;
  createdAt: string;
  updatedAt: string;
  facilities?: any[];
  metadata?: {
    images?: string[];
    documents?: string[];
    amenities?: string[];
    yearBuilt?: number;
    squareMeters?: number;
    sizeM2?: number;
    tokenPrice?: number;
    gpsCoordinates?: string;
    totalTokens?: number;
    availableTokens?: number;
  };
} 
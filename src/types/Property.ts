export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  totalTokens: number;
  availableTokens: number;
  metadata: {
    images: string[];
    documents: string[];
    amenities?: string[];
    yearBuilt?: number;
    squareMeters?: number;
    tokenPrice?: number;
    gpsCoordinates?: string;
  };
  owner: string;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'inactive' | 'sold' | 'pending';
  facilities?: any[];
} 
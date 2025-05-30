export interface RWA {
  id?: number;
  name: string;
  description: string;
  location: string;
  city: string;
  country: string;
  currentValue: number;
  totalTokens: number;
  yearBuilt: number;
  sizeM2: number;
  gpsCoordinates: string;
  status: string;
  geometry: any;
  metadata: {
    images: string[];
    documents: string[];
    amenities: string[];
  };
  created_at?: string;
  updated_at?: string;
  user_id?: number;
  userId?: number;
  current_value?: number;
  total_tokens?: number;
  year_built?: number;
  size_m2?: number;
  gps_coordinates?: string;
}

export interface RWAImage {
  id: number;
  rwa_id: number;
  title: string;
  description?: string;
  cid_link: string;
  file_path: string;
  image_data?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface RWAFacility {
  id: number;
  rwa_id: number;
  name: string;
  description?: string;
  size_m2?: number;
  floor_number?: number;
  type: string;
  status: 'active' | 'inactive' | 'under_renovation';
  created_at: string;
  updated_at: string;
}

export interface RWANFTToken {
  id: number;
  rwa_id: number;
  token_identifier: string;
  owner_user_id: number;
  metadata_uri: string;
  created_at: string;
  updated_at: string;
}

export interface RWAOwnershipHistory {
  id: number;
  rwa_id: number;
  token_id: number;
  from_user_id?: number;
  to_user_id: number;
  quantity: number;
  transfer_date: string;
  tx_hash: string;
}

export interface Property {
  id?: number;
  name: string;
  description: string;
  location: string;
  city: string;
  country: string;
  price?: number;
  currentValue?: number;
  totalTokens: number;
  yearBuilt: number;
  sizeM2: number;
  gpsCoordinates: string;
  status?: string;
  geometry?: any;
  metadata?: {
    images?: string[];
    documents?: string[];
    amenities?: string[];
    yearBuilt?: number;
    squareMeters?: number;
  };
} 
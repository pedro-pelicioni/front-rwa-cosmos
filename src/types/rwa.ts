export interface RWA {
  id: number;
  userId: number;
  user_id?: number;
  name: string;
  gpsCoordinates: string;
  gps_coordinates?: string;
  city: string;
  country: string;
  description?: string;
  currentValue: number;
  current_value?: string | number;
  totalTokens: number;
  total_tokens?: number;
  yearBuilt?: number;
  year_built?: number;
  sizeM2?: number;
  size_m2?: number;
  status: 'active' | 'inactive' | 'sold' | 'pending';
  geometry?: any; // GeoJSON type
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
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
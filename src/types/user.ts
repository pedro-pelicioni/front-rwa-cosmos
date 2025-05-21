export interface User {
  id: number;
  name?: string;
  fullName?: string;
  nome?: string;
  email: string;
  wallet_address?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  address: string;
  isConnected?: boolean;
} 
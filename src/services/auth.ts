import { apiClient } from '../api/client';

interface User {
  id: number;
  address: string;
  role: string;
}

interface AuthResponse {
  user: User;
}

export const authService = {
  async loginWithWallet(address: string): Promise<AuthResponse> {
    try {
      console.log('Tentando fazer login com endereço:', address);
      
      // Verifica se o endereço está no formato correto
      if (!address || typeof address !== 'string') {
        throw new Error('Endereço da carteira inválido');
      }
      
      // Remove espaços em branco e converte para minúsculas
      const formattedAddress = address.trim().toLowerCase();
      
      // Verifica se o endereço começa com 'cosmos' ou 'neutron'
      if (!formattedAddress.startsWith('cosmos') && !formattedAddress.startsWith('neutron')) {
        throw new Error('Endereço da carteira deve começar com "cosmos" ou "neutron"');
      }
      
      // Verifica o comprimento do endereço (deve ter pelo menos 39 caracteres)
      if (formattedAddress.length < 39) {
        throw new Error('Endereço da carteira muito curto');
      }
      
      console.log('Endereço formatado:', formattedAddress);
      
      const response = await apiClient.post<AuthResponse>('/api/auth/wallet-login', {
        address: formattedAddress,
      });
      
      console.log('Resposta do servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erro detalhado na autenticação:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
}; 
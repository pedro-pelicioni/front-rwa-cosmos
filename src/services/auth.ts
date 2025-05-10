import { apiClient } from '../api/client';

interface User {
  id: number;
  address: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface NonceResponse {
  nonce: string;
}

export const authService = {
  async getNonce(address: string): Promise<string> {
    try {
      const response = await apiClient.get<NonceResponse>('/api/auth/nonce', {
        params: { address }
      });
      return response.data.nonce;
    } catch (error: any) {
      console.error('Erro ao obter nonce:', error);
      throw new Error(error.response?.data?.message || 'Erro ao obter nonce');
      }
  },

  async loginWithWallet(address: string, signature: string, nonce: string): Promise<AuthResponse> {
    try {
      const payload = { address, signature, nonce };
      console.log('[authService] Enviando para /api/auth/wallet-login:', payload);
      const response = await apiClient.post<AuthResponse>('/api/auth/wallet-login', payload);
      this.setToken(response.data.token);
      return response.data;
    } catch (error: any) {
      console.error('[authService] Erro na autenticação:', error);
      if (error.response) {
        console.error('[authService] Resposta do backend:', error.response.data);
      }
      throw new Error(error.response?.data?.message || 'Erro ao autenticar. Detalhes no console.');
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}; 
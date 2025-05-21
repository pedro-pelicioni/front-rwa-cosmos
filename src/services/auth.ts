import { apiClient } from '../api/client';

export interface User {
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

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos em milissegundos

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
      
      // Valida o token antes de salvar
      if (!this.isValidToken(response.data.token)) {
        throw new Error('Token inválido recebido do servidor');
      }
      
      this.setToken(response.data.token);
      this.setUser(response.data.user);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
  },

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    // Verifica se o token é válido antes de retornar
    if (!this.isValidToken(token)) {
      this.logout();
      return null;
    }

    // Verifica se o token está próximo de expirar
    if (this.isTokenExpiringSoon(token)) {
      console.log('[authService] Token próximo de expirar, tentando refresh...');
      this.refreshToken();
    }
    
    return token;
  },

  setToken(token: string) {
    if (!this.isValidToken(token)) {
      throw new Error('Token inválido');
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  },

  isTokenExpired(token?: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      console.error('Erro ao verificar expiração do token:', e);
      return true;
    }
  },

  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      return expirationTime - currentTime < TOKEN_REFRESH_THRESHOLD;
    } catch (e) {
      console.error('Erro ao verificar expiração próxima do token:', e);
      return true;
    }
  },

  async refreshToken(): Promise<void> {
    try {
      const user = this.getUser();
      if (!user) {
        throw new Error('Usuário não encontrado para refresh do token');
      }

      // Obtém um novo nonce
      const nonce = await this.getNonce(user.address);
      
      // Aqui você precisaria implementar a lógica para obter uma nova assinatura da wallet
      // Por enquanto, vamos apenas fazer logout e pedir para o usuário fazer login novamente
      this.logout();
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    } catch (error) {
      console.error('Erro ao refresh do token:', error);
      this.logout();
      throw error;
    }
  },

  isValidToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token mal formatado: não tem 3 partes');
        return false;
      }
      const payload = JSON.parse(atob(parts[1]));
      // Exigir todos os campos obrigatórios
      if (
        typeof payload.id !== 'number' ||
        typeof payload.address !== 'string' ||
        typeof payload.role !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        console.error('Token inválido: payload incompleto', payload);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao validar token:', e);
      return false;
    }
  }
}; 
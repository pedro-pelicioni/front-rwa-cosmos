import { apiClient } from '../api/client';

export interface User {
  id: number;
  address: string;
  email?: string;
  name?: string;
  role: string;
  isConnected?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface NonceResponse {
  nonce: string;
}

export interface KeplrSignature {
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
  debug?: any;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  async getNonce(address: string): Promise<string> {
    try {
      const response = await apiClient.get<NonceResponse>(`/api/auth/nonce?address=${address}`);
      return response.data.nonce;
    } catch (error) {
      console.error('[AuthService] Erro ao obter nonce:', error);
      throw new Error('Erro ao obter nonce. Tente novamente.');
    }
  },

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('[AuthService] Token obtido:', token || 'Token não encontrado');
    return token;
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('[AuthService] Token salvo');
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    console.log('[AuthService] Token removido');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('[AuthService] Usuário obtido:', user || 'Usuário não encontrado');
    return user;
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('[AuthService] Usuário salvo');
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
    console.log('[AuthService] Usuário removido');
  },

  setAuthData(token: string, user: User): void {
    this.setToken(token);
    this.setUser(user);
    console.log('[AuthService] Dados de autenticação salvos');
  },

  logout(): void {
    console.log('[AuthService] Realizando logout');
    this.removeToken();
    this.removeUser();
    console.log('[AuthService] Logout realizado');
  },

  async loginWithWallet(address: string, signature: KeplrSignature, nonce: string): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Dados recebidos para login:', {
        address,
        signature,
        nonce
      });

      // Verificar se todos os campos necessários estão presentes
      if (!address || !signature || !nonce) {
        throw new Error('Dados de login incompletos');
      }

      // Verificar se a chave pública está presente e em base64
      if (!signature.pub_key || !signature.pub_key.value) {
        throw new Error('Chave pública não fornecida na assinatura');
      }

      // Log do objeto que será enviado
      const loginData = {
        address,
        signature: signature.signature,
        pub_key: signature.pub_key,
        nonce,
        debug: signature.debug
      };
      console.log('[AuthService] Dados que serão enviados:', loginData);

      const response = await apiClient.post<AuthResponse>('/api/auth/wallet-login', loginData);
      this.setAuthData(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Erro no login:', error);
      throw new Error('Erro ao fazer login. Verifique suas credenciais.');
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  },

  isTokenExpired(token?: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      console.error('[AuthService] Erro ao verificar expiração do token:', e);
      return true;
    }
  },

  isValidToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('[AuthService] Token mal formatado: não tem 3 partes');
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
        console.error('[AuthService] Token inválido: payload incompleto', payload);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[AuthService] Erro ao validar token:', e);
      return false;
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh');
    this.setToken(response.data.token);
    this.setUser(response.data.user);
    return response.data;
  }
}; 
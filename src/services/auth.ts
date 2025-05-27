import { apiClient } from '../api/client';

export interface User {
  id: number;
  address: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface NonceResponse {
  nonce: string;
}

interface WalletLoginRequest {
  address: string;
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
  nonce: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const authService = {
  async getNonce(address: string): Promise<string> {
    try {
      const response = await apiClient.get<NonceResponse>(`/api/auth/nonce?address=${address}`);
      return response.data.nonce;
    } catch (error) {
      console.error('[AuthService] Erro ao obter nonce:', error);
      throw new Error('Erro ao obter nonce. Tente novamente.');
    }
  },

  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('[AuthService] Token obtido:', token || 'Token não encontrado');
    return token;
  },

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('[AuthService] Token salvo');
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    console.log('[AuthService] Token removido');
  },

  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    console.log('[AuthService] Usuário obtido:', user || 'Usuário não encontrado');
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('[AuthService] Usuário salvo');
  },

  removeUser: () => {
    localStorage.removeItem(USER_KEY);
    console.log('[AuthService] Usuário removido');
  },

  logout: () => {
    console.log('[AuthService] Realizando logout');
    authService.removeToken();
    authService.removeUser();
    console.log('[AuthService] Logout realizado');
  },

  setAuthData: (token: string, user: User) => {
    authService.setToken(token);
    authService.setUser(user);
    console.log('[AuthService] Dados de autenticação salvos');
  },

  async loginWithWallet(data: WalletLoginRequest): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Iniciando login com carteira:', {
        address: data.address,
        signature: data.signature,
        pub_key: {
          type: data.pub_key.type,
          value: data.pub_key.value,
          valueLength: data.pub_key.value.length,
          valueBase64: data.pub_key.value,
          valueHex: Buffer.from(data.pub_key.value, 'base64').toString('hex')
        },
        nonce: data.nonce
      });

      // Verifica se todos os campos necessários estão presentes
      if (!data.address || !data.signature || !data.pub_key || !data.nonce) {
        console.error('[AuthService] Dados incompletos:', data);
        throw new Error('Dados de autenticação incompletos');
      }

      // Verifica se a chave pública está no formato correto
      if (!data.pub_key.value || data.pub_key.value.length === 0) {
        console.error('[AuthService] Chave pública inválida:', data.pub_key);
        throw new Error('Chave pública inválida');
      }

      const response = await apiClient.post<AuthResponse>('/api/auth/wallet-login', data);
      console.log('[AuthService] Login realizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('[AuthService] Erro no login:', error);
      throw new Error('Erro ao fazer login. Verifique suas credenciais.');
    }
  },

  async refreshToken(): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { token: newToken, user } = response.data;
      this.setAuthData(newToken, user);
    } catch (error) {
      console.error('[AuthService] Erro ao renovar token:', error);
      throw new Error('Erro ao renovar sessão');
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
  }
};

export { authService }; 
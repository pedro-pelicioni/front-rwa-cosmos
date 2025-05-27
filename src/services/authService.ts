import { apiClient } from '../api/client';

interface WalletLoginRequest {
  address: string;
  signature: string;
  pub_key: {
    type: string;
    value: string;
  };
  nonce: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    address: string;
    name?: string;
    email?: string;
    role: string;
  };
}

interface NonceResponse {
  nonce: string;
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

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): any {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  async refreshToken(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }

    try {
      const response = await apiClient.post<{ token: string }>('/api/auth/refresh', { token });
      localStorage.setItem(TOKEN_KEY, response.data.token);
    } catch (error) {
      console.error('[AuthService] Erro ao atualizar token:', error);
      throw new Error('Erro ao atualizar token');
    }
  },

  setAuthData(token: string, user: any): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}; 
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeplr } from './useKeplr';
import { apiClient } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  walletAddress: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  walletAddress: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { keplr, isConnecting, error: keplrError, connectKeplr, disconnect: disconnectKeplr } = useKeplr();

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setAuth(parsedAuth);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${parsedAuth.token}`;
      } catch (err) {
        console.error('Error parsing stored auth:', err);
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const { user, token } = response.data;
      setAuth({ user, token });
      localStorage.setItem('auth', JSON.stringify({ user, token }));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      const { user, token } = response.data;
      setAuth({ user, token });
      localStorage.setItem('auth', JSON.stringify({ user, token }));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar usuário');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('auth');
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const connect = async (walletType: string) => {
    try {
      setIsLoading(true);
      setError(null);
      if (walletType === 'keplr') {
        const address = await connectKeplr();
        if (auth?.user) {
          await updateUser({ walletAddress: address });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar carteira');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await disconnectKeplr();
      if (auth?.user) {
        await updateUser({ walletAddress: '' });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao desconectar carteira');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.put<AuthResponse>(`/users/${auth?.user.id}`, userData);
      const { user, token } = response.data;
      setAuth({ user, token });
      localStorage.setItem('auth', JSON.stringify({ user, token }));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar usuário');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<AuthResponse>('/auth/refresh-token', {
        token: auth?.token
      });
      const { user, token } = response.data;
      setAuth({ user, token });
      localStorage.setItem('auth', JSON.stringify({ user, token }));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar token');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user: auth?.user || null,
    token: auth?.token || null,
    isAuthenticated: !!auth?.user,
    isLoading,
    error,
    login,
    register,
    logout,
    connect,
    disconnect,
    updateUser,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
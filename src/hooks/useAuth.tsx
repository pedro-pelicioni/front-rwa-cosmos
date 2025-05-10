import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { useToast } from '@chakra-ui/react';
import { useKeplr } from './useKeplr';
import { useNoble } from './useNoble';

interface User {
  id: string;
  address: string;
  walletType: 'keplr' | 'noble';
  isConnected: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleConnect: (walletType: 'keplr' | 'noble') => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('[AuthProvider] Montando AuthProvider');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const keplr = useKeplr();
  const noble = useNoble();

  useEffect(() => {
    // Verifica se há um token no localStorage ao iniciar
    const token = authService.getToken();
    if (token) {
      setIsAuthenticated(true);
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    authService.setToken(token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleConnect = async (walletType: 'keplr' | 'noble') => {
    try {
      setIsLoading(true);
      console.log('[Auth] Iniciando conexão com carteira:', walletType);
      toast({
        title: 'Iniciando conexão',
        description: `Conectando com a carteira ${walletType === 'keplr' ? 'Keplr' : 'Noble'}...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      let authResponse = null;
      if (walletType === 'keplr') {
        authResponse = await keplr.connect();
        console.log('[Auth] authResponse retornado do Keplr:', authResponse);
      } else if (walletType === 'noble') {
        authResponse = await noble.connect();
        console.log('[Auth] authResponse retornado do Noble:', authResponse);
      }
      if (!authResponse) {
        throw new Error('Falha ao conectar com a carteira ' + walletType);
      }
      setUser({
        id: authResponse.user.id.toString(),
        address: authResponse.user.address,
        walletType,
        isConnected: true,
        role: authResponse.user.role
      });
      authService.setToken(authResponse.token);
      localStorage.setItem('user', JSON.stringify({
        id: authResponse.user.id.toString(),
        address: authResponse.user.address,
        walletType,
        isConnected: true,
        role: authResponse.user.role
      }));
      console.log('[Auth] Usuário autenticado e salvo no contexto:', authResponse.user);

      toast({
        title: 'Autenticação concluída',
        description: 'Você foi autenticado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('[Auth] Erro na autenticação:', error);
      toast({
        title: 'Erro na autenticação',
        description: 'Falha ao conectar com a carteira',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      console.log('[Auth] Fim do processo de conexão.');
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      toast({
        title: 'Desconectando',
        description: 'Desconectando sua carteira...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      if (user?.walletType === 'keplr') {
        await keplr.disconnect();
      } else if (user?.walletType === 'noble') {
        await noble.disconnect();
      }
      setUser(null);
      localStorage.removeItem('user');
      toast({
        title: 'Desconectado',
        description: 'Você foi desconectado com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Falha ao desconectar da carteira',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        handleConnect,
        handleDisconnect
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 
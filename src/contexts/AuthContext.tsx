import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeplrContext } from './KeplrContext';
import { authService } from '../services/auth';
import { useToast } from '@chakra-ui/react';

interface User {
  id: number;
  address: string;
  email?: string;
  name?: string;
  role: string;
  isConnected?: boolean;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
<<<<<<< HEAD
  const [user, setUser] = useState<User | null>(() => {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  });
=======
  const [user, setUser] = useState<User | null>(null);
>>>>>>> main
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const keplr = useKeplrContext();
  const toast = useToast();

  const connect = useCallback(async (walletType: string) => {
    try {
      setIsLoading(true);
      
      if (walletType === 'keplr' && keplr.signMessage && keplr.getAddress) {
        const address = await keplr.getAddress();
        const nonce = await authService.getNonce(address);
        
        const signature = await keplr.signMessage(nonce);
        
<<<<<<< HEAD
        const response = await authService.loginWithWallet(
          address,
          signature,
          nonce
        );
        
        setUser(response.user);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
=======
        const response = await authService.loginWithWallet({
          address,
          signature: signature.signature,
          pub_key: {
            type: 'tendermint/PubKeySecp256k1',
            value: signature.pub_key.value
          },
          nonce
        });
        
        setUser(response.user);
        localStorage.setItem('token', response.token);
>>>>>>> main
        
        toast({
          title: 'Conectado com sucesso!',
          description: 'Você foi conectado com sucesso!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
<<<<<<< HEAD
        navigate('/wallet');
=======
        navigate('/dashboard');
>>>>>>> main
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao conectar:', error);
      toast({
        title: 'Erro ao conectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [keplr, navigate, toast]);

  const disconnect = useCallback(async () => {
    try {
      await keplr.disconnect();
      setUser(null);
<<<<<<< HEAD
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
=======
      localStorage.removeItem('token');
>>>>>>> main
      navigate('/login');
    } catch (error) {
      console.error('[AuthContext] Erro ao desconectar:', error);
      toast({
        title: 'Erro ao desconectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [keplr, navigate, toast]);

  const logout = useCallback(() => {
    setUser(null);
<<<<<<< HEAD
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
=======
    localStorage.removeItem('token');
>>>>>>> main
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        connect,
        disconnect,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 
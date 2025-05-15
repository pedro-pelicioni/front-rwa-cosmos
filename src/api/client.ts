import axios from 'axios';
import { authService } from '../services/auth';
import { useToast } from '@chakra-ui/react';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Toast global para sessão expirada
function showSessionExpiredToast() {
  if (window && (window as any).showedSessionExpiredToast) return;
  (window as any).showedSessionExpiredToast = true;
  const event = new CustomEvent('sessionExpired');
  window.dispatchEvent(event);
}

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    // Formata os dados da requisição para garantir que estão no formato correto
    if (config.data && typeof config.data === 'object') {
      // Se for uma requisição de login com wallet, garante que o endereço está no formato correto
      if (config.url === '/api/auth/wallet-login' && config.data.address) {
        config.data.address = config.data.address.trim().toLowerCase();
      }
    }
    
    // Verifica se é uma rota de RWA com método GET (rotas públicas)
    const isPublicRwaRoute = config.url?.startsWith('/api/rwa') && 
                             config.method?.toLowerCase() === 'get' && 
                             !config.url?.includes('/my-rwas');
    
    const token = authService.getToken();
    // Se o token existe, verifica se está expirado
    if (token) {
      if (authService.isTokenExpired(token)) {
        authService.logout();
        showSessionExpiredToast();
        window.location.href = '/wallet';
        return Promise.reject(new Error('Token expirado. Usuário deslogado.'));
      }
    }
    // Apenas adiciona o token para rotas que não são públicas
    if (token && !isPublicRwaRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Requisição sendo enviada:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('Erro ao preparar requisição:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('Resposta recebida:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Erro na resposta da API:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      authService.logout();
    }
    return Promise.reject(error);
  }
); 
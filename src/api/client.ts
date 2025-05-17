import axios from 'axios';
import { authService } from '../services/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função para mostrar toast de sessão expirada
// const showSessionExpiredToast = () => { ... }

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

    // Verifica se é uma rota pública de autenticação
    const isPublicAuthRoute = config.url?.startsWith('/api/auth/nonce') ||
                              config.url?.startsWith('/api/auth/wallet-login');

    const token = authService.getToken();
    const user = authService.getUser();
    
    // Se o token existe, verifica se está expirado
    if (token) {
      if (authService.isTokenExpired(token)) {
        console.log('[API] Token expirado, fazendo logout...');
        authService.logout();
        
        // Não redireciona automaticamente, apenas rejeita a requisição
        return Promise.reject(new Error('Token expirado. Por favor, faça login novamente.'));
      }
      
      // Adiciona o token para rotas que não são públicas
      if (!isPublicRwaRoute && !isPublicAuthRoute) {
        config.headers.Authorization = `Bearer ${token}`;
        if (user?.address) {
          config.headers['x-wallet-address'] = user.address;
        }
      }
    } else if (!isPublicRwaRoute && !isPublicAuthRoute) {
      // Se não tem token e não é rota pública, rejeita a requisição
      return Promise.reject(new Error('Usuário não autenticado. Por favor, faça login.'));
    }
    
    console.log('Requisição sendo enviada:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [REDACTED]' : undefined
      },
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

    // Tratamento específico para erros de autenticação
    if (error.response?.status === 401) {
      console.log('[API] Erro 401 - Token inválido ou expirado');
      authService.logout();
    }

    // Melhora a mensagem de erro para o usuário
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.message.includes('jwt malformed')) {
      error.message = 'Token inválido. Por favor, faça login novamente.';
    }

    return Promise.reject(error);
  }
); 
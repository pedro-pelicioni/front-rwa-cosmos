import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { authService } from '../services/auth';

const TIMEOUT = 30000; // 30 segundos

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Lista de rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/api/auth/nonce',
  '/api/auth/wallet-login',
  '/api/auth/register',
  '/api/rwa',
  '/api/rwa/',
  '/api/rwa/images',
  '/api/rwa/nfts',
  '/api/rwa/tokens',
  '/marketplace/listings',
  '/marketplace/listings/search',
  '/marketplace/listings/{listing_id}',
  '/marketplace/tokens/{nft_token_id}/availability'
];

// Função para verificar se uma URL é pública
const isPublicRoute = (url: string): boolean => {
  // Remove a base URL se presente e os parâmetros de query
  const path = url.replace(API_URL, '').split('?')[0];
  
  return PUBLIC_ROUTES.some(route => {
    // Converte o padrão da rota em uma expressão regular
    const pattern = route
      .replace(/\{.*?\}/g, '[^/]+') // Substitui {param} por qualquer caractere não-/
      .replace(/\//g, '\\/'); // Escapa as barras
    
    const regex = new RegExp(`^${pattern}$`);
    console.log('[API] Verificando rota pública:', { path, pattern, isMatch: regex.test(path) });
    return regex.test(path);
  });
};

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: TIMEOUT,
  });

  instance.interceptors.request.use(
    async (config) => {
      console.log('[API] Requisição sendo enviada:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers
      });

      // Verifica se a URL é pública antes de verificar o token
      const url = config.url || '';
      if (!isPublicRoute(url)) {
        const token = authService.getToken();
        if (token) {
          // Verifica se o token está expirado
          if (authService.isTokenExpired(token)) {
            console.log('[API] Token expirado');
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('[API] Token não encontrado, redirecionando para login');
          authService.logout();
          throw new Error('Token não encontrado');
        }
      }

      return config;
    },
    (error) => {
      console.error('[API] Erro na requisição:', error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      console.log('[API] Resposta recebida:', {
        status: response.status,
        data: response.data
      });
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig;
      
      if (!config) {
        console.error('[API] Erro na resposta da API:', error);
        return Promise.reject(error);
      }

      // Se for erro 401 e não for rota pública, apenas lança o erro para o componente tratar
      if (error.response?.status === 401 && !isPublicRoute(config.url || '')) {
        console.log('[API] Erro 401 recebido, repassando para o componente tratar');
        // Não faz logout automático aqui!
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      // Se for erro 404, retorna array vazio para não quebrar a UI
      if (error.response?.status === 404) {
        console.log('[API] Rota não encontrada:', config.url);
        return { data: [] };
      }

      // Se for erro 403, retorna erro específico
      if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para realizar esta ação');
      }

      console.error('[API] Erro na resposta da API:', error);
      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiClient = createAxiosInstance();

// Função para mostrar toast de sessão expirada
// const showSessionExpiredToast = () => { ... } 
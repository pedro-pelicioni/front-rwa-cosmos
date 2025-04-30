import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    return Promise.reject(error);
  }
); 
import { apiClient } from '../api/client';
import { authService } from './auth';

export interface KYCData {
  id?: number;
  userId: number;
  fullName?: string;
  cpf?: string;
  documentType?: string;
  documentNumber?: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_started' | 'unauthorized';
  createdAt?: string;
  updatedAt?: string;
}

export const kycService = {
  async getByUserId(userId: number): Promise<KYCData> {
    try {
      const response = await apiClient.get(`/api/users/kyc/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          userId,
          status: 'not_started'
        };
      }
      throw error;
    }
  },

  async getStatus(): Promise<KYCData> {
    try {
      const response = await apiClient.get('/api/users/kyc');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          userId: authService.getUser()?.id || 0,
          status: 'not_started'
        };
      }
      if (error.response?.status === 401) {
        // Retorna um status especial para indicar sessão expirada, sem lançar erro
        return {
          userId: authService.getUser()?.id || 0,
          status: 'unauthorized'
        };
      }
      throw error;
    }
  },

  async submitBasic(data: { nome: string; cpf: string }): Promise<KYCData> {
    try {
      const response = await apiClient.post('/api/users/kyc/basic', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async submitDocuments(formData: FormData): Promise<KYCData> {
    try {
      const response = await apiClient.post('/api/users/kyc/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async submitKyc(data: FormData): Promise<KYCData> {
    try {
      // Validação básica dos dados
      const requiredFields = ['documentType', 'documentNumber', 'document'];
      for (const field of requiredFields) {
        if (!data.get(field)) {
          throw new Error(`Campo ${field} é obrigatório`);
        }
      }

      // Validação do tipo de documento
      const documentType = data.get('documentType') as string;
      if (!['cpf', 'cnpj', 'rg'].includes(documentType)) {
        throw new Error('Tipo de documento inválido');
      }

      // Validação do tamanho do arquivo (máximo 5MB)
      const document = data.get('document') as File;
      if (document.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 5MB');
      }

      const response = await apiClient.post('/api/users/kyc', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('[KYCService] Erro ao submeter dados KYC:', error);
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      throw new Error(error.response?.data?.message || 'Erro ao submeter dados KYC');
    }
  },

  async updateKyc(id: number, data: FormData): Promise<KYCData> {
    try {
      const response = await apiClient.put(`/api/users/kyc/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        try {
          await authService.refreshToken();
          const response = await apiClient.put(`/api/users/kyc/${id}`, data, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          return response.data;
        } catch (refreshError) {
          console.error('Erro ao refresh do token:', refreshError);
          throw new Error('Falha ao autenticar. Por favor, faça login novamente.');
        }
      }
      throw error;
    }
  }
}; 
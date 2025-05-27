import { apiClient } from '../api/client';
import { authService } from './authService';

export interface KYCData {
  id: number;
  userId: number;
  status: 'pending' | 'approved' | 'rejected';
  documentType: string;
  documentNumber: string;
  documentUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const kycService = {
  async getByUserId(userId: number): Promise<KYCData | null> {
    try {
      const response = await apiClient.get(`/api/kyc/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[KYCService] Erro ao buscar dados KYC:', error);
      return null;
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

  async getStatus(userId: number): Promise<string> {
    try {
      const kycData = await this.getByUserId(userId);
      return kycData?.status || 'pending';
    } catch (error) {
      console.error('[KYCService] Erro ao obter status KYC:', error);
      return 'pending';
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
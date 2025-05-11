import { useState, useCallback } from 'react';
import { useRWA } from './useRWA';
import { useRWAImages } from './useRWAImages';
import { useRWAFacilities } from './useRWAFacilities';
import { useRWATokens } from './useRWATokens';
import { Property } from '../types/Property';
import { RWA, RWAImage, RWAFacility } from '../types/rwa';
import { apiClient } from '../api/client';

export const useProperty = () => {
  const { 
    getAll: getAllRWA, 
    getById: getRWAById, 
    create: createRWA,
    update: updateRWA,
    remove: removeRWA,
    loading: rwaLoading, 
    error: rwaError 
  } = useRWA();
  
  const { getByRWAId: getImagesByRWAId, loading: imagesLoading } = useRWAImages();
  const { getByRWAId: getFacilitiesByRWAId, loading: facilitiesLoading } = useRWAFacilities();
  const { getByRWAId: getTokensByRWAId, loading: tokensLoading } = useRWATokens();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Função para extrair a mensagem de erro da resposta
  const extractErrorMessage = (err: any): string => {
    if (err.response?.data?.error) {
      return err.response.data.error;
    } else if (err.response?.data?.message) {
      return err.response.data.message;
    } else if (err.response?.data?.errors) {
      // Se houver um array de erros, junta-os em uma string
      if (Array.isArray(err.response.data.errors)) {
        return err.response.data.errors.join('; ');
      }
      // Se for um objeto com múltiplos erros em campos
      if (typeof err.response.data.errors === 'object') {
        return Object.values(err.response.data.errors).flat().join('; ');
      }
      return String(err.response.data.errors);
    } else if (err.message) {
      return err.message;
    } else {
      return 'Ocorreu um erro desconhecido';
    }
  };
  
  // Converter RWA para Property
  const rwaToProperty = useCallback(async (rwa: RWA): Promise<Property> => {
    // Verifica se o objeto RWA possui as propriedades necessárias
    if (!rwa || typeof rwa !== 'object') {
      throw new Error('Dados de RWA inválidos');
    }
    
    // Lidar com camel case e snake case nos campos da API
    const id = rwa.id || rwa.id;
    const userId = rwa.userId || rwa.user_id;
    const createdAt = rwa.createdAt || rwa.created_at;
    const updatedAt = rwa.updatedAt || rwa.updated_at;
    const currentValue = typeof rwa.currentValue !== 'undefined' ? rwa.currentValue : 
                         typeof rwa.current_value !== 'undefined' ? 
                           (typeof rwa.current_value === 'string' ? parseFloat(rwa.current_value) : rwa.current_value) : 0;
    const totalTokens = rwa.totalTokens || rwa.total_tokens;
    const yearBuilt = rwa.yearBuilt || rwa.year_built;
    const sizeM2 = rwa.sizeM2 || rwa.size_m2;
    const gpsCoordinates = rwa.gpsCoordinates || rwa.gps_coordinates;
    
    // Não busca imagens e facilities para evitar erros 404
    // Os endpoints /api/rwa/:id/images e /api/rwa/:id/facilities não existem
    
    return {
      id: id ? id.toString() : '0',
      name: rwa.name || '',
      description: rwa.description || '',
      location: `${rwa.city || ''}, ${rwa.country || ''}`,
      price: currentValue,
      totalTokens: totalTokens || 0,
      availableTokens: totalTokens || 0, // Placeholder, será atualizado depois
      metadata: {
        images: [], // Inicializa com array vazio em vez de tentar buscar
        documents: [], // Não temos isso no backend ainda
        amenities: [], // Inicializa com array vazio em vez de tentar buscar
        yearBuilt: yearBuilt,
        squareMeters: sizeM2,
        gpsCoordinates: gpsCoordinates || ''
      },
      owner: userId ? userId.toString() : '0',
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      status: rwa.status || 'active'
    };
  }, []);
  
  // Property para RWA (para criar e atualizar)
  const propertyToRwa = useCallback((property: Partial<Property>): Partial<RWA> => {
    if (!property.location) return {}; 
    
    // Extrair cidade e país da localização
    const locationParts = property.location.split(',').map(part => part.trim());
    let city = locationParts[0] || '';
    let country = locationParts.length > 1 ? locationParts[1] : '';
    
    // Se não tiver vírgula, usa todo o texto como cidade e país
    if (locationParts.length === 1 && city) {
      country = city;
    }
    
    return {
      name: property.name,
      description: property.description,
      city,
      country,
      currentValue: property.price,
      totalTokens: property.totalTokens,
      yearBuilt: property.metadata?.yearBuilt,
      sizeM2: property.metadata?.squareMeters,
      gpsCoordinates: property.metadata?.gpsCoordinates || '',
      status: property.status || 'active'
    };
  }, []);
  
  // Obter todas as propriedades
  const getAll = useCallback(async (): Promise<Property[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const rwas = await getAllRWA();
      const properties = await Promise.all(rwas.map(rwa => rwaToProperty(rwa)));
      return properties;
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAllRWA, rwaToProperty]);
  
  // Obter propriedade por ID
  const getById = useCallback(async (id: string): Promise<Property> => {
    setLoading(true);
    setError(null);
    
    try {
      const rwa = await getRWAById(parseInt(id));
      return await rwaToProperty(rwa);
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getRWAById, rwaToProperty]);
  
  // Criar propriedade
  const create = useCallback(async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    setLoading(true);
    setError(null);
    
    try {
      const rwaData = propertyToRwa(property as Property);
      const rwa = await createRWA(rwaData as Omit<RWA, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Criar um objeto Property diretamente a partir da resposta da API, sem buscar dados relacionados
      // Isso evita erros 404 quando as APIs de imagens e facilities não estão disponíveis
      const newProperty: Property = {
        id: rwa.id.toString(),
        name: rwa.name,
        description: rwa.description || '',
        location: `${rwa.city || ''}, ${rwa.country || ''}`,
        price: typeof rwa.currentValue !== 'undefined' ? rwa.currentValue : 
               typeof rwa.current_value !== 'undefined' ? 
                 (typeof rwa.current_value === 'string' ? parseFloat(rwa.current_value) : rwa.current_value) : 0,
        totalTokens: rwa.totalTokens || rwa.total_tokens || 0,
        availableTokens: rwa.totalTokens || rwa.total_tokens || 0,
        metadata: {
          images: property.metadata?.images || [],
          documents: property.metadata?.documents || [],
          amenities: property.metadata?.amenities || [],
          yearBuilt: rwa.yearBuilt || rwa.year_built,
          squareMeters: rwa.sizeM2 || rwa.size_m2,
          gpsCoordinates: rwa.gpsCoordinates || rwa.gps_coordinates || ''
        },
        owner: (rwa.userId || rwa.user_id || 0).toString(),
        createdAt: rwa.createdAt || rwa.created_at || new Date().toISOString(),
        updatedAt: rwa.updatedAt || rwa.updated_at || new Date().toISOString(),
        status: rwa.status || 'active'
      };
      
      // Se tiver imagens, criar elas também, mas não bloqueia a resposta para o usuário
      if (property.metadata?.images?.length) {
        // Cria as imagens em segundo plano para não bloquear o fluxo
        Promise.all(property.metadata.images.map((image, i) => 
          apiClient.post(`/api/rwa/${rwa.id}/images`, {
            rwa_id: rwa.id,
            title: `Image ${i+1}`,
            file_path: image,
            display_order: i
          }).catch(err => console.error(`Erro ao criar imagem ${i+1}:`, err))
        )).catch(err => console.error('Erro ao criar imagens:', err));
      }
      
      return newProperty;
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createRWA, propertyToRwa]);
  
  // Atualizar propriedade
  const update = useCallback(async (id: string, property: Partial<Property>): Promise<Property> => {
    setLoading(true);
    setError(null);
    
    try {
      const rwaData = propertyToRwa(property);
      const rwa = await updateRWA(parseInt(id), rwaData);
      
      // Criar um objeto Property diretamente a partir da resposta da API
      // Reutiliza as imagens e amenidades do objeto property original para evitar erros 404
      const updatedProperty: Property = {
        id: rwa.id.toString(),
        name: rwa.name,
        description: rwa.description || '',
        location: `${rwa.city || ''}, ${rwa.country || ''}`,
        price: typeof rwa.currentValue !== 'undefined' ? rwa.currentValue : 
               typeof rwa.current_value !== 'undefined' ? 
                 (typeof rwa.current_value === 'string' ? parseFloat(rwa.current_value) : rwa.current_value) : 0,
        totalTokens: rwa.totalTokens || rwa.total_tokens || 0,
        availableTokens: rwa.totalTokens || rwa.total_tokens || 0,
        metadata: {
          images: property.metadata?.images || [],
          documents: property.metadata?.documents || [],
          amenities: property.metadata?.amenities || [],
          yearBuilt: rwa.yearBuilt || rwa.year_built,
          squareMeters: rwa.sizeM2 || rwa.size_m2,
          gpsCoordinates: rwa.gpsCoordinates || rwa.gps_coordinates || ''
        },
        owner: (rwa.userId || rwa.user_id || 0).toString(),
        createdAt: rwa.createdAt || rwa.created_at || new Date().toISOString(),
        updatedAt: rwa.updatedAt || rwa.updated_at || new Date().toISOString(),
        status: rwa.status || 'active'
      };
      
      return updatedProperty;
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateRWA, propertyToRwa]);
  
  // Remover propriedade
  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await removeRWA(parseInt(id));
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeRWA]);
  
  return {
    loading: loading || rwaLoading || imagesLoading || facilitiesLoading || tokensLoading,
    error,
    getAll,
    getById,
    create,
    update,
    remove
  };
}; 
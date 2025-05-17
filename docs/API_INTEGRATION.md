# Documentação da Integração da API

## Estrutura Implementada

### Tipos
- `src/types/rwa.ts`: Interfaces para todas as entidades do sistema
  - RWA (Real World Asset)
  - RWAImage
  - RWAFacility
  - RWANFTToken
  - RWAOwnershipHistory

### Serviços
- `src/services/rwaService.ts`: Gerenciamento de RWAs
- `src/services/imageService.ts`: Gerenciamento de imagens
- `src/services/facilityService.ts`: Gerenciamento de instalações
- `src/services/tokenService.ts`: Gerenciamento de tokens NFT

### Hooks
- `src/hooks/useRWA.ts`: Hook para gerenciamento de RWAs
- `src/hooks/useRWAImages.ts`: Hook para gerenciamento de imagens
- `src/hooks/useRWAFacilities.ts`: Hook para gerenciamento de instalações
- `src/hooks/useRWATokens.ts`: Hook para gerenciamento de tokens

## Endpoints Implementados

### Autenticação
- `GET /api/auth/nonce`
- `POST /api/auth/wallet-login`

### RWAs
- `GET /api/rwa`
- `GET /api/rwa/:id`
- `POST /api/rwa`
- `PUT /api/rwa/:id`
- `DELETE /api/rwa/:id`
- `GET /api/rwa/status/:status`
- `GET /api/rwa/user/:userId`

### Imagens
- `GET /api/rwa/:id/images`
- `POST /api/rwa/:id/images`
- `PUT /api/rwa/images/:id`
- `DELETE /api/rwa/images/:id`
- `PUT /api/rwa/:id/images/order`

### Instalações
- `GET /api/rwa/:id/facilities`
- `POST /api/rwa/:id/facilities`
- `PUT /api/rwa/facilities/:id`
- `DELETE /api/rwa/facilities/:id`
- `GET /api/rwa/:id/facilities/floor/:floorNumber`
- `GET /api/rwa/:id/facilities/type/:type`

### Tokens
- `GET /api/rwa/:id/tokens`
- `GET /api/rwa/tokens/owner/:userId`
- `GET /api/rwa/tokens/:id/history`
- `POST /api/rwa/tokens/:id/transfer`
- `GET /api/rwa/tokens/:id/metadata`

## Próximos Passos

1. Implementar componentes de UI para:
   - Listagem de RWAs
   - Detalhes do RWA
   - Galeria de imagens
   - Gerenciamento de instalações
   - Histórico de transações

2. Adicionar testes unitários para:
   - Serviços
   - Hooks
   - Componentes

3. Implementar tratamento de erros mais robusto

4. Adicionar documentação de uso dos hooks

## Decisões Técnicas

1. **Gerenciamento de Estado**
   - Uso de hooks personalizados para encapsular lógica de estado
   - Estado local para loading e erros
   - Uso de useCallback para memoização de funções

2. **Tratamento de Erros**
   - Erros padronizados em todos os serviços
   - Mensagens de erro em português
   - Logging de erros no console para debugging

3. **Tipagem**
   - Interfaces TypeScript para todas as entidades
   - Tipagem estrita para parâmetros e retornos
   - Uso de tipos utilitários (Omit, Partial)

4. **Autenticação**
   - Token JWT armazenado no localStorage
   - Interceptor para adicionar token em todas as requisições
   - Logout automático em caso de token inválido 


   const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Tokenização de Imóveis',
      version: '1.0.0',
      description: 'API para gerenciamento de tokenização de imóveis',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      schemas: {
        RWA: {
          type: 'object',
          required: ['name', 'gpsCoordinates', 'city', 'country', 'currentValue', 'totalTokens'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID do RWA',
            },
            userId: {
              type: 'integer',
              description: 'ID do usuário proprietário',
            },
            name: {
              type: 'string',
              description: 'Nome do RWA',
            },
            gpsCoordinates: {
              type: 'string',
              description: 'Coordenadas GPS do RWA',
            },
            city: {
              type: 'string',
              description: 'Cidade do RWA',
            },
            country: {
              type: 'string',
              description: 'País do RWA',
            },
            description: {
              type: 'string',
              description: 'Descrição do RWA',
            },
            currentValue: {
              type: 'number',
              description: 'Valor atual do RWA',
            },
            totalTokens: {
              type: 'integer',
              description: 'Total de tokens disponíveis',
            },
            yearBuilt: {
              type: 'integer',
              description: 'Ano de construção',
            },
            sizeM2: {
              type: 'number',
              description: 'Tamanho em metros quadrados',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'sold'],
              description: 'Status do RWA',
            },
            geometry: {
              type: 'object',
              description: 'Geometria do RWA em formato GeoJSON',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
        RWAImage: {
          type: 'object',
          required: ['rwa_id', 'title'],
          properties: {
            id: { 
              type: 'integer',
              description: 'ID da imagem'
            },
            rwa_id: { 
              type: 'integer',
              description: 'ID do RWA'
            },
            title: { 
              type: 'string',
              description: 'Título da imagem'
            },
            description: { 
              type: 'string',
              description: 'Descrição da imagem'
            },
            cid_link: { 
              type: 'string',
              description: 'Link IPFS da imagem'
            },
            file_path: { 
              type: 'string',
              description: 'Caminho do arquivo'
            },
            image_data: { 
              type: 'string',
              description: 'Imagem codificada em base64 (max 10MB)'
            },
            display_order: { 
              type: 'integer',
              description: 'Ordem de exibição'
            },
            created_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        RWAFacility: {
          type: 'object',
          required: ['rwa_id', 'name', 'type'],
          properties: {
            id: { 
              type: 'integer',
              description: 'ID da instalação'
            },
            rwa_id: { 
              type: 'integer',
              description: 'ID do RWA'
            },
            name: { 
              type: 'string',
              description: 'Nome da instalação'
            },
            description: { 
              type: 'string',
              description: 'Descrição da instalação'
            },
            size_m2: { 
              type: 'number',
              description: 'Tamanho em metros quadrados'
            },
            floor_number: { 
              type: 'integer',
              description: 'Número do andar'
            },
            type: { 
              type: 'string',
              description: 'Tipo da instalação (quarto, sala, cozinha, etc)'
            },
            status: { 
              type: 'string',
              enum: ['active', 'inactive', 'under_renovation'],
              description: 'Status da instalação'
            },
            created_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        RWANFTToken: {
          type: 'object',
          required: ['rwa_id', 'token_identifier', 'owner_user_id'],
          properties: {
            id: { 
              type: 'integer',
              description: 'ID do token'
            },
            rwa_id: { 
              type: 'integer',
              description: 'ID do RWA'
            },
            token_identifier: { 
              type: 'string',
              description: 'Identificador único do token na blockchain'
            },
            owner_user_id: { 
              type: 'integer',
              description: 'ID do usuário proprietário'
            },
            metadata_uri: { 
              type: 'string',
              description: 'URI dos metadados do token'
            },
            created_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        RWAOwnershipHistory: {
          type: 'object',
          required: ['rwa_id', 'to_user_id', 'quantity'],
          properties: {
            id: { 
              type: 'integer',
              description: 'ID do registro'
            },
            rwa_id: { 
              type: 'integer',
              description: 'ID do RWA'
            },
            token_id: { 
              type: 'integer',
              description: 'ID do token NFT'
            },
            from_user_id: { 
              type: 'integer',
              description: 'ID do usuário de origem'
            },
            to_user_id: { 
              type: 'integer',
              description: 'ID do usuário de destino'
            },
            quantity: { 
              type: 'integer',
              description: 'Quantidade de tokens transferidos'
            },
            transfer_date: { 
              type: 'string',
              format: 'date-time',
              description: 'Data da transferência'
            },
            tx_hash: { 
              type: 'string',
              description: 'Hash da transação na blockchain'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
          },
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // arquivos que contêm as anotações
};

const specs = swaggerJsdoc(options);

module.exports = specs; 




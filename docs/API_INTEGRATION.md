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
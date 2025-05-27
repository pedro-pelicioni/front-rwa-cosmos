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
        TokenListing: {
          type: 'object',
          required: ['nft_token_id', 'seller_id', 'current_price', 'original_purchase_price', 'original_purchase_date'],
          properties: {
            id: { 
              type: 'integer',
              description: 'ID do listing'
            },
            nft_token_id: { 
              type: 'integer',
              description: 'ID do token NFT'
            },
            seller_id: { 
              type: 'integer',
              description: 'ID do vendedor'
            },
            current_price: { 
              type: 'number',
              description: 'Preço atual do token'
            },
            original_purchase_price: { 
              type: 'number',
              description: 'Preço original de compra'
            },
            original_purchase_date: { 
              type: 'string',
              format: 'date-time',
              description: 'Data da compra original'
            },
            chain_transaction_metadata: { 
              type: 'object',
              description: 'Metadados da transação na blockchain'
            },
            listing_status: { 
              type: 'string',
              enum: ['active', 'sold', 'cancelled', 'expired'],
              description: 'Status do listing'
            },
            available_until: { 
              type: 'string',
              format: 'date-time',
              description: 'Data limite de disponibilidade'
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
            },
            nftToken: {
              $ref: '#/components/schemas/RWANFTToken'
            },
            seller: {
              $ref: '#/components/schemas/User'
            },
            priceHistory: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TokenPriceHistory'
              }
            }
          }
        },
        TokenPriceHistory: {
          type: 'object',
          required: ['token_listing_id', 'price', 'changed_by'],
          properties: {
            id: { 
              type: 'integer',
              description: 'ID do registro'
            },
            token_listing_id: { 
              type: 'integer',
              description: 'ID do listing'
            },
            price: { 
              type: 'number',
              description: 'Preço registrado'
            },
            changed_by: { 
              type: 'integer',
              description: 'ID do usuário que alterou o preço'
            },
            change_reason: { 
              type: 'string',
              description: 'Motivo da alteração'
            },
            created_at: { 
              type: 'string',
              format: 'date-time',
              description: 'Data da alteração'
            },
            changedByUser: {
              $ref: '#/components/schemas/User'
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
    paths: {
      '/api/rwa/tokens/sale/initiate': {
        post: {
          summary: 'Iniciar uma venda de token',
          tags: ['Token Sales'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token_id', 'quantity', 'price_per_token'],
                  properties: {
                    token_id: { type: 'integer' },
                    quantity: { type: 'integer' },
                    price_per_token: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Venda iniciada com sucesso' },
            403: { description: 'Sem permissão para vender este token' },
            404: { description: 'Token não encontrado' },
            500: { description: 'Erro ao iniciar venda' }
          }
        }
      },
      '/api/rwa/tokens/sale/confirm': {
        post: {
          summary: 'Confirmar uma venda de token',
          tags: ['Token Sales'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sale_id', 'tx_hash', 'signature'],
                  properties: {
                    sale_id: { type: 'integer' },
                    tx_hash: { type: 'string' },
                    signature: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Venda confirmada com sucesso' },
            400: { description: 'Venda não está pendente' },
            404: { description: 'Venda não encontrada' },
            500: { description: 'Erro ao confirmar venda' }
          }
        }
      },
      '/api/rwa/tokens/sale/cancel/{sale_id}': {
        post: {
          summary: 'Cancelar uma venda de token',
          tags: ['Token Sales'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'sale_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: { description: 'Venda cancelada com sucesso' },
            400: { description: 'Venda não pode ser cancelada' },
            403: { description: 'Sem permissão para cancelar esta venda' },
            404: { description: 'Venda não encontrada' },
            500: { description: 'Erro ao cancelar venda' }
          }
        }
      },
      '/api/rwa/tokens/sale/{sale_id}': {
        get: {
          summary: 'Obter uma venda de token por ID',
          tags: ['Token Sales'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'sale_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: { description: 'Venda encontrada com sucesso' },
            404: { description: 'Venda não encontrada' },
            500: { description: 'Erro ao obter venda' }
          }
        }
      },
      '/marketplace/listings': {
        get: {
          summary: 'Lista todos os tokens disponíveis para venda',
          tags: ['Marketplace'],
          responses: {
            200: {
              description: 'Lista de tokens disponíveis',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/TokenListing'
                    }
                  }
                }
              }
            },
            500: { description: 'Erro ao listar tokens' }
          }
        },
        post: {
          summary: 'Cria um novo listing para venda de token',
          tags: ['Marketplace'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nft_token_id', 'current_price', 'original_purchase_price', 'original_purchase_date'],
                  properties: {
                    nft_token_id: { type: 'integer' },
                    current_price: { type: 'number' },
                    original_purchase_price: { type: 'number' },
                    original_purchase_date: { type: 'string', format: 'date-time' },
                    chain_transaction_metadata: { type: 'object' },
                    available_until: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Listing criado com sucesso' },
            400: { description: 'Token já está listado' },
            403: { description: 'Token não pertence ao usuário' },
            500: { description: 'Erro ao criar listing' }
          }
        }
      },
      '/marketplace/listings/search': {
        get: {
          summary: 'Busca listings com filtros',
          tags: ['Marketplace'],
          parameters: [
            {
              in: 'query',
              name: 'min_price',
              schema: { type: 'number' }
            },
            {
              in: 'query',
              name: 'max_price',
              schema: { type: 'number' }
            },
            {
              in: 'query',
              name: 'status',
              schema: { 
                type: 'string',
                enum: ['active', 'sold', 'cancelled', 'expired']
              }
            },
            {
              in: 'query',
              name: 'sort_by',
              schema: { 
                type: 'string',
                enum: ['created_at', 'current_price']
              }
            },
            {
              in: 'query',
              name: 'sort_order',
              schema: { 
                type: 'string',
                enum: ['asc', 'desc']
              }
            }
          ],
          responses: {
            200: {
              description: 'Lista de listings filtrados',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/TokenListing'
                    }
                  }
                }
              }
            },
            500: { description: 'Erro ao buscar listings' }
          }
        }
      },
      '/marketplace/my-listings': {
        get: {
          summary: 'Lista os tokens do usuário logado',
          tags: ['Marketplace'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de tokens do usuário',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/TokenListing'
                    }
                  }
                }
              }
            },
            500: { description: 'Erro ao listar tokens' }
          }
        }
      },
      '/marketplace/listings/{listing_id}': {
        get: {
          summary: 'Obtém detalhes de um listing específico',
          tags: ['Marketplace'],
          parameters: [
            {
              in: 'path',
              name: 'listing_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Detalhes do listing',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TokenListing'
                  }
                }
              }
            },
            404: { description: 'Listing não encontrado' },
            500: { description: 'Erro ao obter detalhes' }
          }
        }
      },
      '/marketplace/listings/{listing_id}/price': {
        patch: {
          summary: 'Atualiza o preço de um listing',
          tags: ['Marketplace'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'listing_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['new_price'],
                  properties: {
                    new_price: { type: 'number' },
                    change_reason: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Preço atualizado com sucesso' },
            403: { description: 'Apenas o vendedor pode atualizar o preço' },
            404: { description: 'Listing não encontrado' },
            500: { description: 'Erro ao atualizar preço' }
          }
        }
      },
      '/marketplace/listings/{listing_id}/cancel': {
        patch: {
          summary: 'Cancela um listing',
          tags: ['Marketplace'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'listing_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: { description: 'Listing cancelado com sucesso' },
            403: { description: 'Apenas o vendedor pode cancelar o listing' },
            404: { description: 'Listing não encontrado' },
            500: { description: 'Erro ao cancelar listing' }
          }
        }
      },
      '/marketplace/listings/{listing_id}/status': {
        patch: {
          summary: 'Atualiza o status de um listing',
          tags: ['Marketplace'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'listing_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { 
                      type: 'string',
                      enum: ['active', 'sold', 'cancelled', 'expired']
                    },
                    transaction_metadata: { type: 'object' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Status atualizado com sucesso' },
            403: { description: 'Sem permissão para atualizar' },
            404: { description: 'Listing não encontrado' },
            500: { description: 'Erro ao atualizar status' }
          }
        }
      },
      '/marketplace/listings/{listing_id}/price-history': {
        get: {
          summary: 'Obtém o histórico de preços de um token',
          tags: ['Marketplace'],
          parameters: [
            {
              in: 'path',
              name: 'listing_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Histórico de preços',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/TokenPriceHistory'
                    }
                  }
                }
              }
            },
            500: { description: 'Erro ao obter histórico' }
          }
        }
      },
      '/marketplace/tokens/{nft_token_id}/availability': {
        get: {
          summary: 'Verifica se um token está disponível para venda',
          tags: ['Marketplace'],
          parameters: [
            {
              in: 'path',
              name: 'nft_token_id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Status de disponibilidade do token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      available: { type: 'boolean' },
                      listing: { 
                        $ref: '#/components/schemas/TokenListing'
                      }
                    }
                  }
                }
              }
            },
            500: { description: 'Erro ao verificar disponibilidade' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // arquivos que contêm as anotações
};

const specs = swaggerJsdoc(options);

module.exports = specs; 
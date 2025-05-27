import React from 'react';
import { NFTToken } from '../services/nftService';
import { Link } from 'react-router-dom';

interface NFTGridProps {
  nfts: NFTToken[];
}

export const NFTGrid: React.FC<NFTGridProps> = ({ nfts }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {nfts.map((nft) => (
        <div
          key={nft.id}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-lg font-medium">
                    {nft.token_identifier.slice(0, 2)}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Token #{nft.token_identifier}
                </h3>
                <p className="text-sm text-gray-500">
                  RWA #{nft.rwa_id}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Proprietário</dt>
                  <dd className="mt-1 text-sm text-gray-900 truncate">
                    {nft.owner?.address || 'Não disponível'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Criado em</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(nft.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="mt-6">
              <Link
                to={`/nfts/${nft.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ver Detalhes
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 
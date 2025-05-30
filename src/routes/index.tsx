import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { MarketplacePage } from '../pages/Marketplace';
import { NFTList } from '../pages/NFTList';
import { NFTDetailsPage } from '../pages/NFTDetails';
import { NFTMintForm } from '../components/NFTMintForm';
import { NFTBurnForm } from '../components/NFTBurnForm';
import { NFTTransferForm } from '../components/NFTTransferForm';
import { Layout } from '../components/Layout';
import { Assets } from '../pages/Assets';
import { LatamMap } from '../pages/LatamMap';
import { MyAccount } from '../pages/MyAccount';
import { AssetDetails } from '../pages/AssetDetails';
import { UserDashboard } from '../pages/UserDashboard';
import { PaymentPage } from '../pages/PaymentPage';

export const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Rotas existentes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/wallet" element={<UserDashboard />} />
        
        {/* Novas rotas de NFT */}
        <Route path="/nfts" element={<NFTList />} />
        <Route path="/nfts/mint" element={<NFTMintForm />} />
        <Route path="/nfts/burn" element={<NFTBurnForm />} />
        <Route path="/nfts/transfer" element={<NFTTransferForm />} />
        <Route path="/nfts/:id" element={<NFTDetailsPage />} />

        {/* Novas rotas adicionais */}
        <Route path="/assets" element={<Assets />} />
        <Route path="/assets/:id" element={<AssetDetails />} />
        <Route path="/latammap" element={<LatamMap />} />
        <Route path="/payment/:rwaId/:tokenId/:quantity/:pricePerToken" element={<PaymentPage />} />
        <Route path="/dashboard" element={<Navigate to="/wallet" replace />} />
        <Route path="/my-account" element={<Navigate to="/wallet" replace />} />
      </Routes>
    </Layout>
  );
}; 
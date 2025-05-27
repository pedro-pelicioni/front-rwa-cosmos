import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Marketplace } from '../pages/Marketplace';
import { NFTList } from '../pages/NFTList';
import { NFTDetailsPage } from '../pages/NFTDetails';
import { NFTMintForm } from '../components/NFTMintForm';
import { NFTBurnForm } from '../components/NFTBurnForm';
import { NFTTransferForm } from '../components/NFTTransferForm';
import { UserDashboard } from '../pages/UserDashboard';
import { Layout } from '../components/Layout';

export const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Rotas existentes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/wallet" element={<UserDashboard />} />
        
        {/* Novas rotas de NFT */}
        <Route path="/nfts" element={<NFTList />} />
        <Route path="/nfts/mint" element={<NFTMintForm />} />
        <Route path="/nfts/burn" element={<NFTBurnForm />} />
        <Route path="/nfts/transfer" element={<NFTTransferForm />} />
        <Route path="/nfts/:id" element={<NFTDetailsPage />} />
      </Routes>
    </Layout>
  );
}; 
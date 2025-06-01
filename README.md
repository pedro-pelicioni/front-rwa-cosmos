# 🌟 IMOLATAM: Tokenizing Real Estate in Latin America 🌟

## 📋 Overview
IMOLATAM is an innovative platform revolutionizing real estate investment in Latin America through blockchain-based property tokenization. Our mission is to democratize access to the real estate market, allowing investors of all sizes to participate in this traditionally exclusive market.

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- Keplr Wallet extension
- Modern web browser

### Installation

1. Clone the repository
   ```bash
   git clone [repository-url]
   cd front-rwa-cosmos
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Build for production
   ```bash
   npm run build
   ```

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Chakra UI for component library
- React Query for data fetching
- React Router for navigation
- Chart.js for data visualization
- Leaflet for maps integration
- Keplr Wallet integration for blockchain interactions

### Blockchain Integration
- Cosmos SDK integration
- CosmJS libraries for blockchain interactions
- NFT support for property tokenization
- Secure wallet-based authentication

## 🔐 Authentication Flow

The system uses secure message signature-based authentication:

1. Frontend requests a nonce for the wallet address
2. Backend generates and stores a unique nonce
3. User signs the nonce with their Keplr wallet
4. Frontend sends the address, nonce, and signature
5. Backend validates the signature and generates a JWT token
6. All subsequent requests require the `Authorization: Bearer <token>` header

## 🏠 Main Features

### 1. Real Estate Tokenization
- Creation of NFT tokens representing real properties
- Division of properties into tradable tokens
- Complete metadata and documentation registration
- Blockchain integration for authenticity guarantee

### 2. Token Marketplace
- Listing of tokens available for purchase
- Advanced search system with filters
- Price and transaction history
- Intuitive interface for buying and selling

### 3. KYC (Know Your Customer)
- ID document upload
- Selfie verification
- Administrator approval process
- Real-time verification status

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

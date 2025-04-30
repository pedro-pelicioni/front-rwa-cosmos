import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Assets } from './pages/Assets'
import { Transactions } from './pages/Transactions'
import { AssetDetails } from './pages/AssetDetails'
import { Wallet } from './pages/Wallet'
import { KeplrProvider } from './contexts/KeplrContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <KeplrProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/assets/:id" element={<AssetDetails />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/wallet" element={<Wallet />} />
              </Routes>
            </Layout>
          </Router>
        </KeplrProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App

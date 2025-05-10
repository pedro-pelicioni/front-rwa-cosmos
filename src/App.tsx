import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Assets } from './pages/Assets'
import { Transactions } from './pages/Transactions'
import { AssetDetails } from './pages/AssetDetails'
import { Wallet } from './pages/Wallet'
import { CreateProperty } from './pages/CreateProperty'
import { KeplrProvider } from './contexts/KeplrContext'
import { AuthProvider } from './hooks/useAuth'
import { Box, Text, VStack, Heading } from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'

console.log('[App] Montando App');

const queryClient = new QueryClient()

// Tema personalizado baseado nas cores descritas
const theme = extendTheme({
  colors: {
    primary: {
      500: '#002D5B',
      600: '#001F3F',
      700: '#001429',
    },
    accent: {
      500: '#F47B20',
      600: '#E06A15',
      700: '#CC5500',
    },
    text: {
      light: '#FFFFFF',
      dim: 'rgba(255, 255, 255, 0.8)',
    },
    bgGrid: 'rgba(255, 255, 255, 0.1)',
  },
  styles: {
    global: {
      body: {
        bg: 'primary.500',
        color: 'text.light',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md',
      },
      variants: {
        primary: {
          bg: 'accent.500',
          color: 'white',
          _hover: { bg: 'accent.600' },
        },
        outline: {
          borderColor: 'text.light',
          color: 'text.light',
          _hover: { bg: 'whiteAlpha.200' },
        },
      },
    },
  },
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Box p={8}>
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold" color="red.500">
          Something went wrong:
        </Text>
        <Text color="gray.600">{error.message}</Text>
      </VStack>
    </Box>
  )
}

export default function App() {
  return (
    <ChakraProvider theme={theme}>
    <QueryClientProvider client={queryClient}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <AuthProvider>
            <KeplrProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/create-property" element={<CreateProperty />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/assets/:id" element={<AssetDetails />} />
                  <Route path="/assets/:id/edit" element={<CreateProperty />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/map" element={<Box p={8}><Heading>Map Page</Heading><Text>Coming soon!</Text></Box>} />
                  <Route path="/how-it-works" element={<Box p={8}><Heading>How It Works</Heading><Text>Coming soon!</Text></Box>} />
                </Routes>
              </Layout>
            </Router>
            </KeplrProvider>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
      </ChakraProvider>
  )
}

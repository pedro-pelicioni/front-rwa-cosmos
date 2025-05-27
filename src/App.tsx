import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { NFTProvider } from './contexts/NFTContext';
import { KeplrProvider } from './contexts/KeplrContext';
import { AppRoutes } from './routes';
import { theme } from './theme';

// Criar uma instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <KeplrProvider>
            <AuthProvider>
              <NFTProvider>
                <AppRoutes />
              </NFTProvider>
            </AuthProvider>
          </KeplrProvider>
        </BrowserRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
};

export default App;

import { Box, Flex, Link, VStack, Heading, Button, Text, useToast } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useKeplrContext } from '../contexts/KeplrContext'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { connect, walletAddress, walletName, error, isConnected } = useKeplrContext();
  const toast = useToast();

  const handleConnect = async () => {
    try {
      await connect();
      if (walletAddress) {
        toast({
          title: 'Conectado com sucesso',
          description: `Carteira ${walletName || walletAddress} conectada`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível conectar com a Keplr';
      
      toast({
        title: 'Erro ao conectar',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      if (errorMessage.includes('não está instalada')) {
        toast({
          title: 'Instale a Keplr',
          description: 'Por favor, instale a extensão Keplr para continuar',
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
        
        window.open('https://www.keplr.app/download', '_blank');
      }
    }
  };

  return (
    <Flex minH="100vh">
      <Box
        w="250px"
        bg="gray.100"
        p={4}
        borderRight="1px"
        borderColor="gray.200"
      >
        <VStack align="stretch" spacing={4}>
          <Heading size="md" mb={4}>Real Estate RWA Cosmos</Heading>
          <Link as={RouterLink} to="/" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Home
          </Link>
          <Link as={RouterLink} to="/assets" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Assets
          </Link>
          <Link as={RouterLink} to="/transactions" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Transactions
          </Link>
          <Link as={RouterLink} to="/wallet" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Minha Carteira
          </Link>
          
          <Box mt={4} p={4} borderWidth="1px" borderRadius="lg">
            {isConnected ? (
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" fontWeight="bold">Conectado como:</Text>
                <Text fontSize="sm" color="blue.600">{walletName || 'Usuário'}</Text>
              </VStack>
            ) : (
              <Button colorScheme="blue" onClick={handleConnect}>
                Iniciar Sessão
              </Button>
            )}
          </Box>
        </VStack>
      </Box>
      <Box flex={1} p={8}>
        {children}
      </Box>
    </Flex>
  )
} 
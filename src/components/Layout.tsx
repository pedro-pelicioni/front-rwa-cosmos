import { Box, Flex, Text, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ButtonGroup, HStack, Container, Input, InputGroup, InputRightElement, IconButton, Image } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useKeplr } from '../hooks/useKeplr'
import { useNoble } from '../hooks/useNoble'
import { FaSearch } from 'react-icons/fa'
import logoImage from '../assets/IMOLatamLogo.png'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, handleConnect, handleDisconnect, isLoading, setUser } = useAuth();
  const keplr = useKeplr();
  const noble = useNoble();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  // Function to clean everything before starting a session
  const handleOpenSession = async () => {
    // Disconnect Keplr and Noble
    await keplr.disconnect();
    await noble.disconnect();
    // Clear context and localStorage
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    onOpen();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Flex direction="column" minH="100vh" bg="primary.500" color="text.light">
      {/* Header */}
      <Box as="header" borderBottom="1px solid" borderColor="bgGrid" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            {/* Logo */}
            <Flex align="center">
              <Box mr={3} height="40px">
                <Image src={logoImage} alt="IMOLATAN Logo" height="40px" />
              </Box>
              <Text fontWeight="bold" fontSize="xl">IMOLATAN</Text>
            </Flex>
            
            {/* Navigation */}
            <HStack spacing={6}>
              <Text 
                as={RouterLink} to="/" 
                fontWeight={isActive('/') ? "bold" : "normal"}
                borderBottom={isActive('/') ? "2px solid" : "none"}
                borderColor="accent.500"
                pb={1}
              >
                Home
              </Text>
              <Text 
                as={RouterLink} to="/assets" 
                fontWeight={isActive('/assets') ? "bold" : "normal"}
                borderBottom={isActive('/assets') ? "2px solid" : "none"}
                borderColor="accent.500"
                pb={1}
              >
                Tokenized Properties
              </Text>
              <Text 
                as={RouterLink} 
                to="/map" 
                fontWeight={isActive('/map') ? "bold" : "normal"}
                borderBottom={isActive('/map') ? "2px solid" : "none"}
                borderColor="accent.500"
                pb={1}
              >
                Map
              </Text>
              <Text 
                as={RouterLink} 
                to="/how-it-works" 
                fontWeight={isActive('/how-it-works') ? "bold" : "normal"} 
                borderBottom={isActive('/how-it-works') ? "2px solid" : "none"}
                borderColor="accent.500"
                pb={1}
              >
                How It Works
              </Text>
              <Text 
                as={RouterLink} 
                to="/wallet" 
                fontWeight={isActive('/wallet') ? "bold" : "normal"}
                borderBottom={isActive('/wallet') ? "2px solid" : "none"}
                borderColor="accent.500"
                pb={1}
              >
                My Account
              </Text>
            </HStack>
            
            {/* Search & Auth */}
            <HStack spacing={4}>
              <InputGroup size="md" maxW="200px">
                <Input 
                  placeholder="Search..." 
                  bg="rgba(255,255,255,0.1)"
                  border="1px solid"
                  borderColor="bgGrid"
                  _placeholder={{ color: "text.dim" }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Search"
                    icon={<FaSearch />}
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
              
              {user?.isConnected ? (
                <Button 
                  colorScheme="whiteAlpha" 
                  variant="outline" 
                  onClick={handleDisconnect}
                  isLoading={isLoading}
                  loadingText="Disconnecting..."
                  size="sm"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  onClick={handleOpenSession}
                  isLoading={isLoading}
                  loadingText="Connecting..."
                  size="md"
                >
                  Register
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box flex={1} py={8}>
        <Container maxW="container.xl">
          {children}
        </Container>
      </Box>

      {/* Connection Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="primary.500" borderColor="bgGrid" borderWidth="1px">
          <ModalHeader color="text.light">Choose Your Wallet</ModalHeader>
          <ModalCloseButton color="text.light" />
          <ModalBody pb={6}>
            <ButtonGroup spacing={4} display="flex" flexDirection="column">
              <Button
                variant="primary"
                size="lg"
                onClick={async () => { await handleConnect('keplr'); onClose(); }}
                mb={4}
                isLoading={isLoading}
                loadingText="Connecting..."
              >
                Connect Keplr
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={async () => { await handleConnect('noble'); onClose(); }}
                isLoading={isLoading}
                loadingText="Connecting..."
              >
                Connect Noble
              </Button>
            </ButtonGroup>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
} 
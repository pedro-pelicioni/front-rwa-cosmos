import React from 'react';
import { Box, Flex, Text, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ButtonGroup, HStack, Container, Input, InputGroup, InputRightElement, IconButton, Image } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks';
import { useKeplrContext } from '../contexts/KeplrContext'
import { useNoble } from '../hooks/useNoble'
import { FaSearch, FaMap, FaList } from 'react-icons/fa'
import logoImage from '../assets/IMOLatamLogo.png'
import { WalletConnectModal } from './WalletConnectModal'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, connect, disconnect, isLoading, isAuthenticated } = useAuth();
  const keplr = useKeplrContext();
  const noble = useNoble();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  // Function to clean everything before starting a session
  const handleOpenSession = async () => {
    // Disconnect Keplr and Noble
    await keplr.disconnect();
    await noble.disconnect();
    // Clear context and localStorage
    await disconnect();
    onOpen();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Box minH="100vh">
      <Flex as="nav" bg="primary.600" p={4} justify="space-between" align="center">
        <Flex gap={4} align="center">
          <Image src={logoImage} alt="IMO Latam" h="40px" />
          <Button as={RouterLink} to="/" variant="ghost" color="white">
            Home
          </Button>
          <Button as={RouterLink} to="/assets" variant="ghost" color="white" leftIcon={<FaList />}>
            Properties
          </Button>
          <Button as={RouterLink} to="/latammap" variant="ghost" color="white" leftIcon={<FaMap />}>
            Maps
          </Button>
        </Flex>
        <Flex gap={4}>
          <Button as={RouterLink} to="/wallet" variant="ghost" color="white">
            Wallet
          </Button>
          {user ? (
            <Button onClick={disconnect} variant="ghost" color="white">
              Logout
            </Button>
          ) : (
            <Button 
              onClick={handleOpenSession} 
              variant="solid" 
              colorScheme="orange"
              isLoading={isLoading}
            >
              Login
            </Button>
          )}
        </Flex>
      </Flex>
      <Box p={8}>{children}</Box>

      {/* Connection Modal */}
      <WalletConnectModal isOpen={isOpen} onClose={onClose} handleConnect={connect} isLoading={isLoading} />
    </Box>
  )
} 
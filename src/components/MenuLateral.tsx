import { Box, Flex, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button, ButtonGroup, useToast } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import keplrIcon from '../constants/keplr-icon.webp';
import metamaskIcon from '../constants/metamask-icon.png';
import coinbaseIcon from '../constants/coinbase-icon.webp';
import { WalletConnectModal } from './WalletConnectModal';

export const MenuLateral = () => {
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const { isOpen: isWalletModalOpen, onOpen: onWalletModalOpen, onClose: onWalletModalClose } = useDisclosure();
  const { user, connect, disconnect, isLoading } = useAuth();
  const toast = useToast();

  const handleOpenWalletModal = () => {
    if (!user) {
      onWalletModalOpen();
    }
  };

  return (
    <Box>
      <Flex p={4} align="center" justify="space-between">
        <IconButton
          aria-label="Abrir menu"
          icon={<HamburgerIcon />}
          onClick={onMenuOpen}
        />
        {user?.isConnected ? (
          <Button 
            colorScheme="red" 
            onClick={disconnect}
            isLoading={isLoading}
            loadingText="Desconectando..."
          >
            Desconectar
          </Button>
        ) : (
          <Button 
            colorScheme="blue" 
            onClick={handleOpenWalletModal}
            isLoading={isLoading}
            loadingText="Conectando..."
          >
            Iniciar Sessão
          </Button>
        )}
      </Flex>

      <Modal isOpen={isWalletModalOpen} onClose={onWalletModalClose} isCentered>
        <WalletConnectModal isOpen={isWalletModalOpen} onClose={onWalletModalClose} handleConnect={async (wallet) => { await connect(wallet); onWalletModalClose(); }} isLoading={isLoading} />
      </Modal>
    </Box>
  );
}; 
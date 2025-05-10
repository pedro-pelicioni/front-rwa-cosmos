import { Box, Flex, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button, ButtonGroup, useToast } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../hooks/useAuth.tsx';

export const MenuLateral = () => {
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const { isOpen: isWalletModalOpen, onOpen: onWalletModalOpen, onClose: onWalletModalClose } = useDisclosure();
  const { user, handleConnect, handleDisconnect, isLoading } = useAuth();
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
            onClick={handleDisconnect}
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

      <Modal isOpen={isWalletModalOpen} onClose={onWalletModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Escolha sua Carteira</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <ButtonGroup spacing={4} display="flex" flexDirection="column">
              <Button
                colorScheme="purple"
                size="lg"
                onClick={() => {
                  handleConnect('keplr');
                  onWalletModalClose();
                }}
                mb={4}
                isLoading={isLoading}
                loadingText="Conectando..."
              >
                Conectar Keplr
              </Button>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => {
                  handleConnect('noble');
                  onWalletModalClose();
                }}
                isLoading={isLoading}
                loadingText="Conectando..."
              >
                Conectar Noble
              </Button>
            </ButtonGroup>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 
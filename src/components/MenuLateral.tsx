import { Box, Flex, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button, ButtonGroup, useToast } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useKeplr } from '../hooks/useKeplr';
import { useNoble } from '../hooks/useNoble';
import { useAuth } from '../hooks/useAuth';

export const MenuLateral = () => {
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const { isOpen: isWalletModalOpen, onOpen: onWalletModalOpen, onClose: onWalletModalClose } = useDisclosure();
  const { user, setUser } = useAuth();
  const { connect: connectKeplr, disconnect: disconnectKeplr } = useKeplr();
  const { connect: connectNoble, disconnect: disconnectNoble } = useNoble();
  const toast = useToast();

  const handleConnect = async (walletType: 'keplr' | 'noble') => {
    try {
      if (user) {
        await handleDisconnect();
      }

      const success = walletType === 'keplr' 
        ? await connectKeplr()
        : await connectNoble();
      
      if (success) {
        toast({
          title: 'Conectado',
          description: `Carteira ${walletType === 'keplr' ? 'Keplr' : 'Noble'} conectada com sucesso!`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onWalletModalClose();
      }
    } catch (error) {
      console.error(`Erro ao conectar com ${walletType}:`, error);
      toast({
        title: 'Erro',
        description: `Falha ao conectar com a carteira ${walletType}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const success = user?.walletType === 'keplr'
        ? await disconnectKeplr()
        : await disconnectNoble();
      
      if (success) {
        toast({
          title: 'Desconectado',
          description: 'Carteira desconectada com sucesso!',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao desconectar da carteira',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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
          <Button colorScheme="red" onClick={handleDisconnect}>
            Desconectar
          </Button>
        ) : (
          <Button colorScheme="blue" onClick={handleOpenWalletModal}>
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
                onClick={() => handleConnect('keplr')}
                mb={4}
              >
                Conectar Keplr
              </Button>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => handleConnect('noble')}
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
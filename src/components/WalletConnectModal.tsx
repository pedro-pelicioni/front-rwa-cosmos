import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ButtonGroup, Button } from '@chakra-ui/react';
import keplrIcon from '../constants/keplr-icon.webp';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleConnect: (wallet: 'keplr') => Promise<void>;
  isLoading: boolean;
}

export function WalletConnectModal({ isOpen, onClose, handleConnect, isLoading }: WalletConnectModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="primary.500" borderColor="bgGrid" borderWidth="1px">
        <ModalHeader color="text.light">Choose your Wallet</ModalHeader>
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
              <img src={keplrIcon} alt="Keplr" style={{ marginRight: '8px', height: '24px' }} />
              Connect Keplr (ATOM)
            </Button>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 
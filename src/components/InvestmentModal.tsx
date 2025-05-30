import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Flex,
  Divider,
  useToast
} from '@chakra-ui/react';
import { TokenListing } from '../services/marketplaceService';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: TokenListing;
  onSuccess?: () => void;
}

export const InvestmentModal = ({ isOpen, onClose, listing, onSuccess }: InvestmentModalProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleInvest = async () => {
    try {
      setLoading(true);
      
      // Navegar para a página de pagamento
      navigate(`/payment/${listing.nftToken.rwa_id}/${listing.nft_token_id}/${quantity}/${listing.current_price}`);
      
      onClose();
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to process investment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalAmount = listing.current_price * quantity;
  const property = listing.nftToken?.rwa;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="var(--color-bg-primary)">
        <ModalHeader>Invest in {property?.name || `Token #${listing.nft_token_id}`}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Number of Tokens</FormLabel>
            <NumberInput
              min={1}
              max={property?.available_tokens || 1}
              value={quantity}
              onChange={(value) => setQuantity(typeof value === 'string' ? parseInt(value, 10) : value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <Divider my={4} />

          <Flex justify="space-between" mb={2}>
            <Text>Price per Token</Text>
            <Text>{formatCurrency(listing.current_price)}</Text>
          </Flex>

          <Flex justify="space-between" fontWeight="bold">
            <Text>Total Investment</Text>
            <Text>{formatCurrency(totalAmount)}</Text>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleInvest}
            isLoading={loading}
            loadingText="Processing..."
          >
            Confirm Investment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 
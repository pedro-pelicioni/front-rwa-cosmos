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
import { RWA } from '../types/rwa';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: RWA;
  availableTokens: number;
  tokenId: number;
}

export const InvestmentModal = ({ isOpen, onClose, asset, availableTokens, tokenId }: InvestmentModalProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleInvest = async () => {
    try {
      setLoading(true);
      
      // Calcular preço por token
      const pricePerToken = asset.currentValue / asset.totalTokens;
      
      // Navegar para a página de pagamento
      navigate(`/payment/${asset.id}/${tokenId}/${quantity}/${pricePerToken}`);
      
      onClose();
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

  const totalAmount = (asset.currentValue / asset.totalTokens) * quantity;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invest in {asset.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Number of Tokens</FormLabel>
            <NumberInput
              min={1}
              max={availableTokens}
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
            <Text>{formatCurrency(asset.currentValue / asset.totalTokens)}</Text>
          </Flex>

          <Flex justify="space-between" fontWeight="bold">
            <Text>Total Investment</Text>
            <Text>{formatCurrency(totalAmount)}</Text>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleInvest}
            isLoading={loading}
            loadingText="Processing..."
          >
            Proceed to Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 
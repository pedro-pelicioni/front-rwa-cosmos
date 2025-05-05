import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Divider, 
  useToast,
  Badge,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  Textarea,
  Flex,
  Spacer,
  ButtonGroup
} from '@chakra-ui/react';
import { useKeplr } from '../hooks/useKeplr';
import { useNoble } from '../hooks/useNoble';
import { useAuth } from '../hooks/useAuth';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Decimal } from '@cosmjs/math';

// Endpoint RPC público que suporta CORS
const RPC_ENDPOINT = 'https://cosmos-rpc.polkachu.com';

// Função auxiliar para converter string para base64
const stringToBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

export const Wallet = () => {
  const { user } = useAuth();
  const { connect: connectKeplr, disconnect: disconnectKeplr, getBalance: getKeplrBalance } = useKeplr();
  const { connect: connectNoble, disconnect: disconnectNoble, getBalance: getNobleBalance } = useNoble();
  const [balance, setBalance] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [messageToSign, setMessageToSign] = useState('Olá, este é um teste de assinatura!');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;

      try {
        const balance = user.walletType === 'keplr' 
          ? await getKeplrBalance() 
          : await getNobleBalance();
        setBalance(balance);
      } catch (error) {
        console.error('Erro ao buscar saldo:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao buscar saldo da carteira',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchBalance();
  }, [user, getKeplrBalance, getNobleBalance, toast]);

  const handleConnect = async (walletType: 'keplr' | 'noble') => {
    try {
      if (walletType === 'keplr') {
        await connectKeplr();
      } else {
        await connectNoble();
      }
      
      toast({
        title: 'Conectado',
        description: `Carteira ${walletType === 'keplr' ? 'Keplr' : 'Noble'} conectada com sucesso!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
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
      if (user?.walletType === 'keplr') {
        await disconnectKeplr();
      } else {
        await disconnectNoble();
      }
      
      toast({
        title: 'Desconectado',
        description: 'Carteira desconectada com sucesso!',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
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

  const handleSignMessage = async () => {
    if (!user || !user.address) {
      toast({
        title: 'Erro',
        description: 'Você precisa conectar sua carteira primeiro',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSigning(true);
    setError(null);
    
    try {
      // Obtém o offline signer
      const offlineSigner = window.keplr.getOfflineSigner('cosmoshub-4');
      const accounts = await offlineSigner.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada');
      }
      
      // Assina a mensagem
      const signDoc = {
        chain_id: 'cosmoshub-4',
        account_number: '0',
        sequence: '0',
        fee: {
          amount: [{ denom: 'stake', amount: '0' }],
          gas: '0',
        },
        msgs: [
          {
            type: 'cosmos-sdk/MsgSignData',
            value: {
              signer: accounts[0].address,
              data: stringToBase64(messageToSign),
            },
          },
        ],
        memo: '',
      };
      
      const { signature: sig } = await window.keplr.signAmino(
        'cosmoshub-4',
        accounts[0].address,
        signDoc
      );
      
      setSignature(JSON.stringify(sig, null, 2));
      
      toast({
        title: 'Assinatura bem-sucedida',
        description: 'A mensagem foi assinada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Erro ao assinar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao assinar a mensagem';
      setError(errorMessage);
      
      toast({
        title: 'Erro ao assinar',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Box p={6}>
      <Flex mb={6} align="center">
        <Heading size="lg">Conectar Carteira</Heading>
        <Spacer />
        {user && (
          <Button colorScheme="red" onClick={handleDisconnect}>
            Desconectar
          </Button>
        )}
      </Flex>
      
      {!user ? (
        <Card variant="outline">
          <CardHeader>
            <Heading size="md">Escolha sua Carteira</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Conecte-se usando uma das carteiras disponíveis:
              </Text>
              <ButtonGroup spacing={4}>
                <Button
                  colorScheme="purple"
                  size="lg"
                  onClick={() => handleConnect('keplr')}
                  width="200px"
                >
                  Conectar Keplr
                </Button>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => handleConnect('noble')}
                  width="200px"
                >
                  Conectar Noble
                </Button>
              </ButtonGroup>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Card variant="outline">
          <CardHeader>
            <Heading size="md">Carteira Conectada</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack>
                <Text fontWeight="bold">Status:</Text>
                <Badge colorScheme="green">Conectado</Badge>
              </HStack>
              <HStack>
                <Text fontWeight="bold">Tipo:</Text>
                <Badge colorScheme={user.walletType === 'keplr' ? 'purple' : 'blue'}>
                  {user.walletType === 'keplr' ? 'Keplr' : 'Noble'}
                </Badge>
              </HStack>
              <HStack>
                <Text fontWeight="bold">Endereço:</Text>
                <Code p={2} borderRadius="md" fontSize="sm" maxW="500px" isTruncated>
                  {user.address}
                </Code>
              </HStack>
              {balance && (
                <HStack>
                  <Text fontWeight="bold">Saldo:</Text>
                  <Text>{balance}</Text>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
}; 
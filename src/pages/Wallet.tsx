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
  ButtonGroup,
  Spinner
} from '@chakra-ui/react';
import { useKeplr } from '../hooks/useKeplr';
import { useNoble } from '../hooks/useNoble';
import { useAuth } from '../hooks/useAuth.tsx';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Decimal } from '@cosmjs/math';
import { useRWATokens } from '../hooks/useRWATokens';
import { RWANFTToken } from '../types/rwa';

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
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [loginStep, setLoginStep] = useState<string>('Aguardando ação do usuário');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [messageToSign, setMessageToSign] = useState('Olá, este é um teste de assinatura!');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [myTokens, setMyTokens] = useState<RWANFTToken[]>([]);
  const { getByOwner, loading: loadingTokens } = useRWATokens();

  // Função para logar etapas
  const logStep = (msg: string) => {
    setStatusLog((prev) => {
      const updated = [...prev, msg];
      localStorage.setItem('wallet_last_log', JSON.stringify(updated));
      return updated;
    });
    setLoginStep(msg);
  };

  // Salva erro no localStorage
  const saveError = (err: string) => {
    setLoginError(err);
    localStorage.setItem('wallet_last_error', err);
  };

  // Ao montar, recupera último erro e log
  useEffect(() => {
    const lastError = localStorage.getItem('wallet_last_error');
    if (lastError) setLoginError(lastError);
    const lastLog = localStorage.getItem('wallet_last_log');
    if (lastLog) setStatusLog(JSON.parse(lastLog));
  }, []);

  // Exemplo de função de login visual
  const handleLoginVisual = async (walletType: 'keplr' | 'noble') => {
    setStatusLog([]);
    setLoginError(null);
    try {
      logStep('Iniciando conexão com a carteira: ' + walletType);
      let authResponse = null;
      if (walletType === 'keplr') {
        logStep('Solicitando permissão à extensão Keplr...');
        authResponse = await connectKeplr();
      } else {
        logStep('Solicitando permissão à extensão Noble...');
        authResponse = await connectNoble();
      }
      if (!authResponse) {
        const errorMsg = 'Falha ao conectar ou autenticar com a carteira. Verifique o console para mais detalhes.';
        logStep(errorMsg);
        saveError(errorMsg);
        return;
      }
      logStep('Autenticação concluída com sucesso!');
      toast({
        title: 'Autenticado',
        description: 'Carteira conectada e autenticada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro desconhecido durante a autenticação';
      logStep('Erro: ' + errorMsg);
      saveError(errorMsg);
      console.error('Erro detalhado:', err);
      toast({
        title: 'Erro',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const balance = user.walletType === 'keplr' 
          ? await getKeplrBalance() 
          : await getNobleBalance(user.address);
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
      if (!window.keplr) throw new Error('Keplr não está instalado');
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

  // Toast para sessão expirada
  useEffect(() => {
    function handleSessionExpired() {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Faça login novamente para continuar.',
        status: 'warning',
        duration: 7000,
        isClosable: true,
      });
      setTimeout(() => {
        (window as any).showedSessionExpiredToast = false;
      }, 8000);
    }
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [toast]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!user) return;
      try {
        const tokens = await getByOwner(Number(user.id));
        setMyTokens(tokens);
      } catch (err) {
        setMyTokens([]);
      }
    };
    fetchTokens();
  }, [user, getByOwner]);

  return (
    <Box p={6}>
      <Flex mb={6} align="center">
        <Heading size="lg">Minha Carteira</Heading>
        <Spacer />
        {user && (
          <Button colorScheme="red" onClick={handleDisconnect}>
            Desconectar
          </Button>
        )}
      </Flex>
      {/* Painel de status do login */}
      <Card variant="outline" mb={6}>
        <CardHeader>
          <Heading size="sm">Status do Login</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={2}>
            <Text><b>Etapa atual:</b> {loginStep}</Text>
            {loginError && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Erro:</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <Box w="100%">
              <Text fontWeight="bold" mb={1}>Log de etapas:</Text>
              <Box as="pre" bg="gray.50" p={2} borderRadius="md" maxH="200px" overflowY="auto">
                {statusLog.map((msg, idx) => <div key={idx}>{msg}</div>)}
              </Box>
            </Box>
            <ButtonGroup mt={2}>
              <Button colorScheme="purple" onClick={() => handleLoginVisual('keplr')}>Login com Keplr</Button>
              <Button colorScheme="blue" onClick={() => handleLoginVisual('noble')}>Login com Noble</Button>
            </ButtonGroup>
          </VStack>
        </CardBody>
      </Card>
      
      {!user ? (
        <Card variant="outline">
          <CardHeader>
            <Heading size="md">Carteira</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Conecte-se usando o botão "Iniciar Sessão" no menu lateral.
              </Text>
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
      {user && (
        <Card variant="outline" mt={6}>
          <CardHeader>
            <Heading size="md">My Tokens</Heading>
          </CardHeader>
          <CardBody>
            {loadingTokens ? (
              <Spinner />
            ) : myTokens.length === 0 ? (
              <Text>You don't have any tokens.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {myTokens.map((token: any) => (
                  <Box key={token.id} p={3} borderWidth={1} borderRadius="md">
                    <Text><b>Token:</b> {token.token_identifier}</Text>
                    <Text><b>ID:</b> {token.id}</Text>
                    <Text><b>RWA:</b> {token.rwa_id}</Text>
                    <Text><b>Metadata URI:</b> {token.metadata_uri || '-'}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      )}
    </Box>
  );
}; 
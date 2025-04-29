import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, useToast } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

interface Transaction {
  id: string
  asset_id: string
  type: string
  amount: number
  from: string
  to: string
  timestamp: string
  status: string
}

export const Transactions = () => {
  const toast = useToast()

  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/transactions')
      return response.data
    },
  })

  if (isLoading) {
    return <Box>Loading...</Box>
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load transactions',
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
    return <Box>Error loading transactions</Box>
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Transactions</Heading>
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Type</Th>
            <Th>Amount</Th>
            <Th>From</Th>
            <Th>To</Th>
            <Th>Timestamp</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {transactions?.map((transaction) => (
            <Tr key={transaction.id}>
              <Td>{transaction.id}</Td>
              <Td>{transaction.type}</Td>
              <Td>${transaction.amount.toLocaleString()}</Td>
              <Td>{transaction.from}</Td>
              <Td>{transaction.to}</Td>
              <Td>{new Date(transaction.timestamp).toLocaleString()}</Td>
              <Td>{transaction.status}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
} 
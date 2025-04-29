import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, useToast } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { apiClient } from '../api/client'

interface Asset {
  id: string
  name: string
  description: string
  value: number
  status: string
}

export const Assets = () => {
  const toast = useToast()

  const { data: assets, isLoading, error } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await apiClient.get('/assets')
      return response.data
    },
  })

  if (isLoading) {
    return <Box>Loading...</Box>
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load assets',
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
    return <Box>Error loading assets</Box>
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Assets</Heading>
      <Button as={RouterLink} to="/assets/new" colorScheme="blue" mb={4}>
        Create New Asset
      </Button>
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Value</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {assets?.map((asset) => (
            <Tr key={asset.id}>
              <Td>{asset.name}</Td>
              <Td>{asset.description}</Td>
              <Td>${asset.value.toLocaleString()}</Td>
              <Td>{asset.status}</Td>
              <Td>
                <Button
                  as={RouterLink}
                  to={`/assets/${asset.id}`}
                  size="sm"
                  colorScheme="blue"
                >
                  View Details
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
} 
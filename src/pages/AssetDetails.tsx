import { Box, Button, Heading, Text, VStack, useToast } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { apiClient } from '../api/client'

interface Asset {
  id: string
  name: string
  description: string
  value: number
  status: string
  owner: string
  created_at: string
  updated_at: string
}

export const AssetDetails = () => {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const { data: asset, isLoading, error } = useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: async () => {
      const response = await apiClient.get(`/assets/${id}`)
      return response.data
    },
  })

  if (isLoading) {
    return <Box>Loading...</Box>
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load asset details',
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
    return <Box>Error loading asset details</Box>
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>{asset?.name}</Heading>
      
      <VStack align="stretch" spacing={4}>
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="bold">Description</Text>
          <Text>{asset?.description}</Text>
        </Box>
        
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="bold">Value</Text>
          <Text>${asset?.value.toLocaleString()}</Text>
        </Box>
        
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="bold">Status</Text>
          <Text>{asset?.status}</Text>
        </Box>
        
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="bold">Owner</Text>
          <Text>{asset?.owner}</Text>
        </Box>
        
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="bold">Created At</Text>
          <Text>{new Date(asset?.created_at || '').toLocaleString()}</Text>
        </Box>
        
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Text fontWeight="bold">Last Updated</Text>
          <Text>{new Date(asset?.updated_at || '').toLocaleString()}</Text>
        </Box>
      </VStack>
      
      <Button mt={4} colorScheme="blue">
        Edit Asset
      </Button>
    </Box>
  )
} 
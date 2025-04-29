import { Box, Heading, Text, VStack } from '@chakra-ui/react'

export const Home = () => {
  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="xl" mb={4}>Welcome to RWA Cosmos</Heading>
        <Text fontSize="lg">
          This is a frontend application for managing Real World Assets on the Cosmos blockchain.
          Navigate through the sidebar to explore assets and transactions.
        </Text>
      </Box>
      
      <Box>
        <Heading size="md" mb={4}>Features</Heading>
        <VStack align="stretch" spacing={4}>
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <Heading size="sm" mb={2}>Asset Management</Heading>
            <Text>View and manage your real-world assets on the blockchain.</Text>
          </Box>
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <Heading size="sm" mb={2}>Transaction History</Heading>
            <Text>Track all transactions related to your assets.</Text>
          </Box>
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <Heading size="sm" mb={2}>Asset Details</Heading>
            <Text>View detailed information about each asset.</Text>
          </Box>
        </VStack>
      </Box>
    </VStack>
  )
} 
import { Box, Flex, Link, VStack, Heading } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Flex minH="100vh">
      <Box
        w="250px"
        bg="gray.100"
        p={4}
        borderRight="1px"
        borderColor="gray.200"
      >
        <VStack align="stretch" spacing={4}>
          <Heading size="md" mb={4}>RWA Cosmos</Heading>
          <Link as={RouterLink} to="/" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Home
          </Link>
          <Link as={RouterLink} to="/assets" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Assets
          </Link>
          <Link as={RouterLink} to="/transactions" p={2} borderRadius="md" _hover={{ bg: 'gray.200' }}>
            Transactions
          </Link>
        </VStack>
      </Box>
      <Box flex={1} p={8}>
        {children}
      </Box>
    </Flex>
  )
} 
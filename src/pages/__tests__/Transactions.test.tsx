import { render, screen } from '@testing-library/react'
import { Transactions } from '../Transactions'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('Transactions Component', () => {
  it('renders the transactions title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Transactions />
        </ChakraProvider>
      </QueryClientProvider>
    )
    
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Transactions />
        </ChakraProvider>
      </QueryClientProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the table headers', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Transactions />
        </ChakraProvider>
      </QueryClientProvider>
    )
    
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByText('Timestamp')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })
}) 
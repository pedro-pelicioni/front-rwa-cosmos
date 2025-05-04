import { render, screen, waitFor } from '@testing-library/react'
import { Assets } from '../Assets'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('Assets Component', () => {
  it('renders the assets title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Assets />
        </ChakraProvider>
      </QueryClientProvider>
    )
    
    expect(screen.getByText('Assets')).toBeInTheDocument()
  })

  it('renders the create new asset button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Assets />
        </ChakraProvider>
      </QueryClientProvider>
    )
    
    expect(screen.getByText('Create New Asset')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Assets />
        </ChakraProvider>
      </QueryClientProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
}) 
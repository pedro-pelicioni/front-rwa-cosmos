import { render, screen } from '@testing-library/react'
import { Home } from '../Home'
import { ChakraProvider } from '@chakra-ui/react'

describe('Home Component', () => {
  it('renders the welcome message', () => {
    render(
      <ChakraProvider>
        <Home />
      </ChakraProvider>
    )
    
    expect(screen.getByText('Welcome to RWA Cosmos')).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(
      <ChakraProvider>
        <Home />
      </ChakraProvider>
    )
    
    expect(screen.getByText('Asset Management')).toBeInTheDocument()
    expect(screen.getByText('Transaction History')).toBeInTheDocument()
    expect(screen.getByText('Asset Details')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(
      <ChakraProvider>
        <Home />
      </ChakraProvider>
    )
    
    expect(screen.getByText('View and manage your real-world assets on the blockchain.')).toBeInTheDocument()
    expect(screen.getByText('Track all transactions related to your assets.')).toBeInTheDocument()
    expect(screen.getByText('View detailed information about each asset.')).toBeInTheDocument()
  })
}) 
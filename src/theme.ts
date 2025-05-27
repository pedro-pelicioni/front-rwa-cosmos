import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  colors: {
    primary: {
      500: '#002D5B',
      600: '#001F3F',
      700: '#001429',
    },
    accent: {
      500: '#F47B20',
      600: '#E06A15',
      700: '#CC5500',
    },
    text: {
      light: '#FFFFFF',
      dim: 'rgba(255, 255, 255, 0.8)',
    },
    bgGrid: 'rgba(255, 255, 255, 0.1)',
  },
  styles: {
    global: {
      body: {
        bg: 'primary.500',
        color: 'text.light',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md',
      },
      variants: {
        primary: {
          bg: 'accent.500',
          color: 'white',
          _hover: { bg: 'accent.600' },
        },
        outline: {
          borderColor: 'text.light',
          color: 'text.light',
          _hover: { bg: 'whiteAlpha.200' },
        },
      },
    },
  },
}); 
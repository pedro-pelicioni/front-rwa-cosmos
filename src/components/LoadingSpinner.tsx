import React from 'react';
import { Spinner, Center } from '@chakra-ui/react';

export const LoadingSpinner: React.FC = () => {
  return (
    <Center h="100vh">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="xl"
      />
    </Center>
  );
}; 
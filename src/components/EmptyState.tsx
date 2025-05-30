import React from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      p={8}
      bg={bgColor}
      borderRadius="lg"
      textAlign="center"
      width="100%"
    >
      <VStack spacing={4}>
        {icon && (
          <Box fontSize="4xl" color="gray.400">
            {icon}
          </Box>
        )}
        
        <Text fontSize="xl" fontWeight="bold">
          {title}
        </Text>
        
        <Text color={textColor} maxW="md">
          {description}
        </Text>

        {actionLabel && onAction && (
          <Button
            colorScheme="blue"
            onClick={onAction}
            mt={4}
          >
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Box>
  );
} 
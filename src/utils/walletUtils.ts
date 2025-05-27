/**
 * Valida se um endereço de carteira é válido
 * @param address Endereço da carteira a ser validado
 * @returns true se o endereço for válido, false caso contrário
 */
export const isValidWalletAddress = (address: string): boolean => {
  // Remove espaços em branco
  const cleanAddress = address.trim();
  
  // Verifica se o endereço começa com 0x
  if (!cleanAddress.startsWith('0x')) {
    return false;
  }

  // Verifica se o endereço tem o tamanho correto (0x + 40 caracteres hexadecimais)
  if (cleanAddress.length !== 42) {
    return false;
  }

  // Verifica se todos os caracteres após 0x são hexadecimais válidos
  const hexRegex = /^0x[0-9a-fA-F]{40}$/;
  return hexRegex.test(cleanAddress);
};

/**
 * Formata um endereço de carteira para exibição
 * @param address Endereço da carteira
 * @returns Endereço formatado (0x1234...5678)
 */
export const formatWalletAddress = (address: string): string => {
  if (!isValidWalletAddress(address)) {
    return 'Endereço inválido';
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Verifica se dois endereços de carteira são iguais
 * @param address1 Primeiro endereço
 * @param address2 Segundo endereço
 * @returns true se os endereços forem iguais, false caso contrário
 */
export const areAddressesEqual = (address1: string, address2: string): boolean => {
  return address1.toLowerCase() === address2.toLowerCase();
}; 
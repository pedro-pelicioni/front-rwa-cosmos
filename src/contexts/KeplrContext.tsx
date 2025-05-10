import { createContext, useContext, ReactNode } from 'react';
import { useKeplr } from '../hooks/useKeplr';

interface KeplrContextType {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  walletAddress: string | null;
  walletName: string | null;
  error: string | null;
  isConnected: boolean;
}

const KeplrContext = createContext<KeplrContextType | undefined>(undefined);

export const KeplrProvider = ({ children }: { children: ReactNode }) => {
  const keplr = useKeplr();

  return (
    <KeplrContext.Provider value={keplr}>
      {children}
    </KeplrContext.Provider>
  );
};

export const useKeplrContext = () => {
  const context = useContext(KeplrContext);
  if (context === undefined) {
    throw new Error('useKeplrContext deve ser usado dentro de um KeplrProvider');
  }
  return context;
}; 
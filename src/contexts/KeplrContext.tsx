import { createContext, useContext, ReactNode } from 'react';
import { useKeplr } from '../hooks/useKeplr';

interface KeplrContextType {
  keplr: any;
  isConnecting: boolean;
  error: string | null;
  connectKeplr: () => Promise<string>;
  disconnect: () => Promise<boolean>;
  getBalance: () => Promise<string>;
  walletAddress: string | null;
  walletName: string | null;
  getAddress: (() => Promise<string>) | undefined;
  signMessage: ((message: string) => Promise<any>) | undefined;
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
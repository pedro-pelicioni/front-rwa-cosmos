import React, { createContext, useContext, useState } from 'react';

interface User {
  address: string;
  walletType: 'keplr' | 'noble';
  isConnected: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {}
});

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const handleSetUser = (newUser: User | null) => {
    console.log('Setting user:', newUser);
    setUser(newUser);
  };

  return React.createElement(
    AuthContext.Provider, 
    { value: { user, setUser: handleSetUser } }, 
    props.children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
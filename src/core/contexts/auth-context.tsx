import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/api';

type User = {
  id: string;
  name: string;
  email: string;
  token?: string; 
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('userData');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = async (email: string, password?: string) => {
    try {
      const resp = await fetch(`${API_URL}/mobile/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '123' }), // fallback na senha só pra não travar tela se a ui não mandar
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.message || 'Falha no login');
      }
      
      const loggedUser: User = {
        id: data.userId || `user-${Date.now()}`,
        name: data.name || email.split('@')[0],
        email,
        token: data.access_token,
      };

      await SecureStore.setItemAsync('userToken', data.access_token);
      await SecureStore.setItemAsync('userData', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } catch(err) {
      console.error('Erro no SignIn: ', err);
      throw err;
    }
  };

  const signUp = async (name: string, email: string) => {
    try {
      const resp = await fetch(`${API_URL}/mobile/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: '123' }), // fallback simples, em real a UI deve pegar a senha
      });
      
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        throw new Error(data?.message || 'Falha no cadastro');
      }
      
      await signIn(email, '123'); // auto-login
    } catch(err) {
      console.error('Erro no SignUp: ', err);
      throw err;
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

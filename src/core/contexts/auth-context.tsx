import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/api';
import { decode } from 'base-64';

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
  signUp: (name: string, email: string, password?: string) => Promise<void>;
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
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          try {
            const payloadBase64 = token.split('.')[1];
            if (payloadBase64) {
              const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
              const decodedPayload = JSON.parse(decode(base64));

              if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
                console.log('Token expirado. Deslogando localmente...');
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('userData');
                setUser(null);
                return;
              }
            }
          } catch (jwtError) {
            console.error('Erro ao ler JWT', jwtError);
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userData');
            setUser(null);
            return;
          }
        }

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
        body: JSON.stringify({ email, password: password || '123' }),
      });
      
      let data: any;
      if (!resp.ok) {
        try {
          data = await resp.json();
        } catch {
          const text = await resp.text();
          throw new Error(text || 'Credenciais inválidas');
        }
        throw new Error(data?.message || 'Credenciais inválidas');
      }
      
      data = await resp.json();
      
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

  const signUp = async (name: string, email: string, password?: string) => {
    try {
      const resp = await fetch(`${API_URL}/mobile/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: password || '123' }),
      });
      
      let data: any;
      if (!resp.ok) {
        try {
          data = await resp.json();
        } catch {
          const text = await resp.text();
          throw new Error(text || 'Falha no cadastro');
        }
        throw new Error(data?.message || 'Falha no cadastro');
      }
      
      data = await resp.json();
      
      await signIn(email, password || '123');
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

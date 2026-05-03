import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { decode } from 'base-64';
import { API_URL } from '../utils/api-config';
import { parseProfilePicture } from '../utils/profile-picture';
import { refreshAccessToken } from '../utils/refresh-token';
import {
  AUTH_SESSION_CLEARED_EVENT,
  clearSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  persistSession,
  updateStoredUser,
} from '../utils/session';

type User = {
  id: string;
  name: string;
  email: string;
  token?: string; 
  profilePicture?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (name: string, email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'profilePicture'>>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

async function readResponseBody(resp: Response) {
  const text = await resp.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getStoredAccessToken();
        const refreshToken = await getStoredRefreshToken();
        const storedUser = await getStoredUser();

        if (storedUser && !token && !refreshToken) {
          await clearSession();
          setUser(null);
          return;
        }

        if (!token && refreshToken) {
          const refreshedToken = await refreshAccessToken(refreshToken);
          if (!refreshedToken) {
            setUser(null);
            return;
          }
        }

        if (token) {
          try {
            const payloadBase64 = token.split('.')[1];
            if (payloadBase64) {
              const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
              const decodedPayload = JSON.parse(decode(base64));

              if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
                const refreshedToken = await refreshAccessToken();
                if (!refreshedToken) {
                  setUser(null);
                  return;
                }
              }
            }
          } catch (jwtError) {
            console.error('Erro ao ler JWT', jwtError);
            await clearSession();
            setUser(null);
            return;
          }
        }

        const syncedUser = await getStoredUser();
        if (syncedUser) {
          setUser(syncedUser);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const subscription = DeviceEventEmitter.addListener(
      AUTH_SESSION_CLEARED_EVENT,
      () => {
        setUser(null);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const signIn = async (email: string, password?: string) => {
    try {
      console.log('[Auth][Login] starting login for:', email);
      const resp = await fetch(`${API_URL}/mobile/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '123' }),
      });
      
      let data: any;
      if (!resp.ok) {
        data = await readResponseBody(resp);
        throw new Error(
          typeof data === 'string' ? data || 'Credenciais inválidas' : data?.message || 'Credenciais inválidas',
        );
      }
      
      data = await readResponseBody(resp);
      console.log('[Auth][Login] response payload:', {
        userId: data.userId,
        hasAccessToken: Boolean(data.access_token),
        accessToken: data.access_token ? `${data.access_token.slice(0, 12)}... len=${data.access_token.length}` : 'none',
        hasRefreshToken: Boolean(data.refresh_token),
        refreshToken: data.refresh_token ? `${data.refresh_token.slice(0, 8)}... len=${data.refresh_token.length}` : 'none',
      });
      
      const loggedUser: User = {
        id: data.userId || `user-${Date.now()}`,
        name: data.name || email.split('@')[0],
        email,
        token: data.access_token,
        profilePicture: parseProfilePicture(data.profilePicture),
      };

      const nextUser = await persistSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: loggedUser,
      });
      setUser(nextUser);
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
        data = await readResponseBody(resp);
        throw new Error(
          typeof data === 'string' ? data || 'Falha no cadastro' : data?.message || 'Falha no cadastro',
        );
      }
      
      data = await readResponseBody(resp);
      
      await signIn(email, password || '123');
    } catch(err) {
      console.error('Erro no SignUp: ', err);
      throw err;
    }
  };

  const signOut = async () => {
    const refreshToken = await getStoredRefreshToken();

    if (refreshToken) {
      try {
        await fetch(`${API_URL}/mobile/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Erro ao invalidar refresh token no servidor', error);
      }
    }

    await clearSession();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'email' | 'profilePicture'>>) => {
    const nextUser = await updateStoredUser((currentUser) => {
      if (!currentUser) {
        return null;
      }

      return {
        ...currentUser,
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.email ? { email: updates.email } : {}),
        ...(updates.profilePicture !== undefined ? { profilePicture: updates.profilePicture } : {}),
      };
    });

    if (nextUser) {
      setUser(nextUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

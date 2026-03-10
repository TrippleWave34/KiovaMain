import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
  idToken: string;
};

type AuthContextType = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  getToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  getToken: async () => 'test-token',
});

const STORAGE_KEY = 'kiova_user';

function saveUser(u: AuthUser | null) {
  try {
    if (Platform.OS === 'web') {
      if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

function loadUser(): AuthUser | null {
  try {
    if (Platform.OS === 'web') {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadUser();
    if (saved) setUserState(saved);
    setReady(true);
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    saveUser(u);
  };

  const getToken = async (): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    return user.idToken;
  };

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


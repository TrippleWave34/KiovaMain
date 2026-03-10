import React, { createContext, useContext, useState, useEffect } from 'react';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kiova_user');
      if (saved) setUserState(JSON.parse(saved));
    } catch {}
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem('kiova_user', JSON.stringify(u));
    else localStorage.removeItem('kiova_user');
  };

  const getToken = async (): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    return user.idToken;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

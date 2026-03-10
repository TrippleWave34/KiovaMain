import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBO2fmkGoxJxL4r_z_Bvqw31hpNWC0hF0o",
  authDomain: "kiova-cddb5.firebaseapp.com",
  projectId: "kiova-cddb5",
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const firebaseAuth = getAuth();

type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
  firebaseUser: User;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  getToken: () => Promise<string>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getToken: async () => '',
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName,
          firebaseUser,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Always gets a fresh token — Firebase SDK refreshes automatically
  const getToken = async (): Promise<string> => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) throw new Error('Not logged in');
    return await currentUser.getIdToken();
  };

  const signOut = async () => {
    await firebaseAuth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, getToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { firebaseAuth };

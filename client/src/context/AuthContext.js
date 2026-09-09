import { createContext, useContext, useMemo, useState } from 'react';
import { getSession, saveSession, clearSession } from '../api/auth';

// App-wide auth state. Previously each page (Navbar, Dashboard, Register,
// Marketplace) read/wrote localStorage independently, so the Navbar never
// knew a user had just logged in or registered until a full page reload.
// Wrapping the app in <AuthProvider> gives every page the same `user`
// object and keeps them all in sync the moment login/logout happens.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession());

  const login = (userData) => {
    saveSession(userData);
    setUser(userData);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    login,
    logout
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;

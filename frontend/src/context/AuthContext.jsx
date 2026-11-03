import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  // Restaure la session au chargement ; déconnecte automatiquement si le token expire
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api.me().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const authenticate = useCallback(async (mode, email, password) => {
    const { token, user: u } = await (mode === 'register' ? api.register : api.login)(email, password);
    tokenStore.set(token);
    setUser(u);
  }, []);

  const value = useMemo(() => ({ user, loading, authenticate, logout }), [user, loading, authenticate, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

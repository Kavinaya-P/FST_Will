import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('ev_user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ev_token') || null);

  const saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem('ev_token', newToken);
    localStorage.setItem('ev_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ev_token');
    localStorage.removeItem('ev_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, saveSession, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


// ── Admin Auth Context ──────────────────────────────
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('ev_admin') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ev_admin_token') || null);

  const saveAdminSession = useCallback((newToken, newAdmin) => {
    localStorage.setItem('ev_admin_token', newToken);
    localStorage.setItem('ev_admin', JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem('ev_admin_token');
    localStorage.removeItem('ev_admin');
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, token, saveAdminSession, adminLogout, isAdminAuthenticated: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);

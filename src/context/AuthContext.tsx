import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../types';
import { clearApiSessionAndSignOut, clearStoredAuthTokens } from '../services/api';
import { fetchDjangoMe, hasDjangoJwt, tryRefreshDjangoJwt } from '../services/djangoAuth';
import {
  clearUserSession,
  persistUserSession,
  readUserSession,
  userFromDjangoProfile,
} from '../services/sessionStore';

interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: SessionUser | null;
  userData: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function toSessionUser(u: User): SessionUser {
  return { uid: u.uid, email: u.email, displayName: u.name };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((u: User) => {
    persistUserSession(u);
    setUserData(u);
    setUser(toSessionUser(u));
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setUserData(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!hasDjangoJwt()) {
      const cached = readUserSession();
      if (cached) {
        applyUser(cached);
      } else {
        clearSession();
      }
      return;
    }
    const me = await fetchDjangoMe();
    if (me) {
      applyUser(userFromDjangoProfile(me));
      return;
    }
    const refreshed = await tryRefreshDjangoJwt();
    if (refreshed) {
      const meRetry = await fetchDjangoMe();
      if (meRetry) {
        applyUser(userFromDjangoProfile(meRetry));
        return;
      }
    }
    const cached = readUserSession();
    if (cached) {
      setUserData(cached);
      setUser(toSessionUser(cached));
      return;
    }
    clearStoredAuthTokens();
    clearUserSession();
    clearSession();
  }, [applyUser, clearSession]);

  useEffect(() => {
    (async () => {
      await tryRefreshDjangoJwt();
      await refreshSession();
      setLoading(false);
    })();
  }, [refreshSession]);

  useEffect(() => {
    const onJwtExpired = () => {
      clearStoredAuthTokens();
      const cached = readUserSession();
      if (cached) {
        setUserData(cached);
        setUser(toSessionUser(cached));
      }
    };
    const onSessionExpired = () => {
      clearStoredAuthTokens();
      clearUserSession();
      clearSession();
      setLoading(false);
    };
    window.addEventListener('auth:jwt-expired', onJwtExpired);
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('auth:jwt-expired', onJwtExpired);
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, [clearSession]);

  const logout = useCallback(async () => {
    clearApiSessionAndSignOut();
    clearUserSession();
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      logout,
      refreshSession,
    }),
    [user, userData, loading, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

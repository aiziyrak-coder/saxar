import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, tryGetFirebaseDb, isFirebaseConfigured } from '../firebase';
import type { User, UserRole } from '../types';
import { clearDemoUserStorage, readDemoUserRaw } from '../constants/branding';
import { parseUserRole } from '../constants/roles';
import { clearApiSession, clearStoredAuthTokens } from '../services/api';
import { fetchDjangoMe, hasDjangoJwt } from '../services/djangoAuth';

function parseUserStatus(value: unknown): User['status'] {
  if (value === 'active' || value === 'inactive' || value === 'pending') {
    return value;
  }
  return 'pending';
}

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function readDemoUserFromStorage(): User | null {
  const demoRaw = readDemoUserRaw();
  if (!demoRaw) return null;
  try {
    const demo = JSON.parse(demoRaw) as {
      uid: string;
      email?: string;
      phone?: string;
      role: UserRole;
      name: string;
      status?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    return {
      id: demo.uid,
      uid: demo.uid,
      email: demo.email || '',
      phone: demo.phone || '',
      role: demo.role,
      name: demo.name || 'Demo User',
      status: parseUserStatus(demo.status),
      createdAt: demo.createdAt || new Date().toISOString(),
      updatedAt: demo.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function firestoreProfileToUser(firebaseUser: FirebaseUser, snapData: Record<string, unknown>, docId: string): User {
  const now = new Date().toISOString();
  return {
    id: docId,
    uid: (snapData.uid as string) || firebaseUser.uid,
    email: (snapData.email as string) || firebaseUser.email || '',
    phone: (snapData.phone as string) || firebaseUser.phoneNumber || '',
    role: parseUserRole(snapData.role),
    name:
      (snapData.name as string) ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Foydalanuvchi',
    status: parseUserStatus(snapData.status),
    createdAt: (snapData.createdAt as string) || now,
    updatedAt: (snapData.updatedAt as string) || now,
    lastLoginAt: snapData.lastLoginAt as string | undefined,
    avatar: snapData.avatar as string | undefined,
    region: snapData.region as string | undefined,
    vehicleNumber: snapData.vehicleNumber as string | undefined,
    stir: snapData.stir as string | undefined,
    companyName: snapData.companyName as string | undefined,
    djangoUserId:
      typeof snapData.djangoUserId === 'number'
        ? snapData.djangoUserId
        : snapData.djangoUserId
          ? Number(snapData.djangoUserId)
          : undefined,
    address: snapData.address as string | undefined,
    location: snapData.location as User['location'],
  };
}

function minimalUserFromAuth(firebaseUser: FirebaseUser): User {
  const now = new Date().toISOString();
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    phone: firebaseUser.phoneNumber || '',
    role: 'b2b',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Foydalanuvchi',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUserSession = useCallback(async (nextUserData: User) => {
    let merged = nextUserData;
    if (hasDjangoJwt()) {
      const me = await fetchDjangoMe();
      if (me) {
        merged = {
          ...nextUserData,
          djangoUserId: me.id,
          status: me.is_active
            ? nextUserData.status === 'inactive'
              ? 'inactive'
              : nextUserData.status
            : 'inactive',
        };
      }
    }
    setUserData(merged);
    setUser({
      uid: merged.uid,
      email: merged.email,
      displayName: merged.name,
    });
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setUserData(null);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const demoUser = readDemoUserFromStorage();
      if (demoUser) {
        void applyUserSession(demoUser);
      } else {
        clearSession();
      }
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        clearDemoUserStorage();
        try {
          const db = tryGetFirebaseDb();
          if (!db) {
            void applyUserSession(minimalUserFromAuth(firebaseUser));
          } else {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data() as Record<string, unknown>;
              void applyUserSession(firestoreProfileToUser(firebaseUser, data, userDoc.id));
            } else {
              void applyUserSession(minimalUserFromAuth(firebaseUser));
            }
          }
        } catch {
          void applyUserSession(minimalUserFromAuth(firebaseUser));
        }
        setLoading(false);
        return;
      }

      const demoUser = readDemoUserFromStorage();
      if (demoUser) {
        void applyUserSession(demoUser);
      } else {
        clearSession();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [applyUserSession, clearSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      clearStoredAuthTokens();
      if (isFirebaseConfigured()) {
        void firebaseSignOut(getFirebaseAuth()).catch(() => {});
      }
      clearDemoUserStorage();
      clearSession();
      setLoading(false);
    };
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, [clearSession]);

  const logout = useCallback(async () => {
    clearApiSession();
    if (isFirebaseConfigured()) {
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
    }
    clearDemoUserStorage();
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      logout,
    }),
    [user, userData, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

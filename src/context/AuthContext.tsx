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
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../firebase';
import type { User, UserRole } from '../types';
import { clearDemoUserStorage, readDemoUserRaw } from '../constants/branding';
import { clearApiSession, clearStoredAuthTokens } from '../services/api';

const USER_ROLES: readonly UserRole[] = [
  'admin',
  'accountant',
  'warehouse',
  'agent',
  'driver',
  'b2b',
  'production',
];

function parseUserRole(value: unknown): UserRole {
  if (typeof value === 'string' && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return 'b2b';
}

function parseUserStatus(value: unknown): User['status'] {
  if (value === 'active' || value === 'inactive' || value === 'pending') {
    return value;
  }
  return 'active';
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
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUserSession = useCallback((nextUserData: User) => {
    setUserData(nextUserData);
    setUser({
      uid: nextUserData.uid,
      email: nextUserData.email,
      displayName: nextUserData.name,
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
        applyUserSession(demoUser);
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
          const userDocRef = doc(getFirebaseDb(), 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as Record<string, unknown>;
            applyUserSession(firestoreProfileToUser(firebaseUser, data, userDoc.id));
          } else {
            applyUserSession(minimalUserFromAuth(firebaseUser));
          }
        } catch {
          applyUserSession(minimalUserFromAuth(firebaseUser));
        }
        setLoading(false);
        return;
      }

      const demoUser = readDemoUserFromStorage();
      if (demoUser) {
        applyUserSession(demoUser);
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

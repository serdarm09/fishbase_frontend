'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BoostInfo } from '@/types';

export type AuthUser = {
  id?: string;
  _id?: string;
  fid?: number;
  farcasterFid?: number;
  username: string;
  walletAddress: string;
  totalFish?: number;
  totalXp?: number;
  currentStreak?: number;
  longestStreak?: number;
  profileData?: {
    bio?: string;
    avatar?: string;
    pfpUrl?: string;
    displayName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  boost?: BoostInfo;
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  updateUser: (updater: (prev: AuthUser) => AuthUser) => void;
}

const STORAGE_TOKEN_KEY = 'fishbase_token';
const STORAGE_USER_KEY = 'fishbase_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeUser = (raw: any): AuthUser => {
  if (!raw) {
    return raw;
  }

  const normalizedId = raw._id ?? raw.id ?? raw.userId ?? '';
  const farcasterFid = raw.farcasterFid ?? raw.fid ?? raw.user?.farcasterFid ?? null;
  const profile = raw.profileData ?? {};
  const avatar = profile.avatar ?? profile.pfpUrl ?? profile.pfp_url ?? '';
  const pfpUrl = profile.pfpUrl ?? profile.pfp_url ?? avatar;

  return {
    ...raw,
    id: normalizedId,
    _id: normalizedId,
    farcasterFid: farcasterFid ?? undefined,
    fid: undefined,
    totalFish: raw.totalFish ?? 0,
    totalXp: raw.totalXp ?? 0,
    currentStreak: raw.currentStreak ?? 0,
    longestStreak: raw.longestStreak ?? 0,
    boost: raw.boost ?? undefined,
    profileData: {
      ...profile,
      bio: profile.bio ?? '',
      avatar,
      pfpUrl,
    },
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    try {
      const storedToken = window.localStorage.getItem(STORAGE_TOKEN_KEY);
      const rawUser = window.localStorage.getItem(STORAGE_USER_KEY);

      if (storedToken && rawUser) {
        const parsedUser = normalizeUser(JSON.parse(rawUser));
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.warn('Session load failed', error);
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
      window.localStorage.removeItem(STORAGE_USER_KEY);
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  const setSession = useCallback(
    (newToken: string, newUser: AuthUser) => {
      const normalized = normalizeUser(newUser);
      setToken(newToken);
      setUser(normalized);

      window.localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalized));
    },
    []
  );

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    window.localStorage.removeItem(STORAGE_USER_KEY);
    router.replace('/');
  }, [router]);

  const updateUser = useCallback(
    (updater: (prev: AuthUser) => AuthUser) => {
      setUser((prev) => {
        if (!prev) {
          return prev;
        }

        const nextUser = normalizeUser(updater(prev));
        window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
        return nextUser;
      });
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      setSession,
      clearSession,
      updateUser,
    }),
    [user, token, isBootstrapping, setSession, clearSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};


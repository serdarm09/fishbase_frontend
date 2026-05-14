'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}


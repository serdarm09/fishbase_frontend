'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainNavigation, BottomNavigation } from '@/components/layout/MainNavigation';
import { useAuth } from '@/context/AuthContext';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isBootstrapping } = useAuth();

  useEffect(() => {
    if (!isBootstrapping && !user) {
      router.replace('/');
    }
  }, [isBootstrapping, user, router]);

  if (isBootstrapping || (!isBootstrapping && !user)) {
    return <FullScreenLoader label="Preparing your captain deck" />;
  }

  return (
    <div className="app-layout relative pb-20">
      <div className="floating-fish" style={{ top: '8%', left: '6%' }} aria-hidden="true" />
      <div className="floating-fish" style={{ top: '65%', left: '88%', animationDelay: '1.5s' }} aria-hidden="true" />

      <div className="container app-content py-6 flex flex-col gap-6">
        <MainNavigation />
        <main>{children}</main>
      </div>

      <BottomNavigation />
    </div>
  );
}


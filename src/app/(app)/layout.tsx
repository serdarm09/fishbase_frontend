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
    <div
      className="app-layout app-ocean-stage"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #000e1a 0%, #001828 40%, #00101f 100%)',
        position: 'relative',
        paddingBottom: '5rem',
      }}
    >
      {/* Subtle ambient glows */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: '-15vh', left: '-10vw',
        width: '55vw', height: '55vw', maxWidth: 700, maxHeight: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(31,122,224,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden="true" style={{
        position: 'fixed', bottom: '-10vh', right: '-8vw',
        width: '45vw', height: '45vw', maxWidth: 600, maxHeight: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,153,139,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Content */}
      <div
        className="container app-content py-6 flex flex-col gap-6"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <MainNavigation />
        <main className="app-main-stage">{children}</main>
      </div>

      <BottomNavigation />
    </div>
  );
}

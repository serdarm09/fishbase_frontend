'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { WalletConnect } from '@/components/auth/WalletConnect';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/profile');
    }
  }, [user, router]);

  return (
    <main className="container py-16 flex flex-col gap-8">
      <section className="ocean-card landing-hero">
        <div className="landing-copy">
          <span className="badge">Base App ready</span>
          <h1 className="game-title">FishBase</h1>
          <p className="landing-lede">
            Connect a Base wallet, deploy your fleet, collect daily XP, and
            compete for the top captain rank.
          </p>
          <div className="landing-actions">
            <WalletConnect className="wallet-panel" />
            <Link href="/leaderboard" className="secondary-button">
              View leaderboards
            </Link>
          </div>
        </div>

        <div className="landing-compass" aria-hidden="true">
          <div className="compass-ring">
            <span>BASE</span>
            <strong>8453</strong>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 grid-md-3 gap-4">
        <article className="ocean-card landing-feature">
          <span className="feature-kicker">01</span>
          <h2>Daily XP</h2>
          <p>Claim streak rewards and keep your captain profile moving.</p>
        </article>
        <article className="ocean-card landing-feature">
          <span className="feature-kicker">02</span>
          <h2>Live Map</h2>
          <p>Place boats across Base waters and react to the active board.</p>
        </article>
        <article className="ocean-card landing-feature">
          <span className="feature-kicker">03</span>
          <h2>NFT Fleet</h2>
          <p>Mint stronger boats and boost your earning power over time.</p>
        </article>
      </section>

      <section className="ocean-card base-publish-note">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Base App publishing profile</h2>
          <p className="text-sm text-gray-600 mt-2">
            The app exposes the Base project id in the root metadata and uses
            wallet authentication as the primary Base App entry path.
          </p>
        </div>
        <code>base:app_id 6a01ca209ee68cd142d1b1ac</code>
      </section>
    </main>
  );
}

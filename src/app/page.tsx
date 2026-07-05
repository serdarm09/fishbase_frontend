'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BrowserProvider } from 'ethers';
import { authApi } from '@/services/api';

/* ── Page cards shown in the scroll section ─────────────────────── */
const PAGES = [
  {
    href: '/map',
    emoji: '🗺️',
    bg: 'rgba(31, 122, 224, 0.18)',
    title: 'Live Sea Map',
    desc: 'Place your boat on the 100×100 live grid and earn daily XP with every move.',
    tag: 'Explore',
  },
  {
    href: '/daily-claim',
    emoji: '🎁',
    bg: 'rgba(251, 191, 36, 0.18)',
    title: 'Daily Reward Deck',
    desc: 'Claim streak XP every 24 h. Hit day 7 and unlock the 2× Golden Tide multiplier.',
    tag: 'Earn',
  },
  {
    href: '/nft-mint',
    emoji: '⛵',
    bg: 'rgba(139, 92, 246, 0.18)',
    title: 'NFT Fleet Hangar',
    desc: 'Mint Dinghies to Mega Ships — stronger vessels earn up to 200 XP per day.',
    tag: 'Collect',
  },
  {
    href: '/leaderboard',
    emoji: '🏆',
    bg: 'rgba(20, 184, 166, 0.18)',
    title: 'Captain Leaderboards',
    desc: 'XP rankings, streak champions, and fishing mini-game timing scores — all live.',
    tag: 'Compete',
  },
  {
    href: '/profile',
    emoji: '👤',
    bg: 'rgba(249, 115, 22, 0.18)',
    title: 'Captain Profile',
    desc: 'View your fleet, total XP, streak history and active boost multipliers.',
    tag: 'Profile',
  },
];

/* ── Wallet login ────────────────────────────────────────────────── */
type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};
const getEth = () =>
  (window as typeof window & { ethereum?: EthereumProvider }).ethereum;

function useHeroLogin() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [busy, setBusy]     = useState(false);

  const login = async () => {
    const ethereum = getEth();
    if (!ethereum) {
      setError('No wallet found. Open FishBase in Base App or a wallet browser.');
      return;
    }
    try {
      setBusy(true); setError(null);
      setStatus('Connecting wallet…');
      const provider = new BrowserProvider(ethereum);
      await provider.send('eth_requestAccounts', []);
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
      } catch { /* already on Base */ }
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      setStatus('Preparing secure sign-in…');
      const challenge = await authApi.walletChallenge({
        walletAddress,
        domain: window.location.host,
        uri: window.location.origin,
        chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453),
      });
      setStatus('Sign the login message in your wallet…');
      const signature = await signer.signMessage(challenge.message);
      setStatus('Verifying…');
      const response = await authApi.walletLogin({
        walletAddress,
        message: challenge.message,
        signature,
        nonce: challenge.nonce,
      });
      setSession(response.token, response.user);
      setStatus('Welcome aboard!');
      router.replace('/profile');
    } catch (err: any) {
      setError(err?.message ?? 'Wallet sign-in failed.');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  return { login, status, error, busy };
}

/* ── Scroll-triggered visibility hook ───────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router   = useRouter();
  const { user } = useAuth();
  const { login, status, error, busy } = useHeroLogin();

  /* Scroll-section visibility */
  const showcase    = useInView(0.08);
  const bottomBar   = useInView(0.2);

  /* Redirect authenticated users */
  useEffect(() => {
    if (user) router.replace('/profile');
  }, [user, router]);

  return (
    <div style={{ fontFamily: 'var(--font-nunito, Nunito, sans-serif)', background: '#000e1a' }}>

      {/* ══════════════════════════════════════════════════════════
          HERO — Exactly 100 vh, video fills screen
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',          /* exact viewport height */
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fullscreen video */}
        <video
          autoPlay loop muted playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
          poster="/icon.png"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
        </video>

        {/* Scrim */}
        <div className="hero-veil" aria-hidden="true" />

        {/* ── Glassmorphic Nav ─────────────────────────────────── */}
        <nav
          className="animate-fade-rise"
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.4rem 2rem',
            maxWidth: '88rem',
            margin: '0 auto',
            width: '100%',
          }}
          aria-label="Primary navigation"
        >
          {/* Logo */}
          <Link href="/" className="hero-nav-logo">
            FishBase
            <sup style={{ fontSize: '0.5em', opacity: 0.55, verticalAlign: 'super', lineHeight: 0 }}>®</sup>
          </Link>

          {/* Desktop links */}
          <div className="hero-nav-links">
            {[
              { href: '/',            label: 'Home',      active: true  },
              { href: '/map',         label: 'Sea Map',   active: false },
              { href: '/leaderboard', label: 'Rankings',  active: false },
              { href: '/nft-mint',    label: 'NFT Fleet', active: false },
              { href: '/daily-claim', label: 'Daily XP',  active: false },
            ].map(({ href, label, active }) => (
              <Link key={href} href={href} className={`hero-nav-link${active ? ' nav-active' : ''}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* CTA button */}
          <button
            type="button"
            className="liquid-glass"
            onClick={login}
            disabled={busy}
            style={{
              borderRadius: 999, padding: '0.58rem 1.35rem',
              fontSize: '0.875rem', color: '#fff',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              transition: 'transform 0.2s ease',
              display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            {busy ? '⏳ Connecting…' : '⚓ Begin Journey'}
          </button>
        </nav>

        {/* ── Hero content ─────────────────────────────────────── */}
        <div
          style={{
            position: 'relative', zIndex: 10, flex: 1,
            display: 'flex', alignItems: 'center',
            padding: '0 2rem 4rem',
            maxWidth: '88rem', margin: '0 auto', width: '100%',
            gap: '3rem', flexWrap: 'wrap',
          }}
        >
          {/* Left copy */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <span
              className="liquid-glass animate-fade-rise"
              style={{
                borderRadius: 999, padding: '0.4rem 1rem',
                fontSize: '0.78rem', color: 'rgba(200,225,245,0.85)',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                width: 'fit-content', letterSpacing: '0.06em', fontWeight: 600,
              }}
            >
              🔵 Base Mainnet · Chain ID 8453
            </span>

            <h1 className="hero-heading animate-fade-rise-delay">
              Where captains{' '}
              <span className="hero-heading-muted">rise through</span>{' '}
              the{' '}
              <span className="hero-heading-muted">silence of</span>{' '}
              the sea.
            </h1>

            <p
              className="animate-fade-rise-delay-2"
              style={{
                color: 'rgba(185,210,228,0.78)',
                fontSize: 'clamp(1rem, 2vw, 1.12rem)',
                lineHeight: 1.62, maxWidth: '46ch', margin: 0,
              }}
            >
              Connect your Base wallet, drop anchor on the live sea grid, mint
              your fleet, and climb the captain leaderboards — all fully onchain.
            </p>

            <div
              className="animate-fade-rise-delay-3"
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <button
                type="button" onClick={login} disabled={busy}
                className="liquid-glass"
                style={{
                  borderRadius: 999, padding: '0.9rem 2.4rem',
                  fontSize: '1rem', color: '#fff', fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.6 : 1, transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                {busy ? '⏳ Connecting…' : '⚓ Begin Journey'}
              </button>
              <Link
                href="/leaderboard"
                style={{
                  fontSize: '0.875rem', color: 'rgba(185,210,228,0.7)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(185,210,228,0.7)'; }}
              >
                View Leaderboards →
              </Link>
            </div>
          </div>

          {/* Right: Wallet panel */}
          <div className="hero-wallet-panel animate-fade-rise-delay-2">
            <p style={{
              fontFamily: 'var(--font-display,"Instrument Serif",serif)',
              fontSize: '1.25rem', color: '#fff', marginBottom: '0.4rem', fontWeight: 400,
            }}>
              Set sail now
            </p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(175,200,215,0.70)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Connect your Base wallet to claim your free Dinghy and start earning XP.
            </p>

            <button
              type="button" onClick={login} disabled={busy}
              className="btn-hero-connect"
            >
              {busy ? '⏳ Connecting…' : '🔗 Connect Base Wallet'}
            </button>

            {status && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(150,200,240,0.85)', marginTop: '0.65rem', lineHeight: 1.45 }}>
                {status}
              </p>
            )}
            {error && (
              <p style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.65rem', lineHeight: 1.45 }}>
                ⚠️ {error}
              </p>
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '1.25rem 0' }} />

            <p style={{ fontSize: '0.72rem', color: 'rgba(175,200,215,0.5)', marginBottom: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Explore FishBase
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { href: '/map',         label: '🗺️ Sea Map' },
                { href: '/daily-claim', label: '🎁 Daily XP' },
                { href: '/nft-mint',    label: '⛵ NFT Fleet' },
                { href: '/leaderboard', label: '🏆 Rankings' },
              ].map(({ href, label }) => (
                <Link
                  key={href} href={href}
                  style={{
                    fontSize: '0.76rem', color: 'rgba(195,220,240,0.78)',
                    textDecoration: 'none', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
                    padding: '0.35rem 0.75rem', transition: 'background 0.2s, color 0.2s', fontWeight: 600,
                  }}
                  onMouseEnter={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.background='rgba(255,255,255,0.13)'; a.style.color='#fff'; }}
                  onMouseLeave={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.background='rgba(255,255,255,0.06)'; a.style.color='rgba(195,220,240,0.78)'; }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="animate-fade-rise-delay-5"
          style={{
            position: 'absolute', bottom: '1.75rem', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'rgba(200,220,240,0.45)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>
            Scroll to explore
          </span>
          <div style={{ animation: 'scroll-bounce 1.8s ease-in-out infinite' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 8l5 5 5-5" stroke="rgba(200,220,240,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BELOW FOLD — Page Showcase  (scroll-triggered)
      ══════════════════════════════════════════════════════════ */}
      <div
        ref={showcase.ref}
        style={{
          background: 'linear-gradient(180deg, #000e1a 0%, #001220 50%, #000e1a 100%)',
          padding: '6rem 2rem 7rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial glow behind section */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vw', height: '70vw', maxWidth: 800, maxHeight: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,122,224,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '88rem', margin: '0 auto', position: 'relative' }}>

          {/* Divider */}
          <div className="hero-divider" style={{ marginBottom: '4.5rem' }} />

          {/* Section heading */}
          <div
            style={{
              marginBottom: '3rem',
              opacity: showcase.visible ? 1 : 0,
              transform: showcase.visible ? 'translateY(0)' : 'translateY(28px)',
              transition: 'opacity 0.75s ease, transform 0.75s ease',
            }}
          >
            <p style={{
              fontSize: '0.72rem', color: 'rgba(155,190,215,0.55)',
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.6rem',
            }}>
              Everything in one place
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display,"Instrument Serif",serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.9rem)',
              fontWeight: 400, color: '#fff', margin: 0,
              letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              Your full captain dashboard
            </h2>
          </div>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 210px), 1fr))',
            gap: '1rem',
          }}>
            {PAGES.map((page, i) => (
              <Link
                key={page.href}
                href={page.href}
                className="page-card"
                style={{
                  opacity: showcase.visible ? 1 : 0,
                  transform: showcase.visible ? 'translateY(0)' : 'translateY(36px)',
                  transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
                }}
              >
                <div className="page-card-icon" style={{ background: page.bg }}>
                  {page.emoji}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'rgba(155,200,235,0.55)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {page.tag}
                </span>
                <p className="page-card-title">{page.title}</p>
                <p className="page-card-desc">{page.desc}</p>
                <span className="page-card-arrow">Explore <span>→</span></span>
              </Link>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            ref={bottomBar.ref}
            style={{
              marginTop: '4rem',
              display: 'flex', flexWrap: 'wrap',
              gap: '1rem', alignItems: 'center', justifyContent: 'space-between',
              opacity: bottomBar.visible ? 1 : 0,
              transform: bottomBar.visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.65s ease 0.2s, transform 0.65s ease 0.2s',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {[
                { icon: '🔵', text: 'Built on Base' },
                { icon: '🔒', text: 'Non-custodial' },
                { icon: '⚡', text: 'Instant XP' },
                { icon: '🌊', text: '100×100 Live Map' },
              ].map(({ icon, text }) => (
                <span key={text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.78rem', color: 'rgba(175,200,218,0.6)', fontWeight: 600,
                }}>
                  {icon} {text}
                </span>
              ))}
            </div>
            <button
              type="button" onClick={login} disabled={busy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.85rem', color: '#fff',
                background: 'linear-gradient(135deg, rgba(74,170,247,0.22), rgba(31,122,224,0.18))',
                border: '1px solid rgba(74,170,247,0.3)', borderRadius: 999,
                padding: '0.6rem 1.4rem',
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 600, opacity: busy ? 0.6 : 1,
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              ⚓ {busy ? 'Connecting…' : 'Join as Captain'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

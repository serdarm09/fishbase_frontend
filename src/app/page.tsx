'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BrowserProvider } from 'ethers';
import { authApi } from '@/services/api';

/* ── 10 Gallery Images & Game Details (in order) ─────────────────── */
const GALLERY_ITEMS = [
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104530_521b2f85-c0f3-4d0e-9704-b578315b4cb9.png&w=1920&q=85',
    tag: 'EXPLORE',
    title: 'Live Sea Map',
    desc: 'Place your boat on the 100×100 live grid and earn daily XP with every move.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103711_76ccdb8b-5043-4f47-9c54-4379713393ea.png&w=1920&q=85',
    tag: 'EARN',
    title: 'Daily Reward Deck',
    desc: 'Claim streak XP every 24 h. Hit day 7 and unlock the 2× Golden Tide multiplier.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103728_394f6a1b-85e2-4386-a4f6-408472a0a5b7.png&w=1920&q=85',
    tag: 'COLLECT',
    title: 'NFT Fleet Hangar',
    desc: 'Mint Dinghies to Mega Ships — stronger vessels earn up to 200 XP per day.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103739_86743e0e-16a7-4bee-bf38-dd67985344dc.png&w=1920&q=85',
    tag: 'COMPETE',
    title: 'Captain Leaderboards',
    desc: 'XP rankings, streak champions, and fishing mini-game timing scores — all live.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103748_b2215dc8-a3a7-470d-b19a-5b87fa7d0c37.png&w=1920&q=85',
    tag: 'PROFILE',
    title: 'Captain Profile',
    desc: 'View your fleet, total XP, streak history and active boost multipliers.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103758_e919ce72-5c9d-4b87-9be6-d7647b34825c.png&w=1920&q=85',
    tag: 'BOOST',
    title: 'Golden Tide Multiplier',
    desc: 'Maintain consecutive daily claims to multiply your ocean rewards up to 5×.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103808_013583d0-3386-4547-9832-37c7d8edb3ac.png&w=1920&q=85',
    tag: 'VESSEL',
    title: 'Deepwater Trawlers',
    desc: 'Heavy-duty commercial vessels built for conquering high-yield deep ocean coordinates.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103937_a0c49d0a-33eb-4ead-aea6-c1baf241acbc.png&w=1920&q=85',
    tag: 'TACTICS',
    title: '100×100 Grid Strategy',
    desc: 'Navigate your vessel to tactical open waters. Every move triggers real-time XP accumulation.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103956_d18ed8fd-7b6f-4b86-91f9-20010fe38670.png&w=1920&q=85',
    tag: 'ONCHAIN',
    title: 'Base Mainnet Built',
    desc: 'Fully decentralized game logic, instant transactions, and non-custodial ownership on Base.',
  },
  {
    url: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104034_ba5a9963-87ff-4008-a545-6bd686c088b5.png&w=1920&q=85',
    tag: 'ARCADE',
    title: 'Fishing Mini-Game',
    desc: 'Test your reflexes and timing in fast-paced fishing challenges to earn instant bonus XP.',
  },
];

/* ── Scattered Grid Layout Algorithm ─────────────────────────────── */
function buildLayout(count: number, cols: number): number[][] {
  const rows: number[][] = [];
  let itemIdx = 0;
  let r = 0;

  while (itemIdx < count) {
    const row = new Array(cols).fill(-1);
    const a = (r * 2 + (r % 2)) % cols;
    row[a] = itemIdx++;

    if (r % 3 === 0 && itemIdx < count) {
      let b = (a + 2) % cols;
      if (b === a) b = (a + 1) % cols;
      row[b] = itemIdx++;
    }
    rows.push(row);
    r++;
  }
  return rows;
}

/* ── Wallet login hook ───────────────────────────────────────────── */
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

/* ── Scroll-Driven Black Panel Gallery Section ───────────────────── */
function ScrollGallerySection({
  maxScroll,
  onMaxScrollChange,
  onLogin,
  busy,
  heroRef,
}: {
  maxScroll: number;
  onMaxScrollChange: (val: number) => void;
  onLogin: () => void;
  busy: boolean;
  heroRef: React.RefObject<HTMLDivElement | null>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const outroInfoRef = useRef<HTMLDivElement>(null);
  const outroBtnRef = useRef<HTMLButtonElement>(null);
  const outroFooterRef = useRef<HTMLDivElement>(null);
  const circleSymbolRef = useRef<HTMLSpanElement>(null);
  const [cols, setCols] = useState(4);
  const lastSymbolUpdateRef = useRef(0);

  // Measure columns and wrapper height
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const c = w < 640 ? 2 : w < 1024 ? 3 : 4;
      setCols(c);
      if (wrapperRef.current) {
        const h = wrapperRef.current.scrollHeight;
        const vh = window.innerHeight || 800;
        const calcMax = Math.max(1000, h - vh);
        onMaxScrollChange(calcMax);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    const timer = setTimeout(measure, 500);
    const timer2 = setTimeout(measure, 1500);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [cols, onMaxScrollChange]);

  // RAF scroll animation loop
  useEffect(() => {
    let rafId: number;
    const symbols = ['8', '$', '^^', '%', '/', '🌊', '⚓', '⚡', '⛵', '🔥'];

    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 800;
      const ms = maxScroll;

      // Hide Hero video when covered by Black Panel to optimize rendering
      if (heroRef.current) {
        heroRef.current.style.visibility = scrollY > vh ? 'hidden' : 'visible';
      }

      // Phase 1: Panel slide up from bottom
      const panelTranslateY = Math.max(0, vh - scrollY);
      if (panelRef.current) {
        panelRef.current.style.transform = `translate3d(0, ${panelTranslateY}px, 0)`;
      }

      // Phase 2: Inner wrapper scroll
      const phase2Scroll = Math.max(0, scrollY - vh);
      const wrapperTranslateY = -Math.min(ms, phase2Scroll);
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(0, ${wrapperTranslateY}px, 0)`;
      }

      // Card scale animations (Enter / Exit scaling based on viewport position)
      for (let i = 0; i < GALLERY_ITEMS.length; i++) {
        const cell = cellRefs.current[i];
        const card = cardRefs.current[i];
        if (cell && card) {
          const rect = cell.getBoundingClientRect();
          const enter = Math.min(1, (vh - rect.top) / (vh * 0.6));
          const exit = Math.min(1, rect.bottom / (vh * 0.4));
          let scale = Math.min(enter, exit);
          if (rect.bottom <= 0 || rect.top >= vh) scale = 0;
          scale = Math.max(0, Math.min(1, scale));
          card.style.transform = `scale(${scale.toFixed(3)})`;
        }
      }

      // Outro Phase (scrollY > vh + maxScroll)
      const outroStart = vh + ms;
      const outroProgress = Math.max(0, Math.min(1, (scrollY - outroStart) / Math.max(100, vh - 100)));

      if (overlayRef.current) overlayRef.current.style.opacity = outroProgress.toFixed(3);
      if (outroInfoRef.current) {
        outroInfoRef.current.style.opacity = outroProgress.toFixed(3);
        outroInfoRef.current.style.transform = `translate3d(0, ${((1 - outroProgress) * 80).toFixed(1)}px, 0)`;
      }
      if (outroBtnRef.current) {
        outroBtnRef.current.style.transform = `scale(${outroProgress.toFixed(3)})`;
        outroBtnRef.current.style.pointerEvents = outroProgress > 0.7 ? 'auto' : 'none';
      }
      if (outroFooterRef.current) {
        outroFooterRef.current.style.opacity = outroProgress.toFixed(3);
      }

      // Random symbol ticker on scroll
      const now = performance.now();
      if (scrollY > vh && now - lastSymbolUpdateRef.current > 80) {
        lastSymbolUpdateRef.current = now;
        if (circleSymbolRef.current) {
          const rand = symbols[Math.floor(Math.random() * symbols.length)];
          circleSymbolRef.current.textContent = rand;
        }
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [maxScroll, heroRef]);

  const layoutRows = useMemo(() => buildLayout(GALLERY_ITEMS.length, cols), [cols]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 10,
        transform: 'translate3d(0, 100vh, 0)',
        willChange: 'transform',
        overflow: 'hidden',
      }}
    >
      {/* Inner wrapper */}
      <div
        ref={wrapperRef}
        style={{
          width: '100%',
          paddingTop: 'min(350px, 35vh)',
          paddingBottom: 'min(450px, 45vh)',
        }}
      >
        <div
          ref={innerRef}
          style={{
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 1.5rem',
            willChange: 'transform',
          }}
        >
          {layoutRows.map((row, rIdx) => (
            <div
              key={rIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: '2rem',
                marginBottom: '2.5rem',
              }}
            >
              {row.map((itemIdx, cIdx) => {
                if (itemIdx === -1 || !GALLERY_ITEMS[itemIdx]) {
                  return <div key={cIdx} style={{ aspectRatio: '2/3' }} />;
                }
                const item = GALLERY_ITEMS[itemIdx];
                const isLeftHalf = cIdx < cols / 2;
                return (
                  <div
                    key={cIdx}
                    ref={(el) => { cellRefs.current[itemIdx] = el; }}
                    style={{ aspectRatio: '2/3', width: '100%', position: 'relative' }}
                  >
                    <div
                      ref={(el) => { cardRefs.current[itemIdx] = el; }}
                      className="bp-card"
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        backgroundColor: '#0a1622',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                        transformOrigin: isLeftHalf ? 'right bottom' : 'left bottom',
                        transform: 'scale(0)',
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.5s ease',
                        }}
                      />
                      {/* Gradient overlay + copy */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          padding: '1.25rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: '"Inter Tight", sans-serif',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.14em',
                            color: '#4AAAF7',
                            textTransform: 'uppercase',
                            marginBottom: '0.3rem',
                          }}
                        >
                          {item.tag}
                        </span>
                        <h3
                          style={{
                            fontFamily: 'var(--font-display, "Instrument Serif", serif)',
                            fontSize: 'clamp(1.25rem, 2.2vw, 1.65rem)',
                            fontWeight: 400,
                            color: '#ffffff',
                            margin: '0 0 0.35rem 0',
                            lineHeight: 1.1,
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          style={{
                            fontFamily: 'var(--font-nunito, Nunito, sans-serif)',
                            fontSize: '0.8rem',
                            color: 'rgba(200, 220, 235, 0.8)',
                            lineHeight: 1.4,
                            margin: 0,
                          }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── 1I. White Overlay ── */}
      <div
        ref={overlayRef}
        id="outro-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          zIndex: 12,
          opacity: 0,
          transition: 'opacity 0.1s linear',
        }}
      />

      {/* ── 1E. Outro Product Info (Bottom Left) ── */}
      <div
        ref={outroInfoRef}
        id="outro-info"
        style={{
          position: 'fixed',
          left: '2.5rem',
          bottom: '5rem',
          zIndex: 20,
          pointerEvents: 'none',
          mixBlendMode: 'exclusion',
          opacity: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2.5px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Inter Tight", sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              color: '#ffffff',
            }}
          >
            <span ref={circleSymbolRef}>8</span>
          </div>
          <div>
            <p style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff', margin: 0 }}>
              ARCHIVE COLLECTION
            </p>
            <p style={{ fontFamily: 'var(--font-display, "Instrument Serif", serif)', fontSize: '24px', color: '#ffffff', margin: 0, lineHeight: 1 }}>
              FISHBASE ONCHAIN
            </p>
          </div>
        </div>
        <p style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)', color: '#ffffff', margin: 0, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
          FREE DINGHY
        </p>
      </div>

      {/* ── 1F. "Join" CTA Button (Bottom Right) ── */}
      <button
        ref={outroBtnRef}
        id="outro-buy"
        type="button"
        onClick={onLogin}
        disabled={busy}
        style={{
          position: 'fixed',
          right: '2.5rem',
          bottom: '2.5rem',
          zIndex: 25,
          mixBlendMode: 'exclusion',
          backgroundColor: '#ffffff',
          borderRadius: '1335px',
          width: 'clamp(220px, 26vw, 340px)',
          height: 'clamp(90px, 13vw, 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'right bottom',
          transform: 'scale(0)',
          border: 'none',
          cursor: busy ? 'not-allowed' : 'pointer',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        }}
      >
        <span
          style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(36px, 5.5vw, 80px)',
            letterSpacing: '-0.04em',
            color: '#ffffff',
            mixBlendMode: 'exclusion',
            textTransform: 'lowercase',
          }}
        >
          {busy ? 'connecting...' : 'join'}
        </span>
      </button>

      {/* ── 1J. Outro Footer ── */}
      <div
        ref={outroFooterRef}
        id="outro-footer"
        style={{
          position: 'fixed',
          left: '2.5rem',
          bottom: '1.5rem',
          right: '2.5rem',
          zIndex: 20,
          pointerEvents: 'none',
          mixBlendMode: 'exclusion',
          opacity: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '"Inter Tight", sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#ffffff',
        }}
      >
        <span>FISHBASE ® 2026</span>
        <span>ONCHAIN CAPTAIN FLEET</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router   = useRouter();
  const { user } = useAuth();
  const { login, status, error, busy } = useHeroLogin();
  const [maxScroll, setMaxScroll] = useState(3000);
  const heroRef = useRef<HTMLDivElement>(null);

  /* Redirect authenticated users */
  useEffect(() => {
    if (user) router.replace('/profile');
  }, [user, router]);

  return (
    <div
      id="scroll-spacer"
      style={{
        fontFamily: 'var(--font-nunito, Nunito, sans-serif)',
        background: '#000e1a',
        position: 'relative',
        width: '100%',
        height: `calc(300vh + ${maxScroll}px)`,
        userSelect: 'none',
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          HERO — Fixed during Phase 1 (first 100vh)
      ══════════════════════════════════════════════════════════ */}
      <div
        ref={heroRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
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
          BELOW FOLD — Scroll-Driven Black Panel & Gallery Grid
      ══════════════════════════════════════════════════════════ */}
      <ScrollGallerySection
        maxScroll={maxScroll}
        onMaxScrollChange={setMaxScroll}
        onLogin={login}
        busy={busy}
        heroRef={heroRef}
      />
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { User, Map as MapIcon, Trophy, Anchor, Gift, LogOut, type LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  caption: string;
  mark: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/profile',     label: 'Profile',   caption: 'Captain overview',  mark: 'PR', icon: User },
  { href: '/map',         label: 'Sea Map',   caption: 'Deploy your boat',  mark: 'MP', icon: MapIcon },
  { href: '/leaderboard', label: 'Leaders',   caption: 'Top captains',      mark: 'LB', icon: Trophy },
  { href: '/nft-mint',    label: 'NFT Fleet', caption: 'Upgrade boats',     mark: 'NF', icon: Anchor },
  { href: '/daily-claim', label: 'Daily XP',  caption: 'Streak boosts',     mark: 'DX', icon: Gift },
];

/* ── Top navigation (dark glassmorphic) ─────────────────────────── */
export const MainNavigation = () => {
  const pathname = usePathname();
  const { user, clearSession } = useAuth();

  return (
    <div
      style={{
        background: 'rgba(0, 16, 28, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 22,
        padding: '0.7rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          href="/profile"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', color: '#fff', fontWeight: 800,
            fontSize: '1.25rem', letterSpacing: '-0.03em',
          }}
        >
          <span className="brand-icon-round" aria-hidden="true">
            <img src="/icon.png?v=4" alt="" />
          </span>
          <span style={{
            background: 'linear-gradient(135deg, #4AAAF7 0%, #1F7AE0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontWeight: 900,
          }}>
            FishBase
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '0.15rem 0.45rem',
            borderRadius: 999, background: 'rgba(74, 170, 247, 0.15)',
            color: '#4AAAF7', border: '1px solid rgba(74, 170, 247, 0.3)',
          }}>
            L2
          </span>
        </Link>
      </div>

      {/* Center Nav Items */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ y: -2 }}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column',
                  background: isActive ? 'rgba(74,170,247,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(74,170,247,0.25)' : '1px solid transparent',
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(175,200,218,0.70)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'color 0.2s ease',
                }}>
                  <IconComponent size={15} />
                  {item.label}
                </span>
                <span style={{ fontSize: '0.65rem', color: isActive ? 'rgba(175,200,218,0.6)' : 'rgba(175,200,218,0.38)', marginTop: '0.08rem' }}>
                  {item.caption}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          href="/daily-claim"
          className="hidden-sm"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'linear-gradient(135deg, rgba(74,170,247,0.2), rgba(31,122,224,0.15))',
            border: '1px solid rgba(74,170,247,0.28)',
            color: '#fff', borderRadius: 999,
            padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700,
            textDecoration: 'none', transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
        >
          <Gift size={15} /> Daily XP
        </Link>

        <button
          onClick={clearSession}
          type="button"
          aria-label="Sign out"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(175,200,218,0.75)', borderRadius: 999,
            padding: '0.5rem 0.85rem', fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,80,80,0.1)'; b.style.color='#F87171'; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,0.05)'; b.style.color='rgba(175,200,218,0.75)'; }}
        >
          <LogOut size={14} />
          <span className="sign-out-text">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

/* ── Bottom navigation (dark glassmorphic) ───────────────────────── */
export const BottomNavigation = () => {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav"
      aria-label="Primary navigation"
      style={{
        background: 'rgba(0, 14, 24, 0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.4), 0 18px 42px rgba(27,92,158,0.12)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'is-active' : ''}`}
            aria-label={item.label}
          >
            <span
              className="bottom-nav-icon"
              aria-hidden="true"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #4AAAF7, #1F7AE0)'
                  : 'rgba(255,255,255,0.06)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: isActive ? '#fff' : 'rgba(175,200,218,0.7)',
                display: 'grid',
                placeItems: 'center',
                width: 38,
                height: 38,
                borderRadius: 12,
              }}
            >
              <IconComponent size={18} />
            </span>
            <span
              className="bottom-nav-label"
              style={{ color: isActive ? '#fff' : 'rgba(175,200,218,0.55)' }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

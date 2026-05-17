'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { WalletConnect } from '@/components/auth/WalletConnect';
import {
  Calendar,
  Map as MapIcon,
  ChevronRight,
  Zap,
  Anchor,
  Sailboat,
  Ship,
  Truck,
  Crown,
} from 'lucide-react';

// ── Boat tiers shown on landing page ────────────────────────────────────────
const BOATS = [
  {
    icon: Anchor,
    name: 'Dinghy',
    xp: '10 XP/day',
    price: 'Free',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    desc: 'Your starter vessel — claim it free when you join.',
  },
  {
    icon: Sailboat,
    name: 'Sailboat',
    xp: '25 XP/day',
    price: '$1.00',
    color: '#22C55E',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    desc: 'A nimble sail for active captains who love the wind.',
  },
  {
    icon: MapIcon,
    name: 'Yacht',
    xp: '50 XP/day',
    price: '$3.00',
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
    desc: 'Sleek cruiser with twice the earning power.',
  },
  {
    icon: Truck,
    name: 'Trawler',
    xp: '100 XP/day',
    price: '$5.00',
    color: '#EF4444',
    bg: '#FFF1F2',
    border: '#FECDD3',
    desc: 'Heavy-duty commercial trawler built for serious fishing.',
  },
  {
    icon: Crown,
    name: 'Mega Ship',
    xp: '200 XP/day',
    price: '$6.99',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    desc: 'The ultimate ocean liner — maximum XP, maximum prestige.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/profile');
  }, [user, router]);

  return (
    <main className="container py-8 md:py-16 flex flex-col gap-16">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row items-center gap-8 md:gap-16 min-h-[60vh] md:min-h-[70vh]">
        <div className="flex-1 flex flex-col items-start gap-6 relative z-10">
          <span className="badge bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-200">
            Base App · Chain ID 8453
          </span>
          <h1 className="game-title text-5xl md:text-7xl font-extrabold text-blue-900 leading-tight">
            FishBase
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-lg leading-relaxed">
            Connect your Base wallet, deploy your fleet on the live sea map,
            earn daily XP, and climb to captain rank — all onchain.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mt-4">
            <WalletConnect className="wallet-panel" />
            <Link
              href="/leaderboard"
              className="secondary-button !py-3 !px-6 rounded-full flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Leaderboards <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="flex-1 flex justify-center w-full relative z-10 mt-8 md:mt-0">
          <div className="w-full max-w-[300px] aspect-square rounded-full border-[12px] border-white/80 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col items-center justify-center gap-2">
            <Ship size={64} color="#1D4ED8" strokeWidth={1.5} />
            <strong className="text-blue-700 text-2xl font-black tracking-wide">FishBase</strong>
            <span className="text-blue-500 text-sm font-semibold">Base Mainnet</span>
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="bg-white/90 backdrop-blur border border-blue-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
            <Calendar size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Daily XP</h2>
          <p className="text-gray-600 leading-relaxed">
            Claim streak rewards every 24 hours and keep your captain profile moving forward.
          </p>
        </article>

        <article className="bg-white/90 backdrop-blur border border-amber-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
            <MapIcon size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Live Map</h2>
          <p className="text-gray-600 leading-relaxed">
            Place boats across Base waters and react to the dynamic 100×100 board.
          </p>
        </article>

        <article className="bg-white/90 backdrop-blur border border-teal-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-6">
            <Zap size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">NFT Fleet</h2>
          <p className="text-gray-600 leading-relaxed">
            Mint stronger boats and boost your earning power — pay with ETH or USDC.
          </p>
        </article>
      </section>

      {/* ── Boat pricing ──────────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Choose Your Vessel</h2>
          <p className="text-gray-500 mt-2 text-lg">Pay with ETH or USDC — your choice.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {BOATS.map((boat) => {
            const Icon = boat.icon;
            return (
              <div
                key={boat.name}
                style={{
                  background:    boat.bg,
                  border:        `1.5px solid ${boat.border}`,
                  borderRadius:  20,
                  padding:       '1.5rem 1.25rem',
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           '0.75rem',
                  transition:    'box-shadow 0.2s ease',
                }}
                className="hover:shadow-lg"
              >
                {/* Icon */}
                <div
                  style={{
                    width:          48,
                    height:         48,
                    borderRadius:   '50%',
                    background:     `${boat.color}18`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={boat.color} />
                </div>

                {/* Name + XP */}
                <div>
                  <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>{boat.name}</p>
                  <p style={{ fontSize: '0.78rem', color: boat.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                    <Zap size={12} /> {boat.xp}
                  </p>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5, flex: 1 }}>
                  {boat.desc}
                </p>

                {/* Price badge */}
                <div
                  style={{
                    background:   boat.color,
                    color:        '#fff',
                    borderRadius: 999,
                    padding:      '0.45rem 0',
                    textAlign:    'center',
                    fontWeight:   700,
                    fontSize:     '0.9rem',
                  }}
                >
                  {boat.price}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <Link href="/nft-mint" className="primary-button inline-flex items-center gap-2 !px-8 !py-3 rounded-full text-base font-semibold">
            View NFT Hangar <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <section className="bg-white/60 border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Built on Base</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            Fully onchain game logic on Base mainnet. Connect with any EVM wallet and start playing instantly.
          </p>
        </div>
        <WalletConnect className="wallet-panel" />
      </section>

    </main>
  );
}

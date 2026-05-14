'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

type NavItem = {
  href: string;
  label: string;
  caption: string;
  mark: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/profile', label: 'Profile', caption: 'Captain overview', mark: 'PR' },
  { href: '/map', label: 'Sea Map', caption: 'Deploy your boat', mark: 'MP' },
  { href: '/map#fishing-game', label: 'Quick Catch', caption: 'Time your catch', mark: 'QC' },
  { href: '/leaderboard', label: 'Leaders', caption: 'Top captains', mark: 'LB' },
  { href: '/nft-mint', label: 'NFT Fleet', caption: 'Upgrade boats', mark: 'NF' },
  { href: '/daily-claim', label: 'Daily XP', caption: 'Streak boosts', mark: 'DX' },
];

export const MainNavigation = () => {
  const pathname = usePathname();
  const { user, clearSession } = useAuth();

  return (
    <div className="glass-panel border px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="shine rounded-full bg-white border px-3 py-2 flex items-center gap-2">
          <span className="nav-mark" aria-hidden="true">FB</span>
          <div>
            <p className="text-sm font-semibold text-gray-700 leading-none">FishBase</p>
            <p className="text-xs text-gray-500">Base App</p>
          </div>
        </div>
        {user && (
          <div className="hidden-sm flex-col">
            <span className="text-sm text-gray-500">Captain</span>
            <span className="font-semibold text-gray-800">{user.username}</span>
          </div>
        )}
      </div>

      <nav className="hidden-sm flex items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);

          return (
            <Link key={item.href} href={item.href} className="relative">
              <motion.div
                whileHover={{ y: -2 }}
                className={`px-4 py-2 rounded-lg flex flex-col transition-all ${
                  isActive
                    ? 'bg-blue-200 text-blue-800 shadow-md'
                    : 'bg-white/80 text-gray-600 hover:bg-blue-100/80'
                }`}
              >
                <span className="text-base font-semibold flex items-center gap-1">
                  <span className="nav-mark nav-mark-small" aria-hidden="true">{item.mark}</span>
                  {item.label}
                </span>
                <span className="text-xs text-gray-500">{item.caption}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/daily-claim" className="hidden-sm primary-button text-sm py-2 px-4">
          Daily XP
        </Link>
        <button
          onClick={clearSession}
          className="secondary-button text-sm py-2 px-4"
          type="button"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export const BottomNavigation = () => {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs font-semibold transition-all ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}
            aria-label={item.label}
          >
            <span className="nav-mark nav-mark-small" aria-hidden="true">
              {item.mark}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

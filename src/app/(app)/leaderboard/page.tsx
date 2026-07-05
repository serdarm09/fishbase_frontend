'use client';

import { useEffect, useState } from 'react';
import { leaderboardApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Users, Ship, Trophy, Flame, Fish,
  Medal, Anchor, Zap, Crown, Star
} from 'lucide-react';

type XpEntry = {
  rank: number;
  username: string;
  totalXp: number;
  level: number;
  avatar?: string;
  fid: number;
};

type StreakEntry = {
  rank: number;
  username: string;
  currentStreak: number;
  longestStreak: number;
  avatar?: string;
  fid: number;
};

type FishingEntry = {
  rank: number;
  username: string;
  displayName?: string;
  highScore: number;
  bestReactionMs?: number | null;
  totalGames: number;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={20} className="text-yellow-500 anim-xp-pulse" style={{ animationIterationCount: 'infinite', animationDuration: '2.4s' }} />;
  if (rank === 2) return <Medal size={20} className="text-gray-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-gray-500 font-bold w-5 text-center block">#{rank}</span>;
};

/** Returns row class based on rank for gold/silver/bronze tint */
const rankRowClass = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-50/80 to-amber-50/40 border-l-2 border-l-yellow-400';
  if (rank === 2) return 'bg-gradient-to-r from-gray-50/80 to-slate-50/40 border-l-2 border-l-gray-300';
  if (rank === 3) return 'bg-gradient-to-r from-orange-50/60 to-amber-50/30 border-l-2 border-l-amber-500';
  return '';
};

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [xpEntries, setXpEntries] = useState<XpEntry[]>([]);
  const [streakEntries, setStreakEntries] = useState<StreakEntry[]>([]);
  const [fishingEntries, setFishingEntries] = useState<FishingEntry[]>([]);
  const [fishingRank, setFishingRank] = useState<number | null>(null);
  const [fishingHighScore, setFishingHighScore] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [xpRes, streakRes, statsRes, fishingRes] = await Promise.all([
          leaderboardApi.getXpLeaderboard(token, { limit: 25 }),
          leaderboardApi.getStreakLeaderboard(),
          leaderboardApi.getStats(),
          leaderboardApi.getFishingLeaderboard(token, { limit: 15 }),
        ]);

        setXpEntries(xpRes.leaderboard.entries);
        setStreakEntries(streakRes.streakLeaderboard?.entries || []);
        setStats(statsRes.stats);
        setFishingEntries(fishingRes.fishingLeaderboard?.entries || []);
        setFishingRank(fishingRes.fishingLeaderboard?.userRank || null);
        setFishingHighScore(fishingRes.fishingLeaderboard?.userHighScore || null);
      } catch (err: any) {
        setError(err.message || 'Unable to fetch leaderboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return (
    <section className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="ocean-card space-y-3 anim-float-in-up">
        <h1 className="page-heading flex items-center gap-3">
          <Trophy className="text-blue-600" size={28} />
          Captain Leaderboards
          <span className="badge ml-2">Live</span>
        </h1>
        <p className="page-subtitle">
          Track the sharpest anglers on Base, see who maintains the strongest streaks, and review top
          timing masters from the fishing mini game.
        </p>
      </header>

      {error && (
        <div className="ocean-card border-red-500/40 bg-red-50/80 text-red-600 font-semibold flex items-center gap-2 anim-float-in-up">
          <Zap size={18} /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="ocean-card text-sm text-gray-600 flex items-center gap-2">
          Loading leaderboards <span className="loading-dots" />
        </div>
      ) : (
        <>
          {/* ── Stats row ───────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-1 grid-md-2 grid-xl-4 gap-3">
              {[
                { icon: <Users size={20} className="text-blue-600" />,   label: 'Total captains',  value: formatNumber(stats.totalPlayers || 0), helper: 'Active players exploring FishBase', accent: 'blue' as const },
                { icon: <Ship size={20} className="text-amber-500" />,   label: 'Boats on map',    value: formatNumber(stats.totalBoats || 0),   helper: 'Active vessels in the sea map',     accent: 'sun'  as const },
                { icon: <Star size={20} className="text-teal-600" />,    label: 'XP leader',       value: stats.topXp?.username || '—',          helper: `${formatNumber(stats.topXp?.value || 0)} XP`, accent: 'green' as const },
                { icon: <Flame size={20} className="text-purple-600" />, label: 'Streak champion', value: stats.topStreak?.username || '—',      helper: `${formatNumber(stats.topStreak?.value || 0)} days`, accent: 'purple' as const },
              ].map((card, i) => (
                <div
                  key={card.label}
                  className="anim-pop-in"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <StatCard
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    helper={card.helper}
                    accent={card.accent}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── XP Leaderboard ──────────────────────────────── */}
          <section className="ocean-card space-y-4 anim-float-in-up anim-delay-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={20} className="text-blue-600" /> XP Leaderboard
              </h2>
              <span className="chip">Top 25</span>
            </div>
            <div className="bg-white/80 border border-blue-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-gray-600">
                <thead className="bg-blue-50 text-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Captain</th>
                    <th className="text-left py-3 px-4">Level</th>
                    <th className="text-left py-3 px-4">Total XP</th>
                  </tr>
                </thead>
                <tbody>
                  {xpEntries.map((entry, idx) => (
                    <tr
                      key={`${entry.fid}-${entry.rank}`}
                      className={`border-t border-blue-100/50 hover:bg-blue-50/60 transition-colors anim-lb-row ${rankRowClass(entry.rank)}`}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <td className="py-3 px-4 font-semibold text-gray-700 w-16">
                        <RankIcon rank={entry.rank} />
                      </td>
                      <td className="py-3 px-4 flex items-center gap-3">
                        {entry.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full object-cover border border-blue-200"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                            {entry.username[0]?.toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-gray-800">{entry.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">
                          Lvl {entry.level}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-bold text-blue-700 ${entry.rank === 1 ? 'anim-stat-shimmer' : ''}`}>
                        {formatNumber(entry.totalXp)} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Streak Board ────────────────────────────────── */}
          <section className="ocean-card space-y-4 anim-float-in-up anim-delay-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Flame size={20} className="text-orange-500" /> Streak Board
              </h2>
              <span className="chip">Daily login legends</span>
            </div>

            <div className="grid grid-cols-1 grid-md-2 gap-3">
              {streakEntries.map((entry, idx) => (
                <div
                  key={`${entry.fid}-${entry.rank}`}
                  className={`bg-white/85 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow anim-lb-row ${rankRowClass(entry.rank)}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-8 flex justify-center">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-base">{entry.username}</p>
                    <div className="text-xs text-gray-500 flex gap-4 mt-1 font-medium">
                      <span className="flex items-center gap-1 text-orange-600">
                        <Flame size={12} /> {entry.currentStreak} days
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Star size={12} /> Best: {entry.longestStreak} days
                      </span>
                    </div>
                  </div>
                  {entry.rank === 1 && (
                    <span className="text-lg anim-bobber" aria-hidden="true">🔥</span>
                  )}
                </div>
              ))}
              {!streakEntries.length && (
                <div className="empty-state w-full col-span-full">
                  No streak data available. Log in daily to climb the ranks!
                </div>
              )}
            </div>
          </section>

          {/* ── Fishing Mini Game Board ──────────────────────── */}
          <section className="ocean-card space-y-4 anim-float-in-up anim-delay-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Fish size={20} className="text-teal-600" /> Fishing Mini Game
              </h2>
              {fishingRank && (
                <span className="chip flex items-center gap-1">
                  <Medal size={14} className="text-blue-600" /> Your rank #{fishingRank}
                  {fishingHighScore ? ` • High score ${fishingHighScore}` : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 grid-md-2 gap-3">
              {fishingEntries.map((entry, idx) => (
                <div
                  key={`${entry.username}-${entry.rank}`}
                  className={`bg-white/85 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow anim-lb-row ${rankRowClass(entry.rank)}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-8 flex justify-center">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-base">
                      {entry.displayName || entry.username}
                    </p>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1 font-medium">
                      <span className={`text-teal-700 ${entry.rank === 1 ? 'font-black' : ''}`}>
                        Score: {entry.highScore}
                      </span>
                      {entry.bestReactionMs && <span>{entry.bestReactionMs}ms</span>}
                      <span className="text-slate-400">{entry.totalGames} games</span>
                    </div>
                  </div>
                  {entry.rank === 1 && (
                    <span className="text-lg anim-bobber" aria-hidden="true">🎣</span>
                  )}
                </div>
              ))}
              {!fishingEntries.length && (
                <div className="empty-state col-span-full">
                  No fishing scores recorded yet. Head to the map and play the mini game to claim the top spot!
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

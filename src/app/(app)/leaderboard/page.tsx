'use client';

import { useEffect, useState } from 'react';
import { leaderboardApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';

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
        setStreakEntries(streakRes.streakLeaderboard.entries);
        setStats(statsRes.stats);
        setFishingEntries(fishingRes.fishingLeaderboard.entries);
        setFishingRank(fishingRes.fishingLeaderboard.userRank);
        setFishingHighScore(fishingRes.fishingLeaderboard.userHighScore);
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
      <header className="ocean-card space-y-3">
        <h1 className="page-heading">
          Captain Leaderboards
          <span className="badge">Live</span>
        </h1>
        <p className="page-subtitle">
          Track the sharpest anglers on Base, see who maintains the strongest streaks, and review top
          timing masters from the fishing mini game.
        </p>
      </header>

      {error && (
        <div className="ocean-card border-red-500/40 bg-red-50/80 text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="ocean-card text-sm text-gray-600">
          Loading leaderboards <span className="loading-dots" />
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 grid-md-2 grid-xl-4 gap-3">
              <StatCard
                icon="🌊"
                label="Total captains"
                value={formatNumber(stats.totalPlayers || 0)}
                helper="Active players exploring FishBase"
                accent="blue"
              />
              <StatCard
                icon="🚤"
                label="Boats on map"
                value={formatNumber(stats.totalBoats || 0)}
                helper="Active vessels in the sea map"
                accent="sun"
              />
              <StatCard
                icon="🏆"
                label="XP leader"
                value={stats.topXp?.username || '—'}
                helper={`${formatNumber(stats.topXp?.value || 0)} XP`}
                accent="green"
              />
              <StatCard
                icon="🔥"
                label="Streak champion"
                value={stats.topStreak?.username || '—'}
                helper={`${formatNumber(stats.topStreak?.value || 0)} days`}
                accent="purple"
              />
            </div>
          )}

          <section className="ocean-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🏅 XP leaderboard
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
                  {xpEntries.map((entry) => (
                    <tr
                      key={`${entry.fid}-${entry.rank}`}
                      className="border-t border-blue-100/50 hover:bg-blue-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        {entry.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm text-blue-700">
                            {entry.username[0]?.toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-gray-700">{entry.username}</span>
                      </td>
                      <td className="py-3 px-4">{entry.level}</td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        {formatNumber(entry.totalXp)} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ocean-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🔥 Streak board
              </h2>
              <span className="chip">Daily login legends</span>
            </div>

            <div className="grid grid-cols-1 grid-md-2 gap-3">
              {streakEntries.map((entry) => (
                <div
                  key={`${entry.fid}-${entry.rank}`}
                  className="bg-white/85 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
                >
                  <span className="text-2xl font-bold text-blue-700 w-10 text-center">
                    {entry.rank <= 3 ? ['🌟', '✨', '💫'][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">{entry.username}</p>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>Streak: {entry.currentStreak} days</span>
                      <span>Record: {entry.longestStreak} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ocean-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🎣 Fishing mini game
              </h2>
              {fishingRank && (
                <span className="chip">
                  Your rank #{fishingRank}
                  {fishingHighScore ? ` • High score ${fishingHighScore}` : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 grid-md-2 gap-3">
              {fishingEntries.map((entry) => (
                <div
                  key={`${entry.username}-${entry.rank}`}
                  className="bg-white/85 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
                >
                  <span className="text-2xl font-bold text-blue-700 w-10 text-center">
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">
                      {entry.displayName || entry.username}
                    </p>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>High score {entry.highScore}</span>
                      {entry.bestReactionMs && <span>Best {entry.bestReactionMs} ms</span>}
                      <span>{entry.totalGames} games</span>
                    </div>
                  </div>
                </div>
              ))}
              {!fishingEntries.length && (
                <div className="empty-state">
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


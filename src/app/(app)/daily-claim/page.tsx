'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '@/context/AuthContext';
import { gameApi } from '@/services/api';
import type { UserProfile } from '@/types';

dayjs.extend(relativeTime);

type ClaimState = {
  canClaim: boolean;
  nextClaimTime?: string;
  streakMultiplier?: number;
};

const streakRewards = [
  { day: 1, multiplier: 1.0, label: 'Starting Line' },
  { day: 2, multiplier: 1.1, label: 'Tailwind Boost' },
  { day: 3, multiplier: 1.2, label: 'Caught the Current' },
  { day: 4, multiplier: 1.3, label: 'Lucky Net' },
  { day: 5, multiplier: 1.4, label: 'Storm Resilience' },
  { day: 6, multiplier: 1.6, label: 'Epic Catch' },
  { day: 7, multiplier: 2.0, label: 'Golden Tide' },
];

export default function DailyClaimPage() {
  const { token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>({ canClaim: false });

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await gameApi.getProfile(token);
      const data = response.profile;
      const lastClaim = data.lastClaimDate;

      setProfile(data);
      setClaimState({
        canClaim: data.canClaimDaily,
        nextClaimTime:
          data.canClaimDaily || !lastClaim
            ? undefined
            : dayjs(lastClaim).add(24, 'hour').toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load daily claim data.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleClaim = async () => {
    if (!token) return;

    try {
      setIsClaiming(true);
      setError(null);
      setSuccess(null);

      const result = await gameApi.claimDaily(token);
      const claim = result.claim;

      setSuccess(
        `🎉 You earned ${claim.xpEarned} XP! New streak ${claim.newStreak} days, multiplier ${(claim.streakMultiplier || 1).toFixed(2)}x.`
      );

      setClaimState({
        canClaim: false,
        nextClaimTime: claim.nextClaimTime,
        streakMultiplier: claim.streakMultiplier,
      });

      await fetchProfile();

      updateUser((prev) => ({
        ...prev,
        totalXp: claim.totalXp,
        currentStreak: claim.newStreak,
      }));
    } catch (err: any) {
      setError(err.message || 'Unable to claim your daily reward.');
    } finally {
      setIsClaiming(false);
    }
  };

  const currentStreak = profile?.currentStreak || 0;
  const streakPosition =
    currentStreak > 0 ? ((currentStreak - 1) % streakRewards.length) + 1 : 1;

  const currentReward = streakRewards.find((reward) => reward.day === streakPosition) ?? streakRewards[0];

  const multiplier =
    claimState.streakMultiplier ??
    currentReward.multiplier ??
    1;
  const activeBoat = profile?.activeBoat;
  const nextClaimText = useMemo(() => {
    if (!claimState.nextClaimTime) return null;
    return dayjs(claimState.nextClaimTime).fromNow();
  }, [claimState.nextClaimTime]);

  return (
    <section className="space-y-6">
      <header className="ocean-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-heading">
              Daily Reward Deck
              <span className="badge">7-day multiplier</span>
            </h1>
            <p className="page-subtitle">
              Visit the deck every day, grow your streak, and double your fishing XP on Base.
            </p>
          </div>
          <div className="ocean-card bg-blue-100/60 border px-4 py-3">
            <p className="text-sm text-gray-600">Today&apos;s multiplier</p>
            <p className="text-2xl font-bold text-blue-700">{multiplier.toFixed(2)}x</p>
          </div>
        </div>

        <div className="grid grid-cols-1 grid-md-3 gap-3">
          <div className="ocean-card border bg-white/85 p-4">
            <p className="text-sm text-gray-500">Active streak</p>
            <p className="text-3xl font-bold text-blue-700">{currentStreak} days</p>
            <p className="text-xs text-gray-500">Longest streak: {profile?.longestStreak || 0} days</p>
          </div>
          <div className="ocean-card border bg-white/85 p-4">
            <p className="text-sm text-gray-500">Daily XP base</p>
            <p className="text-3xl font-bold text-blue-700">
              {activeBoat?.dailyXp ? `${activeBoat.dailyXp} XP` : 'No active boat'}
            </p>
            <p className="text-xs text-gray-500">
              Active boat: {activeBoat ? activeBoat.boatType : 'None'}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Tip: move your boat every 24 hours or the next reward drops to 10% of this value.
            </p>
          </div>
          <div className="ocean-card border bg-white/85 p-4">
            <p className="text-sm text-gray-500">Last claim</p>
            <p className="text-3xl font-bold text-blue-700">
              {profile?.lastClaimDate ? dayjs(profile.lastClaimDate).fromNow() : '—'}
            </p>
            <p className="text-xs text-gray-500">
              Next reward {nextClaimText ? nextClaimText : 'is ready now'}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="ocean-card border-red-500/40 bg-red-50/80 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="ocean-card border-green-500/40 bg-green-100/70 text-green-700">
          {success}
        </div>
      )}

      <section className="ocean-card space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🎁 Collect your daily fishing XP
        </h2>
        <p className="text-sm text-gray-600">
          Keep your streak alive by claiming within 24 hours. On day seven the multiplier reaches 2x.
        </p>

        <button
          type="button"
          className="primary-button justify-center text-lg py-3"
          onClick={handleClaim}
          disabled={!claimState.canClaim || isClaiming}
        >
          {isClaiming ? 'Reeling in rewards...' : claimState.canClaim ? '🎣 Claim XP now' : 'On cooldown'}
        </button>

        {!claimState.canClaim && nextClaimText && (
          <p className="text-xs text-gray-500 text-center">
            Next claim {nextClaimText}.
          </p>
        )}
      </section>

      <section className="ocean-card space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📅 Seven-day streak calendar
        </h2>
        <div className="grid grid-cols-1 grid-md-3 gap-3">
          {streakRewards.map((reward) => {
            const isCompleted = streakPosition >= reward.day;
            const isActive = streakPosition === reward.day && claimState.canClaim;
            return (
              <div
                key={reward.day}
                className={`ocean-card border p-4 space-y-2 ${
                  isActive
                    ? 'border-blue-400 shadow-lg'
                    : isCompleted
                    ? 'border-green-300'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Day {reward.day}</span>
                  <span className="chip">{reward.multiplier.toFixed(1)}x</span>
                </div>
                <p className="text-xs text-gray-500">{reward.label}</p>
                <div className="flex items-center gap-2 text-sm">
                  {isCompleted ? (
                    <span role="img" aria-label="completed">
                      ✅
                    </span>
                  ) : (
                    <span role="img" aria-label="pending">
                      ⏳
                    </span>
                  )}
                  <span className="text-gray-600">{isCompleted ? 'Completed' : 'Pending'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}


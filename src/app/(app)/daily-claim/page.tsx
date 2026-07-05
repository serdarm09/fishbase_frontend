'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { BrowserProvider, Contract } from 'ethers';
import { useAuth } from '@/context/AuthContext';
import { gameApi } from '@/services/api';
import config from '@/lib/config';
import type { UserProfile } from '@/types';
import { Gift, Calendar, CheckCircle2, Clock, Anchor, Zap } from 'lucide-react';

dayjs.extend(relativeTime);

type ClaimState = {
  canClaim: boolean;
  nextClaimTime?: string;
  streakMultiplier?: number;
};

const streakRewards = [
  { day: 1, multiplier: 1.0, label: 'Starting Line',      emoji: '⚓' },
  { day: 2, multiplier: 1.1, label: 'Tailwind Boost',     emoji: '💨' },
  { day: 3, multiplier: 1.2, label: 'Caught the Current', emoji: '🌊' },
  { day: 4, multiplier: 1.3, label: 'Lucky Net',          emoji: '🎣' },
  { day: 5, multiplier: 1.4, label: 'Storm Resilience',   emoji: '⛈️' },
  { day: 6, multiplier: 1.6, label: 'Epic Catch',         emoji: '🐟' },
  { day: 7, multiplier: 2.0, label: 'Golden Tide',        emoji: '🏆' },
];

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const GAME_CONTROLLER_ADDRESS = config.blockchain.contracts.gameController;
const GAME_CONTROLLER_ABI = ['function claimDaily() external'];

const getEthereum = () =>
  (window as typeof window & { ethereum?: EthereumProvider }).ethereum;

const isConfiguredAddress = (address?: string) =>
  Boolean(address && !/^0x0{40}$/i.test(address));

export default function DailyClaimPage() {
  const { token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>({ canClaim: false });
  const [claimBurst, setClaimBurst] = useState(false);
  const [claimKey, setClaimKey] = useState(0);

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

  const sendClaimTransaction = async () => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error('Open FishBase in Base App or a wallet browser.');
    if (!isConfiguredAddress(GAME_CONTROLLER_ADDRESS)) {
      throw new Error('Game Controller contract address is missing.');
    }

    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
    } catch {
      // Base App and some wallets are already scoped to Base.
    }

    const provider = new BrowserProvider(ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const contract = new Contract(GAME_CONTROLLER_ADDRESS, GAME_CONTROLLER_ABI, signer);
    const tx = await contract.claimDaily();
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  };

  const handleClaim = async () => {
    if (!token) return;

    try {
      setIsClaiming(true);
      setError(null);
      setSuccess(null);

      setSuccess('Confirm the daily claim transaction in your wallet...');
      const claimTxHash = await sendClaimTransaction();
      setSuccess('Transaction confirmed. Syncing reward...');
      const result = await gameApi.claimDaily(token, { claimTxHash });
      const claim = result.claim;

      // Trigger burst animation
      setClaimBurst(true);
      setClaimKey((k) => k + 1);
      setTimeout(() => setClaimBurst(false), 700);

      setSuccess(
        `You earned ${claim.xpEarned} XP! New streak ${claim.newStreak} days, multiplier ${(claim.streakMultiplier || 1).toFixed(2)}x.`
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

  const currentReward = streakRewards.find((r) => r.day === streakPosition) ?? streakRewards[0];

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
    <section className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur border border-blue-100 rounded-2xl p-6 shadow-sm space-y-6 anim-float-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 flex items-center gap-3">
              Daily Reward Deck
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                7-day multiplier
              </span>
            </h1>
            <p className="text-gray-600 mt-2">
              Visit the deck every day, grow your streak, and double your fishing XP on Base.
            </p>
          </div>

          {/* Multiplier badge */}
          <div
            className={`bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 flex flex-col items-center justify-center min-w-[140px] ${
              claimBurst ? 'anim-claim-burst' : ''
            }`}
            key={claimKey}
          >
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Today's multiplier</p>
            <p className="text-4xl font-black text-blue-700 flex items-center gap-1">
              <Zap size={24} className={`text-amber-500 fill-amber-500 ${claimBurst ? 'anim-xp-pulse' : ''}`} />
              {multiplier.toFixed(2)}x
            </p>
          </div>
        </div>

        {/* ── Stat tiles ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm anim-pop-in anim-delay-1">
            <p className="text-sm font-semibold text-gray-500 mb-1">Active streak</p>
            <p className="text-3xl font-bold text-gray-800">{currentStreak} days</p>
            <p className="text-xs text-gray-400 mt-2">Longest streak: {profile?.longestStreak || 0} days</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm anim-pop-in anim-delay-2">
            <p className="text-sm font-semibold text-gray-500 mb-1">Daily XP base</p>
            <p className="text-3xl font-bold text-gray-800">
              {activeBoat?.dailyXp ? `${activeBoat.dailyXp} XP` : 'No boat'}
            </p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Anchor size={12} /> {activeBoat ? activeBoat.boatType : 'None active'}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm anim-pop-in anim-delay-3">
            <p className="text-sm font-semibold text-gray-500 mb-1">Last claim</p>
            <p className="text-3xl font-bold text-gray-800">
              {profile?.lastClaimDate ? dayjs(profile.lastClaimDate).fromNow(true) + ' ago' : '—'}
            </p>
            <p className="text-xs text-blue-600 font-medium mt-2">
              Next: {nextClaimText ? nextClaimText : 'Ready now'}
            </p>
          </div>
        </div>
      </header>

      {/* ── Error / Success ─────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 anim-float-in-up">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 anim-pop-in">
          <CheckCircle2 size={18} className="anim-check-draw" />
          <span className="anim-xp-pulse">{success}</span>
        </div>
      )}

      {/* ── Claim section ───────────────────────────────────────── */}
      <section className="bg-white/80 backdrop-blur border border-blue-100 rounded-2xl p-6 shadow-sm space-y-5 anim-float-in-up anim-delay-2">
        <div className="flex items-center gap-2 text-blue-900">
          <Gift size={24} className="text-blue-500" />
          <h2 className="text-xl font-bold">Collect your daily fishing XP</h2>
        </div>
        <p className="text-gray-600">
          Keep your streak alive by claiming within 24 hours. On day seven the multiplier reaches 2x.
        </p>

        <button
          type="button"
          className={`w-full md:w-auto primary-button ripple-host justify-center text-lg py-3 px-8 rounded-xl font-bold ${
            isClaiming ? 'anim-fish-catch' : ''
          }`}
          onClick={handleClaim}
          disabled={!claimState.canClaim || isClaiming}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {isClaiming ? (
            <span className="flex items-center gap-2">
              <span className="anim-bobber" aria-hidden="true">🎣</span>
              Reeling in rewards…
            </span>
          ) : claimState.canClaim ? (
            '🎁 Claim XP Now'
          ) : (
            '⏳ On Cooldown'
          )}
        </button>

        {!claimState.canClaim && nextClaimText && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5 anim-float-in-up">
            <Clock size={16} /> Next claim available {nextClaimText}.
          </p>
        )}
      </section>

      {/* ── Seven-day streak calendar ───────────────────────────── */}
      <section className="bg-white/80 backdrop-blur border border-blue-100 rounded-2xl p-6 shadow-sm space-y-6 anim-float-in-up anim-delay-3">
        <div className="flex items-center gap-2 text-blue-900">
          <Calendar size={24} className="text-blue-500" />
          <h2 className="text-xl font-bold">Seven-day streak calendar</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {streakRewards.map((reward, idx) => {
            const isCompleted = streakPosition > reward.day;
            const isCurrent  = streakPosition === reward.day;
            const isActive   = isCurrent && claimState.canClaim;
            const isGolden   = reward.day === 7;

            return (
              <div
                key={reward.day}
                className={`flex flex-col rounded-xl p-4 border transition-all anim-pop-in ${
                  isActive
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-md anim-streak-glow'
                    : isCompleted
                    ? 'border-green-200 bg-green-50/30'
                    : isCurrent
                    ? 'border-amber-300 bg-amber-50/30 shadow-sm'
                    : 'border-gray-100 bg-white opacity-70'
                } ${isGolden && (isCompleted || isCurrent) ? 'anim-streak-glow' : ''}`}
                style={{ animationDelay: `${0.05 + idx * 0.06}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isCompleted ? 'text-green-700' : isCurrent ? 'text-amber-700' : 'text-gray-700'}`}>
                    Day {reward.day}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {reward.multiplier.toFixed(1)}x
                  </span>
                </div>

                <span className="text-2xl mb-1" aria-hidden="true">{reward.emoji}</span>
                <p className="text-xs text-gray-500 font-medium leading-tight mb-3 flex-grow">
                  {reward.label}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-500 anim-check-draw" />
                      <span className="text-green-600">Done</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <span className="anim-bobber text-base" aria-hidden="true">⭐</span>
                      <span className="text-amber-600">Today</span>
                    </>
                  ) : (
                    <>
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-gray-500">Pending</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}

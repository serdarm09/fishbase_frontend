'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameApi, leaderboardApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

type LeaderboardEntry = {
  rank: number;
  username: string;
  displayName?: string;
  avatar?: string;
  fid?: number;
  highScore: number;
  bestReactionMs?: number | null;
  totalGames: number;
};

type Phase = 'idle' | 'waiting' | 'catch' | 'result';

const MIN_DELAY = 1200;
const MAX_DELAY = 3200;

const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98FB98', '#F0E68C', '#87CEEB',
];

const calculateScore = (reactionMs: number) => {
  const clamped = Math.max(0, reactionMs);
  const score = Math.max(0, 100 - Math.round(clamped / 5));
  return Math.min(100, score);
};

/** Adds a CSS ripple effect to a button on click */
function useRipple() {
  const ref = useRef<HTMLButtonElement>(null);

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-ring';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  };

  return { ref, addRipple };
}

export function FishingMiniGame() {
  const { token } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [xpAward, setXpAward] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [catchFlash, setCatchFlash] = useState(false);
  const [scoreKey, setScoreKey] = useState(0); // re-trigger anim on new result

  const signalTimeout = useRef<NodeJS.Timeout | null>(null);
  const signalStartTime = useRef<number | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const startRipple = useRipple();
  const catchRipple = useRipple();
  const resetRipple = useRipple();

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoadingLeaderboard(true);
      const response = await leaderboardApi.getFishingLeaderboard(token ?? undefined);
      if (response.fishingLeaderboard) {
        setLeaderboard(response.fishingLeaderboard.entries);
        setUserRank(response.fishingLeaderboard.userRank);
        setHighScore(response.fishingLeaderboard.userHighScore);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLeaderboard();
    return () => {
      if (signalTimeout.current) clearTimeout(signalTimeout.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [fetchLeaderboard]);

  const resetGame = () => {
    setPhase('idle');
    setReactionMs(null);
    setScore(null);
    setXpAward(null);
    setError(null);
    setCountdownProgress(0);
    setShowConfetti(false);
    setCatchFlash(false);
    if (signalTimeout.current) clearTimeout(signalTimeout.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const startGame = (e: React.MouseEvent<HTMLButtonElement>) => {
    startRipple.addRipple(e);
    if (!token) {
      setError('Connect a Base wallet to play the mini game.');
      return;
    }
    resetGame();
    setPhase('waiting');

    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    const start = Date.now();

    countdownInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setCountdownProgress(Math.min(100, Math.round((elapsed / delay) * 100)));
    }, 50);

    signalTimeout.current = setTimeout(() => {
      setPhase('catch');
      signalStartTime.current = Date.now();
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      setCountdownProgress(100);
    }, delay);
  };

  const handleCatch = async (e: React.MouseEvent<HTMLButtonElement>) => {
    catchRipple.addRipple(e);

    if (!token) {
      setError('Connect a Base wallet to play the mini game.');
      return;
    }

    if (phase !== 'catch') {
      setError('Too early! Wait for the fishing line to tighten.');
      setPhase('result');
      setScore(0);
      setReactionMs(null);
      setXpAward(0);
      return;
    }

    if (!signalStartTime.current) {
      setError('Unexpected timing error. Please try again.');
      return;
    }

    const reaction = Date.now() - signalStartTime.current;
    const computedScore = calculateScore(reaction);

    setReactionMs(reaction);
    setScore(computedScore);
    setPhase('result');
    setError(null);
    setScoreKey((k) => k + 1);

    // Trigger screen flash
    setCatchFlash(true);
    setTimeout(() => setCatchFlash(false), 600);

    // Golden catch confetti
    if (computedScore >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
    }

    setIsSubmitting(true);
    try {
      const response = await gameApi.submitFishingScore(token, {
        score: computedScore,
        reactionMs: reaction,
      });
      setXpAward(response.result.xpAward);
      setHighScore(response.result.highScore);
      setUserRank(response.result.rank);
      await fetchLeaderboard();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leaderboardCaption = useMemo(() => {
    if (isLoadingLeaderboard) return 'Loading top anglers...';
    if (!leaderboard.length) return 'Be the first captain to set a record!';
    return 'Top captains by perfect timing';
  }, [isLoadingLeaderboard, leaderboard.length]);

  const isGolden = score !== null && score >= 80;

  return (
    <section
      id="fishing-game"
      className={`ocean-card space-y-5 relative ${catchFlash ? 'anim-catch-flash' : ''}`}
    >
      {/* ── Confetti overlay ───────────────────────────────── */}
      {showConfetti && (
        <div className="confetti-wrap" aria-hidden="true">
          {CONFETTI_COLORS.flatMap((color, ci) =>
            Array.from({ length: 3 }, (_, pi) => (
              <span
                key={`${ci}-${pi}`}
                className="confetti-piece"
                style={{
                  left: `${10 + ci * 9 + pi * 3}%`,
                  backgroundColor: color,
                  animationDelay: `${(ci * 0.04 + pi * 0.08)}s`,
                  borderRadius: pi % 2 === 0 ? '50%' : '2px',
                  width: `${6 + pi * 2}px`,
                  height: `${6 + pi * 2}px`,
                }}
              />
            ))
          )}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🎣 Quick Catch Challenge
          </h2>
          <p className="text-sm text-gray-600">
            Wait for the signal and pull the fishing line at the perfect moment to earn XP and climb the ranks.
          </p>
        </div>
        <button
          type="button"
          ref={startRipple.ref}
          onClick={startGame}
          className="primary-button ripple-host"
          disabled={phase === 'waiting' || phase === 'catch'}
        >
          {phase === 'waiting' || phase === 'catch' ? 'Get Ready...' : 'Start a Round'}
        </button>
      </header>

      <div className="bg-white/80 border border-blue-200 rounded-xl p-5 flex flex-col md:flex-row gap-5">
        <div className="flex-1 space-y-4">
          {/* ── Status box ─────────────────────────────────── */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 space-y-3">
            {/* Phase indicator */}
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              {phase === 'idle' && (
                <span>🎯 Press start and watch the bobber.</span>
              )}
              {phase === 'waiting' && (
                <span>
                  <span className="anim-bobber" aria-hidden="true">🪝</span>
                  {' '}Hold steady… the fish is circling.
                </span>
              )}
              {phase === 'catch' && (
                <span className="text-green-700 font-bold animate-pulse">
                  🐟 Pull now! Tap the button to reel it in!
                </span>
              )}
              {phase === 'result' && score !== null && score >= 80 && (
                <span className="text-amber-600 font-bold">
                  ✨ Amazing timing! That was a golden catch.
                </span>
              )}
              {phase === 'result' && score !== null && score < 80 && score > 0 && (
                <span>🎣 Nice catch! Practice makes legendary captains.</span>
              )}
              {phase === 'result' && score === 0 && (
                <span className="text-red-600">⚠️ Too soon! Wait for the splash next time.</span>
              )}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-white rounded-full h-2.5 border border-blue-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  phase === 'catch'
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-sky-300 to-sky-500'
                }`}
                style={{ width: `${countdownProgress}%` }}
              />
            </div>
          </div>

          {/* ── Action buttons ─────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              ref={catchRipple.ref}
              className={`btn-fish flex-1 justify-center ripple-host ${
                phase === 'catch' ? 'anim-catch-pulse' : ''
              }`}
              onClick={handleCatch}
              disabled={phase !== 'catch' || isSubmitting}
            >
              {phase === 'catch' ? '🎣 Pull the Line!' : 'Wait for the Splash'}
            </button>
            <button
              type="button"
              ref={resetRipple.ref}
              className="secondary-button flex-1 justify-center ripple-host"
              onClick={(e) => { resetRipple.addRipple(e); resetGame(); }}
            >
              Reset
            </button>
          </div>

          {/* ── Error ──────────────────────────────────────── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 anim-float-in-up">
              {error}
            </div>
          )}

          {/* ── Score cards ────────────────────────────────── */}
          {phase === 'result' && score !== null && (
            <div key={scoreKey} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="ocean-card border bg-white/90 p-3 text-center anim-score-reveal anim-delay-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Score</p>
                <p className={`text-2xl font-bold text-blue-700 ${isGolden ? 'anim-xp-pulse' : ''}`}>
                  {isGolden ? '⭐ ' : ''}{score}
                </p>
              </div>
              <div className="ocean-card border bg-white/90 p-3 text-center anim-score-reveal anim-delay-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reaction</p>
                <p className="text-2xl font-bold text-blue-700">
                  {reactionMs !== null ? `${reactionMs} ms` : '—'}
                </p>
              </div>
              <div className="ocean-card border bg-white/90 p-3 text-center anim-score-reveal anim-delay-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">XP Earned</p>
                <p className={`text-2xl font-bold text-blue-700 ${xpAward ? 'anim-xp-pulse' : ''}`}>
                  {xpAward !== null ? `+${xpAward} XP` : isSubmitting ? '...' : '—'}
                </p>
              </div>
            </div>
          )}

          {highScore !== null && (
            <p className="text-xs text-gray-500 anim-float-in-up">
              Personal best: <span className="font-semibold text-blue-700">{highScore}</span>
              {userRank ? ` • Current rank #${userRank}` : ''}
            </p>
          )}
        </div>

        {/* ── Leaderboard sidebar ─────────────────────────── */}
        <aside className="w-full md:w-72 space-y-3">
          <div className="ocean-card border bg-white/90 p-4 h-full flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🏆 Fishing Leaderboard
              </h3>
              <p className="text-xs text-gray-500">{leaderboardCaption}</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {leaderboard.map((entry, idx) => (
                <div
                  key={`${entry.fid ?? entry.username}-${entry.rank}`}
                  className={`flex items-center justify-between bg-blue-50/60 border rounded-lg px-3 py-2 anim-lb-row ${
                    entry.rank === 1
                      ? 'border-yellow-300 bg-yellow-50/60'
                      : entry.rank === 2
                      ? 'border-gray-300 bg-gray-50/60'
                      : entry.rank === 3
                      ? 'border-amber-300 bg-amber-50/60'
                      : 'border-blue-100'
                  }`}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-700 min-w-[28px]">
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700">
                        {entry.displayName || entry.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        High score {entry.highScore}{' '}
                        {entry.bestReactionMs ? `• Best ${entry.bestReactionMs} ms` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{entry.totalGames} games</span>
                </div>
              ))}

              {!leaderboard.length && !isLoadingLeaderboard && (
                <div className="text-sm text-gray-500 anim-float-in-up">
                  No fishing champions yet. Be the first to cast a perfect line!
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

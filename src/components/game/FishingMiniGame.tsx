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

const calculateScore = (reactionMs: number) => {
  const clamped = Math.max(0, reactionMs);
  const score = Math.max(0, 100 - Math.round(clamped / 5));
  return Math.min(100, score);
};

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

  const signalTimeout = useRef<NodeJS.Timeout | null>(null);
  const signalStartTime = useRef<number | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

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
      if (signalTimeout.current) {
        clearTimeout(signalTimeout.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [fetchLeaderboard]);

  const resetGame = () => {
    setPhase('idle');
    setReactionMs(null);
    setScore(null);
    setXpAward(null);
    setError(null);
    setCountdownProgress(0);
    if (signalTimeout.current) {
      clearTimeout(signalTimeout.current);
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
  };

  const startGame = () => {
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
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      setCountdownProgress(100);
    }, delay);
  };

  const handleCatch = async () => {
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

  return (
    <section id="fishing-game" className="ocean-card space-y-5">
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
          onClick={startGame}
          className="primary-button"
          disabled={phase === 'waiting' || phase === 'catch'}
        >
          {phase === 'waiting' || phase === 'catch' ? 'Get Ready...' : 'Start a Round'}
        </button>
      </header>

      <div className="bg-white/80 border border-blue-200 rounded-xl p-5 flex flex-col md:flex-row gap-5">
        <div className="flex-1 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800">
              {phase === 'idle' && 'Press start and watch the bobber.'}
              {phase === 'waiting' && 'Hold steady... the fish is circling.'}
              {phase === 'catch' && 'Pull now! Tap the button to reel it in!'}
              {phase === 'result' && score !== null && score >= 80 && 'Amazing timing! That was a golden catch.'}
              {phase === 'result' && score !== null && score < 80 && score > 0 && 'Nice catch! Practice makes legendary captains.'}
              {phase === 'result' && score === 0 && 'Too soon! Wait for the splash next time.'}
            </p>
            <div className="w-full bg-white rounded-full h-2 border border-blue-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-300 to-sky-500 transition-all duration-100"
                style={{ width: `${countdownProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="btn-fish flex-1 justify-center"
              onClick={handleCatch}
              disabled={phase !== 'catch' || isSubmitting}
            >
              {phase === 'catch' ? 'Pull the Line!' : 'Wait for the Splash'}
            </button>
            <button
              type="button"
              className="secondary-button flex-1 justify-center"
              onClick={resetGame}
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {phase === 'result' && score !== null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="ocean-card border bg-white/90 p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Score</p>
                <p className="text-2xl font-bold text-blue-700">{score}</p>
              </div>
              <div className="ocean-card border bg-white/90 p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reaction</p>
                <p className="text-2xl font-bold text-blue-700">
                  {reactionMs !== null ? `${reactionMs} ms` : '—'}
                </p>
              </div>
              <div className="ocean-card border bg-white/90 p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">XP Earned</p>
                <p className="text-2xl font-bold text-blue-700">
                  {xpAward !== null ? `${xpAward} XP` : '—'}
                </p>
              </div>
            </div>
          )}

          {highScore !== null && (
            <p className="text-xs text-gray-500">
              Personal best score: <span className="font-semibold text-blue-700">{highScore}</span>
              {userRank ? ` • Current rank #${userRank}` : ''}
            </p>
          )}
        </div>

        <aside className="w-full md:w-72 space-y-3">
          <div className="ocean-card border bg-white/90 p-4 h-full flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🏆 Fishing Leaderboard
              </h3>
              <p className="text-xs text-gray-500">{leaderboardCaption}</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {leaderboard.map((entry) => (
                <div
                  key={`${entry.fid ?? entry.username}-${entry.rank}`}
                  className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2"
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
                        {entry.bestReactionMs
                          ? `• Best ${entry.bestReactionMs} ms`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {entry.totalGames} games
                  </span>
                </div>
              ))}

              {!leaderboard.length && !isLoadingLeaderboard && (
                <div className="text-sm text-gray-500">
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


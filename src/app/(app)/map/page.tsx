'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { useAuth } from '@/context/AuthContext';
import GameMap from '@/components/GameMap';
import { gameApi } from '@/services/api';
import type { BoatPlacement, BoatType, BoostInfo } from '@/types';
import BoatSVG, { BOAT_XP, boatLabel, type BoatTypeName } from '@/components/boats/BoatSVG';
import { Zap, RefreshCw, Gift, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// ─── helpers ────────────────────────────────────────────────────────────────

type MapBoatResponse = {
  id: string;
  owner: string;
  ownerUsername: string;
  x: number;
  y: number;
  boatType: BoatType | string;
  boostLevel?: string;
  boostImage?: string | null;
  xp?: number;
  placedAt?: string;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const getEthereum = () =>
  (window as typeof window & { ethereum?: EthereumProvider }).ethereum;

const convertBoat = (b: MapBoatResponse): BoatPlacement => ({
  id:            b.id,
  owner:         b.owner,
  ownerUsername: b.ownerUsername,
  x:             b.x,
  y:             b.y,
  boatType:      b.boatType as BoatType,
  boostLevel:    (b.boostLevel as any) || 'NONE',
  boostImage:    b.boostImage || null,
  xp:            b.xp || 0,
  placedAt:      b.placedAt || new Date().toISOString(),
});

/** Seconds until a future ISO timestamp, or 0 if past. */
const secsUntil = (iso: string) =>
  Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));

/** Accumulated XP fraction (0‒1) based on seconds elapsed since lastClaimDate. */
const accruedFraction = (lastClaimIso?: string) => {
  if (!lastClaimIso) return 0;
  const elapsed = (Date.now() - new Date(lastClaimIso).getTime()) / 1000;
  return Math.min(1, elapsed / 86400); // 86400 s = 24 h
};

// ─── component ──────────────────────────────────────────────────────────────

export default function MapPage() {
  const { token, user } = useAuth();

  const [boats, setBoats]           = useState<BoatPlacement[]>([]);
  const [playerBoat, setPlayerBoat] = useState<BoatPlacement | null>(null);
  const [playerBoost, setPlayerBoost] = useState<BoostInfo | null>(null);
  const [activeBoatInfo, setActiveBoatInfo] = useState<{
    boatType: string;
    dailyXp: number;
    isPlaced: boolean;
    lastClaimDate?: string;
    canClaim: boolean;
    nextClaimTime?: string;
    currentStreak: number;
  } | null>(null);

  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isClaiming, setIsClaiming]           = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [successMessage, setSuccessMessage]   = useState<string | null>(null);

  // Countdown / live XP ticker
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Data fetch ───────────────────────────────────────────────────────────

  const fetchMap = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const [mapRes, profileRes] = await Promise.all([
        gameApi.getMap(token),
        gameApi.getProfile(token),
      ]);

      setBoats((mapRes.map.boats as MapBoatResponse[]).map(convertBoat));

      const profile    = profileRes.profile;
      const activeBoat = profile.activeBoat;
      setPlayerBoost(profile.boost || null);

      const lastClaim     = profile.lastClaimDate;
      const canClaim      = profile.canClaimDaily ?? false;
      const nextClaimTime = lastClaim && !canClaim
        ? new Date(new Date(lastClaim).getTime() + 86_400_000).toISOString()
        : undefined;

      if (activeBoat && typeof activeBoat.mapX === 'number') {
        setPlayerBoat({
          id:            `player-${activeBoat.tokenId}`,
          owner:         profile.id,
          ownerUsername: profile.username,
          x:             activeBoat.mapX,
          y:             activeBoat.mapY,
          boatType:      activeBoat.boatType,
          boostLevel:    (profile.boost?.level as any) || 'NONE',
          boostImage:    profile.boost?.image || null,
          xp:            activeBoat.dailyXp,
          placedAt:      activeBoat.lastMoved || new Date().toISOString(),
        });
        setActiveBoatInfo({
          boatType:       activeBoat.boatType,
          dailyXp:        activeBoat.dailyXp ?? (BOAT_XP[(activeBoat.boatType as string).toUpperCase()] || 10),
          isPlaced:       true,
          lastClaimDate:  lastClaim,
          canClaim,
          nextClaimTime,
          currentStreak:  profile.currentStreak ?? 0,
        });
      } else if (activeBoat) {
        setPlayerBoat(null);
        setActiveBoatInfo({
          boatType:      activeBoat.boatType,
          dailyXp:       activeBoat.dailyXp ?? 10,
          isPlaced:      false,
          lastClaimDate: lastClaim,
          canClaim:      false,
          currentStreak: profile.currentStreak ?? 0,
        });
      } else {
        setPlayerBoat(null);
        setActiveBoatInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load map data.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMap(); }, [fetchMap]);

  // ── Placement ────────────────────────────────────────────────────────────

  const sendPlacementTransaction = async () => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error('Open FishBase in Base App or a wallet browser.');

    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
    } catch { /* already on Base */ }

    const provider = new BrowserProvider(ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({ to: await signer.getAddress(), value: 0 });
    return tx.hash;
  };

  const handlePlacement = async (x: number, y: number, lat?: number, lng?: number) => {
    if (!token) return;
    setIsActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      setSuccessMessage('Confirm the 0 ETH Base transaction in your wallet…');
      const txHash = await sendPlacementTransaction();
      setSuccessMessage('Transaction sent — saving position…');

      if (playerBoat) {
        await gameApi.moveBoat(token, { x, y, lat, lng, placementTxHash: txHash });
        setSuccessMessage(`Boat moved to (${x}, ${y}). XP starts accruing now!`);
      } else {
        await gameApi.placeBoat(token, { x, y, lat, lng, placementTxHash: txHash });
        setSuccessMessage(`Boat placed at (${x}, ${y}). XP starts accruing now!`);
      }

      await fetchMap();
      setIsPlacementMode(false);
    } catch (err: any) {
      setError(err.message || 'Unable to position your boat.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Claim ────────────────────────────────────────────────────────────────

  const handleClaim = async () => {
    if (!token || !activeBoatInfo?.canClaim) return;
    setIsClaiming(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await gameApi.claimDaily(token);
      const xpEarned = (res as any)?.xpEarned ?? (res as any)?.claim?.xpEarned ?? activeBoatInfo.dailyXp;
      setSuccessMessage(`+${xpEarned} XP claimed! Streak: ${(activeBoatInfo.currentStreak ?? 0) + 1} days 🎉`);
      await fetchMap();
    } catch (err: any) {
      setError(err.message || 'Claim failed. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // ── Derived UI values ────────────────────────────────────────────────────

  const canTogglePlacement = useMemo(() => !!activeBoatInfo, [activeBoatInfo]);

  /** Live accumulated XP (updates every second via tick) */
  const liveAccruedXp = useMemo(() => {
    if (!activeBoatInfo?.isPlaced || !activeBoatInfo.lastClaimDate) return 0;
    if (activeBoatInfo.canClaim) return activeBoatInfo.dailyXp;
    const frac = accruedFraction(activeBoatInfo.lastClaimDate);
    return Math.floor(frac * activeBoatInfo.dailyXp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoatInfo, tick]);

  /** Countdown string (h:mm:ss) */
  const countdown = useMemo(() => {
    if (!activeBoatInfo?.nextClaimTime) return null;
    const s = secsUntil(activeBoatInfo.nextClaimTime);
    if (s <= 0) return null;
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}h ${String(m).padStart(2, '0')}m ${String(ss).padStart(2, '0')}s`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoatInfo, tick]);

  const bKey = (activeBoatInfo?.boatType ?? '').toUpperCase() as BoatTypeName;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <header className="ocean-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-heading">
              Sea Map
              <span className="badge">Base</span>
            </h1>
            <p className="page-subtitle">
              Click the sea to drop anchor, wait 24 h, then claim your XP.
            </p>
          </div>
          <button type="button" onClick={fetchMap} className="secondary-button flex items-center gap-2" disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* ── XP accumulation panel ────────────────────────────────── */}
        {activeBoatInfo ? (
          <div
            style={{
              background:    activeBoatInfo.canClaim ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : 'rgba(255,255,255,0.85)',
              border:        `1.5px solid ${activeBoatInfo.canClaim ? '#86EFAC' : '#BFDBFE'}`,
              borderRadius:  16,
              padding:       '1rem 1.25rem',
              display:       'flex',
              flexWrap:      'wrap',
              alignItems:    'center',
              gap:           '1rem',
              justifyContent:'space-between',
            }}
          >
            {/* Left: boat + XP info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <BoatSVG type={bKey} size={44} />
              <div>
                <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  {boatLabel(bKey)}
                  {activeBoatInfo.isPlaced
                    ? <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#64748B', marginLeft: 6 }}>deployed on map</span>
                    : <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#F97316', marginLeft: 6 }}>not placed yet</span>}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={12} color="#F59E0B" />
                  {activeBoatInfo.dailyXp} XP / 24 h &nbsp;·&nbsp; Streak: {activeBoatInfo.currentStreak} days
                </p>
              </div>
            </div>

            {/* Center: live XP gauge */}
            {activeBoatInfo.isPlaced && (
              <div style={{ flex: 1, minWidth: 140, maxWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: 4 }}>
                  <span>Accumulated XP</span>
                  <span style={{ fontWeight: 700, color: activeBoatInfo.canClaim ? '#16A34A' : '#1D4ED8' }}>
                    {liveAccruedXp} / {activeBoatInfo.dailyXp}
                  </span>
                </div>
                <div style={{ background: '#E2E8F0', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height:     '100%',
                    borderRadius: 999,
                    background: activeBoatInfo.canClaim
                      ? 'linear-gradient(90deg,#22C55E,#16A34A)'
                      : 'linear-gradient(90deg,#60A5FA,#1D4ED8)',
                    width: `${Math.min(100, (liveAccruedXp / activeBoatInfo.dailyXp) * 100)}%`,
                    transition: 'width 1s linear',
                  }} />
                </div>
                {countdown && (
                  <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} /> Ready in {countdown}
                  </p>
                )}
              </div>
            )}

            {/* Right: claim button */}
            {activeBoatInfo.isPlaced ? (
              activeBoatInfo.canClaim ? (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={isClaiming}
                  style={{
                    background:   '#16A34A',
                    color:        '#fff',
                    border:       'none',
                    borderRadius: 999,
                    padding:      '0.65rem 1.4rem',
                    fontWeight:   700,
                    fontSize:     '0.9rem',
                    cursor:       isClaiming ? 'not-allowed' : 'pointer',
                    opacity:      isClaiming ? 0.7 : 1,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '0.4rem',
                    animation:    isClaiming ? 'none' : 'pulse 2s infinite',
                  }}
                >
                  <Gift size={16} />
                  {isClaiming ? 'Claiming…' : `Claim ${activeBoatInfo.dailyXp} XP`}
                </button>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} color="#94A3B8" />
                  Accruing XP…
                </div>
              )
            ) : (
              <Link href="/nft-mint" className="secondary-button text-sm">
                Go to Hangar
              </Link>
            )}
          </div>
        ) : (
          <div className="empty-state text-sm">
            No active NFT boat.{' '}
            <Link href="/nft-mint" style={{ color: 'var(--ocean-500)', fontWeight: 600 }}>
              Mint your first vessel →
            </Link>
          </div>
        )}
      </header>

      {/* ── Alerts ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '0.85rem 1.1rem', color: '#DC2626', fontWeight: 600, fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMessage && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '0.85rem 1.1rem', color: '#16A34A', fontWeight: 600, fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* ── Map ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="ocean-card text-sm text-gray-600">
          Loading map <span className="loading-dots" />
        </div>
      ) : (
        <GameMap
          boats={boats}
          playerBoat={playerBoat}
          playerBoost={playerBoost}
          isPlacementMode={isPlacementMode}
          isLoading={isActionLoading}
          canTogglePlacement={canTogglePlacement}
          onTogglePlacement={() => setIsPlacementMode((v) => !v)}
          onCellClick={handlePlacement}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(22,163,74,0); }
        }
      `}</style>
    </section>
  );
}

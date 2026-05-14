'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import GameMap from '@/components/GameMap';
import { gameApi } from '@/services/api';
import type { BoatPlacement, BoatType, BoostInfo } from '@/types';

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

const convertBoat = (boat: MapBoatResponse): BoatPlacement => ({
  id: boat.id,
  owner: boat.owner,
  ownerUsername: boat.ownerUsername,
  x: boat.x,
  y: boat.y,
  boatType: boat.boatType as BoatType,
  boostLevel: (boat.boostLevel as any) || 'NONE',
  boostImage: boat.boostImage || null,
  xp: boat.xp || 0,
  placedAt: boat.placedAt || new Date().toISOString(),
});

export default function MapPage() {
  const { token, user } = useAuth();
  const [boats, setBoats] = useState<BoatPlacement[]>([]);
  const [playerBoat, setPlayerBoat] = useState<BoatPlacement | null>(null);
  const [playerBoost, setPlayerBoost] = useState<BoostInfo | null>(null);
  const [activeBoatInfo, setActiveBoatInfo] = useState<{ boatType: string; dailyXp?: number; isPlaced: boolean } | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMap = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const [mapRes, profileRes] = await Promise.all([gameApi.getMap(token), gameApi.getProfile(token)]);

      const mapBoats = (mapRes.map.boats as MapBoatResponse[]).map(convertBoat);
      setBoats(mapBoats);

      const profile = profileRes.profile;
      const activeBoat = profile.activeBoat;
      setPlayerBoost(profile.boost || null);

      if (activeBoat && typeof activeBoat.mapX === 'number' && typeof activeBoat.mapY === 'number') {
        setPlayerBoat({
          id: `player-${activeBoat.tokenId}`,
          owner: profile.id,
          ownerUsername: profile.username,
          x: activeBoat.mapX,
          y: activeBoat.mapY,
          boatType: activeBoat.boatType,
          boostLevel: (profile.boost?.level as any) || 'NONE',
          boostImage: profile.boost?.image || null,
          xp: activeBoat.dailyXp,
          placedAt: activeBoat.lastMoved || new Date().toISOString(),
        });
        setActiveBoatInfo({
          boatType: activeBoat.boatType,
          dailyXp: activeBoat.dailyXp,
          isPlaced: true,
        });
      } else if (activeBoat) {
        setPlayerBoat(null);
        setActiveBoatInfo({
          boatType: activeBoat.boatType,
          dailyXp: activeBoat.dailyXp,
          isPlaced: false,
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

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  const handlePlacement = async (x: number, y: number) => {
    if (!token) return;

    setIsActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (playerBoat) {
        await gameApi.moveBoat(token, { x, y });
        setSuccessMessage(`Your boat was moved to (${x}, ${y}).`);
      } else {
        await gameApi.placeBoat(token, { x, y });
        setSuccessMessage(`Your boat was placed at (${x}, ${y}).`);
      }
      await fetchMap();
      setIsPlacementMode(false);
    } catch (err: any) {
      setError(err.message || 'Unable to position your boat.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const canTogglePlacement = useMemo(() => {
    if (!activeBoatInfo) return false;
    return true;
  }, [activeBoatInfo]);

  return (
    <section className="space-y-6">
      <header className="ocean-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-heading">
              Sea Bridge
              <span className="badge">Base</span>
            </h1>
            <p className="page-subtitle">
              Launch your boat, avoid XP decay, and uncover the richest fishing routes with daily moves.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchMap}
            className="secondary-button"
            disabled={isLoading}
          >
            🔄 Refresh Map
          </button>
        </div>

        {activeBoatInfo ? (
          <div className="bg-white/80 border border-blue-200 rounded-lg px-4 py-3 flex flex-wrap gap-3 justify-between">
            <div>
              <p className="font-semibold text-gray-700 flex items-center gap-2">
                🚢 Active Boat: {activeBoatInfo.boatType}
              </p>
              <p className="text-xs text-gray-500">
                Daily XP: {activeBoatInfo.dailyXp ?? '—'} | {activeBoatInfo.isPlaced ? 'Deployed on the map' : 'Waiting to be deployed'}
              </p>
            </div>
            <div className="chip">Placement fee: 0.001 ETH</div>
          </div>
        ) : (
          <div className="empty-state">
            You do not have an active NFT boat yet. Visit the NFT hangar to mint your first vessel.
          </div>
        )}
      </header>

      {error && (
        <div className="ocean-card border-red-500/50 bg-red-50/80 text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="ocean-card border-green-500/40 bg-green-100/60 text-green-700">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="ocean-card text-sm text-gray-600">
          Loading map data <span className="loading-dots" />
        </div>
      ) : (
        <GameMap
          boats={boats}
          playerBoat={playerBoat}
          playerBoost={playerBoost}
          isPlacementMode={isPlacementMode}
          isLoading={isActionLoading}
          canTogglePlacement={canTogglePlacement}
          onTogglePlacement={() => setIsPlacementMode((value) => !value)}
          onCellClick={handlePlacement}
        />
      )}
    </section>
  );
}


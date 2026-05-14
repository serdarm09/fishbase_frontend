'use client';

import React from 'react';
import Image from 'next/image';
import Map from './Map';
import { BoatPlacement, BoostInfo } from '@/types';

interface GameMapProps {
  boats: BoatPlacement[];
  playerBoat?: BoatPlacement | null;
  playerBoost?: BoostInfo | null;
  isPlacementMode?: boolean;
  isLoading?: boolean;
  canTogglePlacement?: boolean;
  onTogglePlacement?: () => void;
  onCellClick?: (x: number, y: number) => void | Promise<void>;
}

const GameMap: React.FC<GameMapProps> = ({
  boats,
  playerBoat,
  playerBoost,
  isPlacementMode = false,
  isLoading = false,
  canTogglePlacement = true,
  onTogglePlacement,
  onCellClick,
}) => {
  const statusMessage = playerBoat
    ? `Your boat currently floats at (${playerBoat.x}, ${playerBoat.y}). Move every day to keep full XP.`
    : 'Drop anchor on open sea to start earning fishing XP.';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="ocean-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              FishBase Live Sea Map
            </h1>
            <p className="text-gray-600 text-sm">{statusMessage}</p>
          </div>

          {canTogglePlacement && (
            <button
              onClick={onTogglePlacement}
              disabled={isLoading}
              className={`${isPlacementMode ? 'btn-fish' : 'btn-ocean'} disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
            >
              {isLoading
                ? 'Working...'
                : isPlacementMode
                  ? 'Cancel'
                  : playerBoat
                    ? 'Move Boat'
                    : 'Place Boat'}
            </button>
          )}
        </div>
      </div>

      <Map
        gridSize={100}
        boats={boats}
        playerBoat={playerBoat}
        onCellClick={(x, y) => {
          if (!isPlacementMode || isLoading) return;
          onCellClick?.(x, y);
        }}
        isPlacementMode={isPlacementMode}
      />

      <div className="ocean-card bg-blue-50/70 border space-y-2">
        <p className="text-blue-800 text-sm">
          Shift your boat at least once every 24 hours. Waiting longer reduces that day&apos;s XP to
          10%. Boats can only be placed on open sea; white land areas are locked.
        </p>
        {playerBoost && playerBoost.level !== 'NONE' && playerBoost.image && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Image src={playerBoost.image} alt="Active boost" width={36} height={36} />
            <span>
              {playerBoost.name || 'Active boost'} grants an extra{' '}
              {Math.round(playerBoost.multiplier * 100)}% XP while you cruise.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameMap;

'use client';

import React from 'react';
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
  onCellClick?: (x: number, y: number, lat?: number, lng?: number) => void | Promise<void>;
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
  return (
    <div className="w-full">
      <Map
        gridSize={100}
        boats={boats}
        playerBoat={playerBoat}
        playerBoost={playerBoost}
        isPlacementMode={isPlacementMode}
        isLoading={isLoading}
        canTogglePlacement={canTogglePlacement}
        onTogglePlacement={onTogglePlacement}
        onCellClick={(x, y, lat, lng) => {
          if (!isPlacementMode || isLoading) return;
          onCellClick?.(x, y, lat, lng);
        }}
      />
    </div>
  );
};

export default GameMap;

'use client';

import React, { useMemo, useState } from 'react';
import { BoatPlacement } from '@/types';

interface MapProps {
  gridSize?: number;
  boats?: BoatPlacement[];
  onCellClick?: (x: number, y: number) => void;
  playerBoat?: BoatPlacement | null;
  isPlacementMode?: boolean;
}

const CELL_SIZE = 16;
const BORDER_COLOR = 'rgba(31, 122, 224, 0.12)';

const boatIcon = (type: string) => {
  switch (type) {
    case 'MEGASHIP':
      return '🛳️';
    case 'TRAWLER':
      return '🚢';
    case 'YACHT':
      return '🛥️';
    case 'SAILBOAT':
      return '⛵';
    default:
      return '🚣';
  }
};

const SeaMap: React.FC<MapProps> = ({
  gridSize = 100,
  boats = [],
  onCellClick,
  playerBoat,
  isPlacementMode = false,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const boatLookup = useMemo(() => {
    const lookup = new globalThis.Map<string, BoatPlacement>();
    boats.forEach((boat) => lookup.set(`${boat.x}-${boat.y}`, boat));
    return lookup;
  }, [boats]);

  const isWaterCell = (x: number, y: number): boolean => {
    const margin = Math.floor(gridSize * 0.1);
    return x >= margin && x < gridSize - margin && y >= margin && y < gridSize - margin;
  };

  const handleCellClick = (x: number, y: number) => {
    if (!isPlacementMode) return;
    if (!isWaterCell(x, y)) return;
    if (boatLookup.has(`${x}-${y}`)) return;
    onCellClick?.(x, y);
  };

  const renderCell = (x: number, y: number) => {
    const boat = boatLookup.get(`${x}-${y}`);
    const isPlayerBoat = playerBoat?.x === x && playerBoat?.y === y;
    const water = isWaterCell(x, y);
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

    const background = (() => {
      if (boat) {
        return isPlayerBoat ? 'linear-gradient(135deg, #B2F5EA, #5EEAD4)' : 'linear-gradient(135deg, #A5D8FF, #74C0FC)';
      }
      if (!water) {
        return 'rgba(255,255,255,0.85)';
      }
      if (isPlacementMode && isHovered) {
        return 'linear-gradient(135deg, rgba(122, 215, 255, 0.8), rgba(58, 142, 230, 0.8))';
      }
      return 'rgba(180, 225, 255, 0.45)';
    })();

    const cursor = boat || !water ? 'not-allowed' : 'pointer';

    return (
      <div
        key={`${x}-${y}`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          border: `1px solid ${BORDER_COLOR}`,
          background,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          cursor,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: boat ? '0 0 6px rgba(31, 122, 224, 0.35)' : undefined,
          overflow: 'hidden',
        }}
        onClick={() => handleCellClick(x, y)}
        onMouseEnter={() => setHoveredCell({ x, y })}
        onMouseLeave={() => setHoveredCell(null)}
        title={
          boat
            ? `${boat.ownerUsername} • ${boat.boostLevel !== 'NONE' ? 'Boosted' : 'Standard'} (${boat.boatType})`
            : water
            ? `Ocean (${x}, ${y})`
            : `Land (${x}, ${y})`
        }
      >
        {boat && (
          boat.boostImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={boat.boostImage}
              alt="boost"
              style={{ width: CELL_SIZE - 4, height: CELL_SIZE - 4, objectFit: 'cover' }}
            />
          ) : (
            <span className="select-none">{boatIcon(boat.boatType)}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-white/70 border border-blue-200 rounded-2xl p-4 shadow-xl">
      <div
        className="grid map-grid border border-blue-200 rounded-2xl overflow-hidden bg-blue-50/40 p-2"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`,
          maxWidth: '90vw',
          overflow: 'auto',
        }}
      >
        {Array.from({ length: gridSize }, (_, y) =>
          Array.from({ length: gridSize }, (_, x) => renderCell(x, y))
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-600 justify-center">
        <span className="flex items-center gap-2">
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: 'rgba(180, 225, 255, 0.45)',
              border: `1px solid ${BORDER_COLOR}`,
            }}
          />
          Ocean
        </span>
        <span className="flex items-center gap-2">
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.9)',
              border: `1px solid ${BORDER_COLOR}`,
            }}
          />
          Land
        </span>
        <span className="flex items-center gap-2">
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #B2F5EA, #5EEAD4)',
            }}
          />
          Your boat
        </span>
        <span className="flex items-center gap-2">
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #A5D8FF, #74C0FC)',
            }}
          />
          Other boats
        </span>
        <span className="flex items-center gap-2">
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              backgroundImage: 'url(/boosts/boost-40.png)',
              backgroundSize: 'cover',
              border: `1px solid ${BORDER_COLOR}`,
            }}
          />
          Boosted vessel
        </span>
      </div>

      <div className="text-sm text-gray-500">
        There are <strong>{boats.length}</strong> active boats on the map.
        {playerBoat && (
          <span className="text-green-600 ml-2">
            Your position: ({playerBoat.x}, {playerBoat.y})
          </span>
        )}
      </div>
    </div>
  );
};

export default SeaMap;

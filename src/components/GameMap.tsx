'use client';

import React from 'react';
import Map from './Map';
import { BoatPlacement, BoostInfo } from '@/types';
import BoatSVG, { type BoatTypeName } from '@/components/boats/BoatSVG';
import { Anchor, MousePointerClick } from 'lucide-react';

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
  const boatType = playerBoat?.boatType as BoatTypeName | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '64rem', margin: '0 auto' }}>

      {/* Toolbar */}
      <div
        className="live-map-toolbar"
        style={{
          background:   'rgba(255,255,255,0.92)',
          borderRadius: 20,
          border:       '1px solid rgba(31,122,224,0.14)',
          boxShadow:    '0 8px 22px rgba(31,122,224,0.12)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      '0.85rem 1.25rem',
          gap:          '1rem',
          flexWrap:     'wrap',
        }}
      >
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {boatType && (
            <BoatSVG type={boatType} size={36} />
          )}
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Anchor size={15} color="var(--ocean-500)" />
              {playerBoat
                ? `Position (${playerBoat.x}, ${playerBoat.y})`
                : 'No boat placed yet'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
              {playerBoat
                ? 'Move every day to avoid XP decay'
                : 'Place your boat to start earning fishing XP'}
            </p>
          </div>
        </div>

        {/* Placement toggle */}
        {canTogglePlacement && (
          <button
            onClick={onTogglePlacement}
            disabled={isLoading}
            type="button"
            className={isPlacementMode ? 'btn-fish' : 'btn-ocean'}
            style={{ opacity: isLoading ? 0.55 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isLoading ? (
              <>Working... <span className="loading-dots" /></>
            ) : isPlacementMode ? (
              <>Cancel</>
            ) : playerBoat ? (
              <>Move Boat</>
            ) : (
              <>Place Boat</>
            )}
          </button>
        )}
      </div>

      {/* Placement mode hint */}
      {isPlacementMode && !isLoading && (
        <div
          style={{
            background:   'linear-gradient(135deg, rgba(255,179,71,0.12), rgba(255,196,104,0.08))',
            border:       '1.5px solid rgba(255,179,71,0.5)',
            borderRadius: 14,
            padding:      '0.75rem 1.1rem',
            display:      'flex',
            alignItems:   'center',
            gap:          '0.6rem',
            color:        '#92400E',
            fontWeight:   600,
            fontSize:     '0.88rem',
          }}
        >
          <MousePointerClick size={18} color="#F59E0B" />
          Click any open sea tile on the map to drop anchor there. A GameController transaction confirms the placement.
        </div>
      )}

      {/* Map */}
      <Map
        gridSize={100}
        boats={boats}
        playerBoat={playerBoat}
        onCellClick={(x, y, lat, lng) => {
          if (!isPlacementMode || isLoading) return;
          onCellClick?.(x, y, lat, lng);
        }}
        isPlacementMode={isPlacementMode}
      />

      {/* Footer info */}
      <div
        style={{
          background:   'rgba(239,246,255,0.85)',
          border:       '1px solid rgba(31,122,224,0.14)',
          borderRadius: 14,
          padding:      '0.85rem 1.25rem',
          display:      'flex',
          alignItems:   'flex-start',
          gap:          '0.75rem',
          flexWrap:     'wrap',
        }}
      >
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Move at least once every 24 hours to maintain full XP. Staying idle for more than
          3 days reduces your daily reward by up to 50%.
          {playerBoost && playerBoost.level !== 'NONE' && (
            <strong style={{ color: 'var(--ocean-600)' }}>
              {' '}Your {playerBoost.name || 'boost'} adds +{Math.round(playerBoost.multiplier * 100)}% XP while active.
            </strong>
          )}
        </p>
      </div>
    </div>
  );
};

export default GameMap;

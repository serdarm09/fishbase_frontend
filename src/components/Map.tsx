'use client';

import React, { PointerEvent, WheelEvent, useMemo, useRef, useState } from 'react';
import { BoatPlacement } from '@/types';

interface MapProps {
  gridSize?: number;
  boats?: BoatPlacement[];
  onCellClick?: (x: number, y: number) => void;
  playerBoat?: BoatPlacement | null;
  isPlacementMode?: boolean;
}

type LandMass = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
};

const LAND_MASSES: LandMass[] = [
  { cx: 18, cy: 18, rx: 17, ry: 12, rotation: -12 },
  { cx: 22, cy: 59, rx: 14, ry: 25, rotation: 8 },
  { cx: 54, cy: 24, rx: 22, ry: 12, rotation: -5 },
  { cx: 78, cy: 58, rx: 17, ry: 25, rotation: 11 },
  { cx: 50, cy: 83, rx: 21, ry: 10, rotation: -2 },
  { cx: 91, cy: 18, rx: 9, ry: 10, rotation: 0 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isInsideRotatedEllipse = (x: number, y: number, land: LandMass) => {
  const angle = (land.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - land.cx;
  const dy = y - land.cy;
  const rotatedX = dx * cos + dy * sin;
  const rotatedY = -dx * sin + dy * cos;

  return (
    (rotatedX * rotatedX) / (land.rx * land.rx) +
      (rotatedY * rotatedY) / (land.ry * land.ry) <=
    1
  );
};

const isSeaCoordinate = (x: number, y: number, gridSize: number) => {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;

  const normalizedX = (x / (gridSize - 1)) * 100;
  const normalizedY = (y / (gridSize - 1)) * 100;
  return !LAND_MASSES.some((land) => isInsideRotatedEllipse(normalizedX, normalizedY, land));
};

const boatMark = (type: string) => {
  switch (type) {
    case 'MEGASHIP':
      return 'MS';
    case 'TRAWLER':
      return 'TR';
    case 'YACHT':
      return 'YT';
    case 'SAILBOAT':
      return 'SB';
    default:
      return 'DG';
  }
};

const SeaMap: React.FC<MapProps> = ({
  gridSize = 100,
  boats = [],
  onCellClick,
  playerBoat,
  isPlacementMode = false,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const didDrag = useRef(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; sea: boolean } | null>(null);

  const occupiedLookup = useMemo(() => {
    const lookup = new globalThis.Map<string, BoatPlacement>();
    boats.forEach((boat) => lookup.set(`${boat.x}-${boat.y}`, boat));
    return lookup;
  }, [boats]);

  const setZoomLevel = (nextZoom: number) => {
    setZoom(clamp(Number(nextZoom.toFixed(2)), 0.75, 2.75));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getMapPoint = (clientX: number, clientY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    const mapX = ((clientX - rect.left - rect.width / 2 - pan.x) / zoom + rect.width / 2) / rect.width;
    const mapY = ((clientY - rect.top - rect.height / 2 - pan.y) / zoom + rect.height / 2) / rect.height;
    const x = clamp(Math.floor(mapX * gridSize), 0, gridSize - 1);
    const y = clamp(Math.floor(mapY * gridSize), 0, gridSize - 1);
    return { x, y };
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacementMode) return;
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    const point = getMapPoint(event.clientX, event.clientY);
    if (!point) return;

    const sea = isSeaCoordinate(point.x, point.y, gridSize);
    if (!sea || occupiedLookup.has(`${point.x}-${point.y}`)) return;
    onCellClick?.(point.x, point.y);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = dragState.current;
    if (activeDrag && activeDrag.pointerId === event.pointerId) {
      if (Math.abs(event.clientX - activeDrag.x) + Math.abs(event.clientY - activeDrag.y) > 6) {
        didDrag.current = true;
      }

      setPan({
        x: activeDrag.panX + event.clientX - activeDrag.x,
        y: activeDrag.panY + event.clientY - activeDrag.y,
      });
      return;
    }

    const point = getMapPoint(event.clientX, event.clientY);
    if (!point) return;
    setHoveredCell({
      ...point,
      sea: isSeaCoordinate(point.x, point.y, gridSize),
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    dragState.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoomLevel(zoom + (event.deltaY > 0 ? -0.12 : 0.12));
  };

  return (
    <div className="live-map-shell">
      <div className="live-map-toolbar">
        <div>
          <p className="text-sm font-semibold text-gray-800">White Sea Map</p>
          <p className="text-xs text-gray-500">
            {hoveredCell
              ? `${hoveredCell.sea ? 'Open sea' : 'Land'} (${hoveredCell.x}, ${hoveredCell.y})`
              : 'Drag the map, zoom in, and drop boats only on sea.'}
          </p>
        </div>
        <div className="map-controls" aria-label="Map controls">
          <button type="button" onClick={() => setZoomLevel(zoom - 0.25)} aria-label="Zoom out">
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoomLevel(zoom + 0.25)} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={resetView} aria-label="Reset map">
            Reset
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`live-map-viewport ${isPlacementMode ? 'placement-active' : ''}`}
        onClick={handleMapClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoveredCell(null)}
        onWheel={handleWheel}
      >
        <div
          className="live-map-canvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg className="live-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="sea-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(15,111,209,.1)" strokeWidth=".18" />
              </pattern>
              <filter id="land-shadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(15,82,130,.16)" />
              </filter>
            </defs>
            <rect width="100" height="100" fill="url(#sea-grid)" />
            <path
              d="M0 36 C12 33 21 36 31 33 C43 29 50 34 61 31 C72 28 84 24 100 29"
              className="current-line current-line-one"
            />
            <path
              d="M0 71 C15 75 28 69 40 72 C55 77 66 69 80 72 C88 74 94 78 100 76"
              className="current-line current-line-two"
            />
            {LAND_MASSES.map((land, index) => (
              <ellipse
                key={`${land.cx}-${land.cy}`}
                cx={land.cx}
                cy={land.cy}
                rx={land.rx}
                ry={land.ry}
                transform={`rotate(${land.rotation} ${land.cx} ${land.cy})`}
                className={`land-mass land-mass-${index + 1}`}
                filter="url(#land-shadow)"
              />
            ))}
          </svg>

          {hoveredCell && (
            <div
              className={`map-reticle ${hoveredCell.sea ? 'is-sea' : 'is-land'}`}
              style={{
                left: `${((hoveredCell.x + 0.5) / gridSize) * 100}%`,
                top: `${((hoveredCell.y + 0.5) / gridSize) * 100}%`,
              }}
            />
          )}

          {boats.map((boat) => {
            const isPlayerBoat = playerBoat?.x === boat.x && playerBoat?.y === boat.y;
            return (
              <div
                key={boat.id}
                className={`boat-pin ${isPlayerBoat ? 'is-player' : ''} ${
                  boat.boostLevel !== 'NONE' ? 'is-boosted' : ''
                }`}
                style={{
                  left: `${((boat.x + 0.5) / gridSize) * 100}%`,
                  top: `${((boat.y + 0.5) / gridSize) * 100}%`,
                }}
                title={`${boat.ownerUsername} - ${boat.boatType} (${boat.x}, ${boat.y})`}
              >
                {boat.boostImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={boat.boostImage} alt="" />
                ) : (
                  <span>{boatMark(boat.boatType)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="live-map-footer">
        <span><i className="legend-swatch sea" /> Sea placement</span>
        <span><i className="legend-swatch land" /> Land locked</span>
        <span><i className="legend-swatch player" /> Your boat</span>
        <span>{boats.length} active boats</span>
      </div>
    </div>
  );
};

export default SeaMap;

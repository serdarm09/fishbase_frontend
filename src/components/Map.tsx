'use client';

import React, {
  PointerEvent,
  WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BoatPlacement, BoostInfo } from '@/types';
import BoatSVG, { type BoatTypeName } from '@/components/boats/BoatSVG';
import { Anchor, MousePointerClick, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Move, Plus } from 'lucide-react';

interface MapProps {
  gridSize?: number;
  boats?: BoatPlacement[];
  onCellClick?: (x: number, y: number, lat: number, lng: number) => void;
  playerBoat?: BoatPlacement | null;
  playerBoost?: BoostInfo | null;
  isPlacementMode?: boolean;
  isLoading?: boolean;
  canTogglePlacement?: boolean;
  onTogglePlacement?: () => void;
}

type LatLng = { lat: number; lng: number };
type WorldPoint = { x: number; y: number };
type WaterCheck = 'water' | 'land' | 'unknown';

const TILE_SIZE = 256;
const MIN_ZOOM = 4;
const MAX_ZOOM = 10;
const INITIAL_ZOOM = 6;
const INITIAL_CENTER: LatLng = { lat: 39.3, lng: 29.5 };
const MAP_BOUNDS = { north: 47.2, south: 29.2, west: 17.3, east: 43.8 };
const TILE_HOSTS = ['a', 'b', 'c'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrapTileX = (x: number, zoom: number) => {
  const max = 2 ** zoom;
  return ((x % max) + max) % max;
};

const latLngToWorld = ({ lat, lng }: LatLng, zoom: number): WorldPoint => {
  const sin = Math.sin((clamp(lat, -85.0511, 85.0511) * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
};

const worldToLatLng = ({ x, y }: WorldPoint, zoom: number): LatLng => {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
};

const tileUrl = (x: number, y: number, z: number) => {
  const host = TILE_HOSTS[Math.abs(x + y + z) % TILE_HOSTS.length];
  return `https://${host}.basemaps.cartocdn.com/light_all/${z}/${wrapTileX(x, z)}/${y}.png`;
};

const gridToLatLng = (x: number, y: number, gridSize: number): LatLng => ({
  lng: MAP_BOUNDS.west + (x / (gridSize - 1)) * (MAP_BOUNDS.east - MAP_BOUNDS.west),
  lat: MAP_BOUNDS.north - (y / (gridSize - 1)) * (MAP_BOUNDS.north - MAP_BOUNDS.south),
});

const latLngToGrid = ({ lat, lng }: LatLng, gridSize: number) => ({
  x: clamp(Math.round(((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * (gridSize - 1)), 0, gridSize - 1),
  y: clamp(Math.round(((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * (gridSize - 1)), 0, gridSize - 1),
});

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
  playerBoost,
  isPlacementMode = false,
  isLoading = false,
  canTogglePlacement = true,
  onTogglePlacement,
}) => {
  const boatType = playerBoat?.boatType as BoatTypeName | undefined;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ pointerId: number; x: number; y: number; center: LatLng } | null>(null);
  const didDrag = useRef(false);
  const waterCache = useRef(new globalThis.Map<string, Promise<WaterCheck>>());
  const [center, setCenter] = useState<LatLng>(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [viewportSize, setViewportSize] = useState({ width: 960, height: 620 });
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);
  const [mapMessage, setMapMessage] = useState('Use + / - or mouse wheel to zoom. Drag the real map to explore.');

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      setViewportSize({
        width: viewport.clientWidth || 960,
        height: viewport.clientHeight || 620,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const occupiedLookup = useMemo(() => {
    const lookup = new globalThis.Map<string, BoatPlacement>();
    boats.forEach((boat) => lookup.set(`${boat.x}-${boat.y}`, boat));
    return lookup;
  }, [boats]);

  const centerWorld = useMemo(() => latLngToWorld(center, zoom), [center, zoom]);
  const topLeft = useMemo(
    () => ({
      x: centerWorld.x - viewportSize.width / 2,
      y: centerWorld.y - viewportSize.height / 2,
    }),
    [centerWorld, viewportSize]
  );

  const visibleTiles = useMemo(() => {
    const maxTile = 2 ** zoom - 1;
    const startX = Math.floor(topLeft.x / TILE_SIZE) - 1;
    const endX = Math.floor((topLeft.x + viewportSize.width) / TILE_SIZE) + 1;
    const startY = Math.max(0, Math.floor(topLeft.y / TILE_SIZE) - 1);
    const endY = Math.min(maxTile, Math.floor((topLeft.y + viewportSize.height) / TILE_SIZE) + 1);
    const tiles: Array<{ x: number; y: number; wrappedX: number; left: number; top: number; url: string }> = [];

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const wrappedX = wrapTileX(x, zoom);
        tiles.push({
          x,
          y,
          wrappedX,
          left: x * TILE_SIZE - topLeft.x,
          top: y * TILE_SIZE - topLeft.y,
          url: tileUrl(x, y, zoom),
        });
      }
    }

    return tiles;
  }, [topLeft, viewportSize, zoom]);

  const setZoomLevel = (nextZoom: number) => {
    setZoom(clamp(Math.round(nextZoom), MIN_ZOOM, MAX_ZOOM));
  };

  const resetView = () => {
    setCenter(INITIAL_CENTER);
    setZoom(INITIAL_ZOOM);
    setMapMessage('Map view reset.');
  };

  const getLatLngFromClient = (clientX: number, clientY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    const world = {
      x: topLeft.x + clientX - rect.left,
      y: topLeft.y + clientY - rect.top,
    };
    return worldToLatLng(world, zoom);
  };

  const checkWaterAt = async (latLng: LatLng) => {
    const world = latLngToWorld(latLng, zoom);
    const tileX = Math.floor(world.x / TILE_SIZE);
    const tileY = Math.floor(world.y / TILE_SIZE);
    const pixelX = Math.floor(world.x - tileX * TILE_SIZE);
    const pixelY = Math.floor(world.y - tileY * TILE_SIZE);
    const cacheKey = `${zoom}/${wrapTileX(tileX, zoom)}/${tileY}/${pixelX}/${pixelY}`;

    if (!waterCache.current.has(cacheKey)) {
      waterCache.current.set(
        cacheKey,
        new Promise<WaterCheck>((resolve) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = TILE_SIZE;
              canvas.height = TILE_SIZE;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (!ctx) {
                resolve('unknown');
                return;
              }

              ctx.drawImage(image, 0, 0);
              const sample = ctx.getImageData(clamp(pixelX - 2, 0, 251), clamp(pixelY - 2, 0, 251), 5, 5).data;
              let waterVotes = 0;
              let landVotes = 0;
              let counted = 0;

              for (let index = 0; index < sample.length; index += 4) {
                const r = sample[index];
                const g = sample[index + 1];
                const b = sample[index + 2];
                const isLabel = r < 80 && g < 80 && b < 80;
                if (isLabel) continue;
                counted += 1;
                if (b >= r + 2 && b >= g - 6 && r < 245) waterVotes += 1;
                if (r > 235 && g > 235 && b > 235 && Math.abs(r - b) < 8) landVotes += 1;
              }

              if (counted === 0) {
                resolve('unknown');
                return;
              }

              if (waterVotes / counted >= 0.4) {
                resolve('water');
                return;
              }

              if (landVotes / counted >= 0.75) {
                resolve('land');
                return;
              }

              resolve('unknown');
            } catch {
              resolve('unknown');
            }
          };
          image.onerror = () => resolve('unknown');
          image.src = tileUrl(tileX, tileY, zoom);
        })
      );
    }

    return waterCache.current.get(cacheKey)!;
  };

  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacementMode) {
      setMapMessage('Press Place Boat or Move Boat first, then click a sea point.');
      return;
    }

    if (!onCellClick) {
      setMapMessage('Boat placement is not available right now.');
      return;
    }

    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    const latLng = getLatLngFromClient(event.clientX, event.clientY);
    if (!latLng) return;
    const grid = latLngToGrid(latLng, gridSize);

    if (occupiedLookup.has(`${grid.x}-${grid.y}`)) {
      setMapMessage('That sea point is already occupied by another boat.');
      return;
    }

    setMapMessage('Checking if this point is open water...');
    const water = await checkWaterAt(latLng);
    if (water === 'land') {
      setMapMessage('That point looks like land. Choose a sea area.');
      return;
    }

    if (water === 'unknown') {
      setMapMessage('Water check was inconclusive. Continuing with this sea point...');
    }

    onCellClick?.(grid.x, grid.y, latLng.lat, latLng.lng);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = dragState.current;
    if (activeDrag && activeDrag.pointerId === event.pointerId) {
      const dx = event.clientX - activeDrag.x;
      const dy = event.clientY - activeDrag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) didDrag.current = true;

      const startWorld = latLngToWorld(activeDrag.center, zoom);
      setCenter(worldToLatLng({ x: startWorld.x - dx, y: startWorld.y - dy }, zoom));
      return;
    }

    const latLng = getLatLngFromClient(event.clientX, event.clientY);
    if (!latLng) return;
    setHoveredPoint({ ...latLng, ...latLngToGrid(latLng, gridSize) });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    dragState.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      center,
    };
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoomLevel(zoom + (event.deltaY > 0 ? -1 : 1));
  };

  const boatPins = boats.map((boat) => {
    const position = gridToLatLng(boat.x, boat.y, gridSize);
    const world = latLngToWorld(position, zoom);
    const isPlayerBoat = playerBoat?.x === boat.x && playerBoat?.y === boat.y;
    return {
      boat,
      isPlayerBoat,
      left: world.x - topLeft.x,
      top: world.y - topLeft.y,
    };
  });

  return (
    <div className="live-map-shell shadow-xl border border-blue-200/80 rounded-2xl overflow-hidden bg-white/95 backdrop-blur w-full">
      {/* ── Unified Map Toolbar ─────────────────────────────── */}
      <div className="live-map-toolbar flex flex-wrap items-center justify-between gap-4 p-4 bg-white/95 border-b border-blue-100">
        <div className="flex items-center gap-3">
          {boatType ? (
            <BoatSVG type={boatType} size={38} />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
              <Anchor size={20} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
                <Anchor size={16} className="text-blue-500" />
                {playerBoat ? `Position (${playerBoat.x}, ${playerBoat.y})` : 'No boat placed yet'}
              </span>
              {playerBoat && (
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isPlacementMode
                ? 'Click open sea tile to anchor'
                : hoveredPoint
                ? `Grid (${hoveredPoint.x}, ${hoveredPoint.y}) | Lat ${hoveredPoint.lat.toFixed(3)}, Lng ${hoveredPoint.lng.toFixed(3)}`
                : playerBoat
                ? 'Move every 24h to maintain streak & avoid XP decay'
                : 'Place your boat to start earning daily XP'}
            </p>
          </div>
        </div>

        {/* Controls & Action Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="map-controls bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button type="button" onClick={() => setZoomLevel(zoom - 1)} aria-label="Zoom out" className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition">
              <ZoomOut size={15} className="text-slate-600" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-600">Z{zoom}</span>
            <button type="button" onClick={() => setZoomLevel(zoom + 1)} aria-label="Zoom in" className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition">
              <ZoomIn size={15} className="text-slate-600" />
            </button>
            <button type="button" onClick={resetView} aria-label="Reset map" className="px-2.5 h-8 rounded-lg bg-white shadow-sm text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1">
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {canTogglePlacement && (
            <button
              onClick={onTogglePlacement}
              disabled={isLoading}
              type="button"
              className={isPlacementMode ? 'btn-fish shadow-md animate-pulse' : 'primary-button'}
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5"><RefreshCw size={15} className="animate-spin" /> Working...</span>
              ) : isPlacementMode ? (
                <span className="flex items-center gap-1.5"><MousePointerClick size={16} /> Cancel Placement</span>
              ) : playerBoat ? (
                <span className="flex items-center gap-1.5"><Move size={15} /> Move Boat</span>
              ) : (
                <span className="flex items-center gap-1.5"><Plus size={15} /> Place Boat</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Placement Mode Banner */}
      {isPlacementMode && !isLoading && (
        <div className="bg-amber-50/95 border-b border-amber-200/80 px-4 py-2 text-amber-900 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MousePointerClick size={18} className="text-amber-600 shrink-0 animate-bounce" />
            <span>Click any open sea tile on the map to drop anchor there. A wallet transaction will confirm your placement.</span>
          </div>
          <span className="text-xs bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-bold shrink-0">Placement Mode</span>
        </div>
      )}

      <div
        ref={viewportRef}
        className={`live-map-viewport real-map-viewport ${isPlacementMode ? 'placement-active' : ''}`}
        onClick={handleMapClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoveredPoint(null)}
        onWheel={handleWheel}
      >
        {visibleTiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${zoom}-${tile.x}-${tile.y}`}
            src={tile.url}
            alt=""
            className="map-tile"
            draggable={false}
            style={{ left: tile.left, top: tile.top }}
          />
        ))}

        <div className="map-attribution">
          © OpenStreetMap © CARTO
        </div>

        {boatPins.map(({ boat, isPlayerBoat, left, top }) => (
          <div
            key={boat.id}
            className={`boat-pin ${isPlayerBoat ? 'is-player' : ''} ${
              boat.boostLevel !== 'NONE' ? 'is-boosted' : ''
            }`}
            style={{ left, top }}
            title={`${boat.ownerUsername} - ${boat.boatType} (${boat.x}, ${boat.y})`}
          >
            {boat.boostImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={boat.boostImage} alt="" />
            ) : (
              <span>{boatMark(boat.boatType)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="live-map-footer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-4 bg-slate-50/95 border-t border-slate-200/80">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5"><i className="legend-swatch sea" /> Sea areas</span>
          <span className="flex items-center gap-1.5"><i className="legend-swatch player" /> Your boat</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> {boats.length} active boats</span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>💡 Move at least once every 24h to avoid XP decay.{playerBoost && playerBoost.level !== 'NONE' ? ` Boost: +${Math.round(playerBoost.multiplier * 100)}% XP active.` : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default SeaMap;

'use client';

import React from 'react';
import Image from 'next/image';

export type BoatTypeName = 'DINGHY' | 'SAILBOAT' | 'YACHT' | 'TRAWLER' | 'MEGASHIP';

interface BoatSVGProps {
  type: BoatTypeName | string;
  size?: number;
  className?: string;
}

// ── Boat image mapping ─────────────────────────────────────────────────────
// Files live at: /public/boosts/ship_v1-Photoroom.png … ship_v5-Photoroom.png
// v1=Dinghy, v2=Sailboat, v3=Yacht, v4=Trawler, v5=Megaship

const BOAT_IMAGES: Record<string, string> = {
  DINGHY:   '/boosts/ship_v1-Photoroom.png',
  SAILBOAT: '/boosts/ship_v2-Photoroom.png',
  YACHT:    '/boosts/ship_v3-Photoroom.png',
  TRAWLER:  '/boosts/ship_v4-Photoroom.png',
  MEGASHIP: '/boosts/ship_v5-Photoroom.png',
};

// ── Metadata ───────────────────────────────────────────────────────────────

const BOAT_LABELS: Record<string, string> = {
  DINGHY:   'Dinghy',
  SAILBOAT: 'Sailboat',
  YACHT:    'Yacht',
  TRAWLER:  'Trawler',
  MEGASHIP: 'Mega Ship',
};

export const BOAT_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  DINGHY:   { bg: '#EFF6FF', border: '#BFDBFE', badge: '#3B82F6' },
  SAILBOAT: { bg: '#F0FDF4', border: '#BBF7D0', badge: '#22C55E' },
  YACHT:    { bg: '#FFF7ED', border: '#FED7AA', badge: '#F97316' },
  TRAWLER:  { bg: '#FFF1F2', border: '#FECDD3', badge: '#EF4444' },
  MEGASHIP: { bg: '#F5F3FF', border: '#DDD6FE', badge: '#8B5CF6' },
};

export const BOAT_XP: Record<string, number> = {
  DINGHY:   10,
  SAILBOAT: 25,
  YACHT:    50,
  TRAWLER:  100,
  MEGASHIP: 200,
};

export function boatLabel(type: string): string {
  return BOAT_LABELS[(type ?? '').toUpperCase()] ?? type;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BoatSVG({ type, size = 64, className = '' }: BoatSVGProps) {
  const key   = ((type ?? 'DINGHY').toUpperCase()) as BoatTypeName;
  const src   = BOAT_IMAGES[key] ?? BOAT_IMAGES.DINGHY;
  const label = boatLabel(key);

  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          size,
        height:         size,
        position:       'relative',
        flexShrink:     0,
      }}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'contain' }}
        priority={key === 'DINGHY'}
      />
    </div>
  );
}

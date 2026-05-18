'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper?: string;
  accent?: 'blue' | 'sun' | 'green' | 'purple';
}

const accentMap = {
  blue: {
    background: 'linear-gradient(135deg, rgba(122, 215, 255, 0.25), rgba(58, 142, 230, 0.25))',
    border: 'rgba(58, 142, 230, 0.25)',
  },
  sun: {
    background: 'linear-gradient(135deg, rgba(255, 216, 130, 0.26), rgba(255, 162, 70, 0.26))',
    border: 'rgba(255, 162, 70, 0.35)',
  },
  green: {
    background: 'linear-gradient(135deg, rgba(99, 213, 180, 0.28), rgba(30, 153, 138, 0.28))',
    border: 'rgba(30, 153, 138, 0.32)',
  },
  purple: {
    background: 'linear-gradient(135deg, rgba(151, 142, 255, 0.26), rgba(98, 88, 245, 0.28))',
    border: 'rgba(98, 88, 245, 0.28)',
  },
};

export const StatCard = ({ icon, label, value, helper, accent = 'blue' }: StatCardProps) => (
  <div
    className="ocean-card p-4 flex flex-col gap-2"
    style={{
      background: accentMap[accent].background,
      borderColor: accentMap[accent].border,
    }}
  >
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      {label}
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {helper && <span className="text-xs text-gray-500">{helper}</span>}
  </div>
);


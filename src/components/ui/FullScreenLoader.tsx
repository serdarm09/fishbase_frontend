'use client';

export const FullScreenLoader = ({ label = 'Loading' }: { label?: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center relative">
    <span
      className="floating-bubble"
      style={{ width: 160, height: 160, top: 'calc(50% - 180px)', left: 'calc(50% - 80px)' }}
      aria-hidden="true"
    />
    <div className="loading-bubble" aria-hidden="true" />
    <div>
      <p className="text-lg font-semibold text-gray-700">
        {label} <span className="loading-dots" />
      </p>
      <p className="text-sm text-gray-500 mt-2">Checking the tides...</p>
    </div>
  </div>
);


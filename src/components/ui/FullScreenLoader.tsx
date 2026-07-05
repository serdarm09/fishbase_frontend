'use client';

export const FullScreenLoader = ({ label = 'Loading' }: { label?: string }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      background: 'linear-gradient(160deg, #000e1a 0%, #001828 50%, #000e1a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Ambient glow */}
    <div aria-hidden="true" style={{
      position: 'absolute', top: '30%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(31,122,224,0.1) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    {/* Spinner ring */}
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      border: '3px solid rgba(74,170,247,0.15)',
      borderTopColor: '#4AAAF7',
      animation: 'spin 0.9s linear infinite',
    }} aria-hidden="true" />

    <div style={{ textAlign: 'center', position: 'relative' }}>
      <p style={{
        fontFamily: 'var(--font-display,"Instrument Serif",serif)',
        fontSize: '1.35rem', fontWeight: 400,
        color: '#fff', margin: 0,
        letterSpacing: '-0.02em',
      }}>
        {label}<span className="loading-dots" />
      </p>
      <p style={{ fontSize: '0.82rem', color: 'rgba(175,200,218,0.55)', marginTop: '0.4rem' }}>
        Checking the tides…
      </p>
    </div>
  </div>
);

/* eslint-disable @next/next/no-img-element */
// Techyverve logo. light=true gives the white version for dark backgrounds.
export default function Logo({ size = 28, light = false }) {
  return (
    <img
      src={light ? '/brand/logo-white.png' : '/brand/logo-navy.png'}
      width={size}
      height={size}
      alt="Techyverve"
      style={{ display: 'block', flex: 'none' }}
      draggable={false}
    />
  );
}

export function Brand({ light = false, size = 28, sub = 'CRM' }) {
  return (
    <div className="brand-lockup">
      <Logo size={size} light={light} />
      <div>
        <div className="brand-word" style={{ color: light ? '#fff' : undefined }}>Techyverve</div>
        {sub && <div className="brand-tag" style={{ color: light ? '#b2b8c4' : undefined }}>{sub}</div>}
      </div>
    </div>
  );
}

const palettes = {
  default: { bloom: '#1c5a45', stack: '#639922', leafFront: '#8fdb5a', leafBack: '#3b6d11' },
  light: { bloom: '#f3f0ea', stack: '#8fdb5a', leafFront: '#c3ecab', leafBack: '#8fdb5a' }
};

export default function BloomstackLogo({ className, variant = 'default' }) {
  const colors = palettes[variant] ?? palettes.default;

  return (
    <svg viewBox="-16 -14 340 90" className={className} role="img" aria-label="Bloomstack">
      <g transform="translate(92, -6) rotate(-8) scale(1.3)">
        <path d="M0 20 Q -7 6 3 0 Q 12 6 4 20 Z" fill={colors.leafFront} />
        <path d="M4 20 Q 12 9 20 12 Q 15 22 4 20 Z" fill={colors.leafBack} />
      </g>
      <g transform="skewX(-10)">
        <text x="0" y="58" fontFamily="Anton" fontSize="46" fill={colors.bloom} letterSpacing="-1">
          BLOOM
        </text>
        <text x="133" y="58" fontFamily="Anton" fontSize="46" fill={colors.stack} letterSpacing="-1">
          STACK
        </text>
      </g>
    </svg>
  );
}

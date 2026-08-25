export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="RentMe"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="2" className="fill-primary" />
        <g
          transform="translate(12 12)"
          className="stroke-primary-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
        </g>
      </svg>
      {withText ? (
        <span className="font-display text-base font-semibold tracking-tight text-foreground">RentMe</span>
      ) : null}
    </span>
  );
}

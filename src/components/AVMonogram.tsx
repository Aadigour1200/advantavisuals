interface AVMonogramProps {
  className?: string;
}

export function AVMonogram({ className = 'h-7 w-7' }: AVMonogramProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.25"
      />
      {/* Architectural A */}
      <path
        d="M8.5 30L16.2 10H19.1L23.4 21.2"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M11.6 22.8H19.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      {/* Interlocking V */}
      <path
        d="M19.8 10L25.8 29.5L32 10"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

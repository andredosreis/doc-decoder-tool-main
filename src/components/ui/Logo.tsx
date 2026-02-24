interface LogoProps {
  size?: number;
  variant?: "full" | "icon";
  className?: string;
}

export function Logo({ size = 40, variant = "full", className = "" }: LogoProps) {
  const iconSize = size;
  const textHeight = size * 0.45;

  if (variant === "icon") {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="APP XPRO"
      >
        {/* Background rounded square */}
        <rect width="40" height="40" rx="10" fill="url(#grad-icon)" />

        {/* X shape made of two bold strokes */}
        <line x1="11" y1="11" x2="29" y2="29" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="29" y1="11" x2="11" y2="29" stroke="white" strokeWidth="4.5" strokeLinecap="round" />

        {/* Small accent dot — top right */}
        <circle cx="31" cy="9" r="3.5" fill="#38bdf8" />

        <defs>
          <linearGradient id="grad-icon" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg
      width={iconSize + 120}
      height={iconSize}
      viewBox={`0 0 ${40 + 120} 40`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="APP XPRO"
    >
      {/* Icon part */}
      <rect width="40" height="40" rx="10" fill="url(#grad-full)" />
      <line x1="11" y1="11" x2="29" y2="29" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="29" y1="11" x2="11" y2="29" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="31" cy="9" r="3.5" fill="#38bdf8" />

      {/* "APP" text */}
      <text
        x="50"
        y="26"
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="2"
        fill="url(#grad-text)"
      >
        APP
      </text>

      {/* "XPRO" text — slightly larger and lighter weight */}
      <text
        x="93"
        y="26"
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        fontSize="17"
        fontWeight="400"
        letterSpacing="1.5"
        fill="currentColor"
        opacity="0.75"
      >
        XPRO
      </text>

      <defs>
        <linearGradient id="grad-full" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="grad-text" x1="50" y1="0" x2="93" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

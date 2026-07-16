import * as React from "react";
import { cn } from "../lib/cn";

/**
 * The EZ brand mark: the italic "Ez." wordmark with its signature
 * underline swoosh and sparkle, per the Design Canon mockups
 * (assets/design/02 Screen Mockups/00 Foundation). This is the single
 * source for the brand mark — do not recreate it inline elsewhere.
 */
export interface EzWordmarkProps extends React.SVGAttributes<SVGSVGElement> {
  /** Renders the swoosh + sparkle flourish beneath the wordmark. Default true. */
  withFlourish?: boolean;
}

export function EzWordmark({ className, withFlourish = true, ...props }: EzWordmarkProps) {
  const gradientId = React.useId();

  return (
    <svg
      viewBox="0 0 220 120"
      role="img"
      aria-label="EZ"
      className={cn("text-primary", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-rose-gold)" />
          <stop offset="100%" stopColor="var(--color-warm-taupe)" />
        </linearGradient>
      </defs>
      <text
        x="4"
        y="70"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontWeight={600}
        fontSize="72"
        fill={`url(#${gradientId})`}
      >
        Ez
        <tspan fill="currentColor">.</tspan>
      </text>
      {withFlourish && (
        <>
          <path
            d="M8 84 C 60 112, 130 112, 175 78"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M198 66 L202 78 L214 82 L202 86 L198 98 L194 86 L182 82 L194 78 Z"
            fill={`url(#${gradientId})`}
          />
        </>
      )}
    </svg>
  );
}

export type EzMarkProps = React.SVGAttributes<SVGSVGElement>;

/** Compact circular mark for favicons, nav bars, and avatar fallbacks. */
export function EzMark({ className, ...props }: EzMarkProps) {
  const gradientId = React.useId();

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="EZ"
      className={cn("text-primary-foreground", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-rose-gold)" />
          <stop offset="100%" stopColor="var(--color-warm-taupe)" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontWeight={700}
        fontSize="30"
        fill="currentColor"
      >
        E
      </text>
    </svg>
  );
}

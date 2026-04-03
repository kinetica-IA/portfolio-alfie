/**
 * OrganicSymbols — Living micro-objects for cards and sections
 *
 * Each symbol is an SVG that animates continuously.
 * 2x size, high opacity, varied palette colors.
 */

import { useRef, useEffect } from 'react'

/* ── CSS-animated SVG symbols ──────────────────────────────── */

export function PulseSymbol({ color = 'var(--sea)', size = 44, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={`org-symbol ${className}`}
      style={{ overflow: 'visible' }}
    >
      <circle cx="14" cy="14" r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.55">
        <animate attributeName="r" values="9;11;9" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.55;0.25;0.55" dur="3s" repeatCount="indefinite" />
      </circle>
      <polyline
        points="4,14 9,14 11,8 13,20 15,6 17,14 22,14"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        opacity="0.9"
        strokeDasharray="40"
        strokeDashoffset="0"
      >
        <animate attributeName="stroke-dashoffset" values="40;0;0;40" dur="2.8s" repeatCount="indefinite" keyTimes="0;0.4;0.7;1" />
        <animate attributeName="opacity" values="0.4;0.95;0.95;0.4" dur="2.8s" repeatCount="indefinite" keyTimes="0;0.4;0.7;1" />
      </polyline>
      <circle cx="14" cy="14" r="2" fill={color} opacity="0.85">
        <animate attributeName="opacity" values="0.6;0.95;0.6" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function OrbitSymbol({ color = 'var(--teal)', size = 44, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={`org-symbol ${className}`}
      style={{ overflow: 'visible' }}
    >
      <circle cx="14" cy="14" r="9" fill="none" stroke={color} strokeWidth="0.8" opacity="0.45" />
      <circle r="2.2" fill={color} opacity="0.9">
        <animateMotion dur="4s" repeatCount="indefinite" path="M14,5 A9,9 0 1,1 13.99,5" />
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle r="1.5" fill={color} opacity="0.65">
        <animateMotion dur="4s" repeatCount="indefinite" begin="-2s" path="M14,5 A9,9 0 1,1 13.99,5" />
        <animate attributeName="opacity" values="0.65;0.3;0.65" dur="4s" repeatCount="indefinite" begin="-2s" />
      </circle>
      <circle cx="14" cy="14" r="2" fill="none" stroke={color} strokeWidth="1" opacity="0.6">
        <animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function SignalSymbol({ color = 'var(--green)', size = 44, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={`org-symbol ${className}`}
      style={{ overflow: 'visible' }}
    >
      <path
        d="M2,14 Q7,6 12,14 Q17,22 22,14 Q25,10 26,14"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"
        opacity="0.85"
        strokeDasharray="48"
        strokeDashoffset="0"
      >
        <animate attributeName="stroke-dashoffset" values="48;0;-48" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.9;0.35" dur="3.5s" repeatCount="indefinite" />
      </path>
      <circle cx="7" cy="9" r="1.5" fill={color} opacity="0">
        <animate attributeName="opacity" values="0;0.85;0" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17" cy="19" r="1.5" fill={color} opacity="0">
        <animate attributeName="opacity" values="0;0.85;0" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
      </circle>
    </svg>
  )
}

export function CellSymbol({ color = 'var(--warm)', size = 44, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={`org-symbol ${className}`}
      style={{ overflow: 'visible' }}
    >
      <ellipse cx="14" cy="14" fill="none" stroke={color} strokeWidth="1" opacity="0.55">
        <animate attributeName="rx" values="10;11;9.5;10" dur="4s" repeatCount="indefinite" />
        <animate attributeName="ry" values="9;10;10.5;9" dur="4s" repeatCount="indefinite" />
      </ellipse>
      <circle cx="14" cy="14" fill={color} opacity="0.30">
        <animate attributeName="r" values="4;5;4" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="11" cy="12" r="1.3" fill={color} opacity="0.6">
        <animate attributeName="cx" values="11;12;11" dur="5s" repeatCount="indefinite" />
        <animate attributeName="cy" values="12;11;12" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17" cy="15" r="1" fill={color} opacity="0.55">
        <animate attributeName="cx" values="17;16;17" dur="4s" repeatCount="indefinite" />
        <animate attributeName="cy" values="15;16.5;15" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="14" cy="14" r="2" fill={color} opacity="0.8">
        <animate attributeName="opacity" values="0.65;0.95;0.65" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function NetworkSymbol({ color = 'var(--ice)', size = 44, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={`org-symbol ${className}`}
      style={{ overflow: 'visible' }}
    >
      <line x1="8" y1="8" x2="20" y2="12" stroke={color} strokeWidth="0.8" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.80;0.45" dur="3s" repeatCount="indefinite" />
      </line>
      <line x1="8" y1="8" x2="14" y2="22" stroke={color} strokeWidth="0.8" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.75;0.45" dur="3s" repeatCount="indefinite" begin="0.5s" />
      </line>
      <line x1="20" y1="12" x2="14" y2="22" stroke={color} strokeWidth="0.8" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.70;0.45" dur="3s" repeatCount="indefinite" begin="1s" />
      </line>
      <circle cx="8" cy="8" r="3" fill={color} opacity="0.30">
        <animate attributeName="opacity" values="0.30;0.65;0.30" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="8" cy="8" r="1.5" fill={color} opacity="0.8" />
      <circle cx="20" cy="12" r="2.5" fill={color} opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.60;0.25" dur="3s" repeatCount="indefinite" begin="0.5s" />
      </circle>
      <circle cx="20" cy="12" r="1.3" fill={color} opacity="0.8" />
      <circle cx="14" cy="22" r="2.8" fill={color} opacity="0.22">
        <animate attributeName="opacity" values="0.22;0.55;0.22" dur="3s" repeatCount="indefinite" begin="1s" />
      </circle>
      <circle cx="14" cy="22" r="1.4" fill={color} opacity="0.8" />
      <circle r="1.5" fill={color} opacity="0">
        <animateMotion dur="2s" repeatCount="indefinite" path="M8,8 L20,12 L14,22 Z" />
        <animate attributeName="opacity" values="0;0.95;0" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function HelixSymbol({ color = 'var(--sea)', size = 44, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={`org-symbol ${className}`}
      style={{ overflow: 'visible' }}
    >
      <path
        d="M8,4 Q14,8 8,12 Q2,16 8,20 Q14,24 8,28"
        fill="none" stroke={color} strokeWidth="1.3" opacity="0.70"
        strokeDasharray="60" strokeDashoffset="0"
      >
        <animate attributeName="stroke-dashoffset" values="0;-60" dur="6s" repeatCount="indefinite" />
      </path>
      <path
        d="M20,4 Q14,8 20,12 Q26,16 20,20 Q14,24 20,28"
        fill="none" stroke={color} strokeWidth="1.3" opacity="0.70"
        strokeDasharray="60" strokeDashoffset="0"
      >
        <animate attributeName="stroke-dashoffset" values="0;-60" dur="6s" repeatCount="indefinite" />
      </path>
      <line x1="10" y1="6" x2="18" y2="6" stroke={color} strokeWidth="0.8" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.75;0.45" dur="3s" repeatCount="indefinite" />
      </line>
      <line x1="6" y1="14" x2="22" y2="14" stroke={color} strokeWidth="0.8" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.75;0.45" dur="3s" repeatCount="indefinite" begin="1s" />
      </line>
      <line x1="10" y1="22" x2="18" y2="22" stroke={color} strokeWidth="0.8" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.75;0.45" dur="3s" repeatCount="indefinite" begin="2s" />
      </line>
    </svg>
  )
}

/* ── Ambient floating decorators for margins ─────────────── */

export function FloatingDecorators() {
  return (
    <div className="floating-deco" aria-hidden="true">
      <span className="deco deco--plus deco--1">+</span>
      <span className="deco deco--dot deco--2" />
      <span className="deco deco--ring deco--3" />
      <span className="deco deco--plus deco--4">+</span>
      <span className="deco deco--dot deco--5" />

      <style>{`
        .floating-deco {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .deco {
          position: absolute;
          display: block;
          color: var(--teal);
          opacity: 0;
          animation: decoFloat 8s ease-in-out infinite;
        }
        .deco--plus {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 300;
          line-height: 1;
        }
        .deco--dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--teal);
        }
        .deco--ring {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 0.8px solid var(--sea);
        }
        .deco--1 { top: 18%; left: 5%; animation-delay: 0s; color: var(--teal); }
        .deco--2 { top: 38%; right: 6%; animation-delay: 2s; background: var(--sea); }
        .deco--3 { top: 55%; left: 4%; animation-delay: 4s; border-color: var(--green); }
        .deco--4 { top: 72%; right: 5%; animation-delay: 1s; color: var(--warm); }
        .deco--5 { top: 88%; left: 7%; animation-delay: 3s; background: var(--ice); }

        @keyframes decoFloat {
          0%, 100% { opacity: 0; transform: translateY(0px) rotate(0deg); }
          20% { opacity: 0.28; }
          50% { opacity: 0.18; transform: translateY(-8px) rotate(45deg); }
          80% { opacity: 0.28; }
        }
        @media (max-width: 768px) {
          .floating-deco { display: none; }
        }
      `}</style>
    </div>
  )
}

/* ── Section eyebrow icon helper ─────────────────────────── */
export const SECTION_SYMBOLS = {
  clinical: PulseSymbol,
  flagship: SignalSymbol,
  founder: CellSymbol,
  systems: NetworkSymbol,
  published: HelixSymbol,
  contact: OrbitSymbol,
}

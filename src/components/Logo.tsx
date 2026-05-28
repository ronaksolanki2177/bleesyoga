import React from 'react';

interface LogoProps {
  size?: number;
  showCircleBg?: boolean;
  className?: string;
}

export default function Logo({ size = 150, showCircleBg = true, className = '' }: LogoProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* White outer circle background as in the picture */}
        {showCircleBg && (
          <circle cx="150" cy="150" r="145" fill="white" filter="drop-shadow(0px 4px 12px rgba(42, 40, 37, 0.08))" />
        )}

        {/* Intersection Art Background Code */}
        <g id="logo-geometric-icon" transform="translate(0, -10)">
          {/* Blue downward V Chevron */}
          <path
            d="M 98,135 L 150,195 L 202,135"
            stroke="#7C9DA6"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
          {/* Pink upward House/Arrow block */}
          <path
            className="animate-pulse"
            d="M 125,145 L 125,125 L 150,95 L 175,125 L 175,145 Z"
            fill="#EF7E85"
            opacity="0.9"
          />
        </g>

        {/* Brand Text Section */}
        <g id="logo-text" transform="translate(0, 15)">
          {/* BLEES YOGA */}
          <text
            x="150"
            y="142"
            textAnchor="middle"
            fill="#2A2825"
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '29px',
              letterSpacing: '0.12em',
            }}
          >
            BLEES YOGA
          </text>

          {/* Underline segment & AKSHAY CHOTARA */}
          {/* Left sub-line */}
          <line x1="45" y1="162" x2="105" y2="162" stroke="#2A2825" strokeWidth="2" />
          
          {/* AKSHAY CHOTARA */}
          <text
            x="150"
            y="167"
            textAnchor="middle"
            fill="#2A2825"
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '11px',
              letterSpacing: '0.15em',
            }}
          >
            AKSHAY CHOTARA
          </text>

          {/* Right sub-line */}
          <line x1="195" y1="162" x2="255" y2="162" stroke="#2A2825" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';

interface YogiIllustrationProps {
  size?: number;
  className?: string;
}

export default function YogiIllustration({ size = 120, className = '' }: YogiIllustrationProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Animated gentle radiating glow in the background */}
      <motion.div
        className="absolute inset-0 bg-gold/10 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Crisp flat scalable yogi SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
      >
        {/* Halo circle */}
        <circle cx="50" cy="50" r="32" stroke="#dfc8ad" strokeWidth="0.5" strokeDasharray="3 3" />
        
        {/* Yogi figure group */}
        <g id="yogi" transform="translate(0, 4)">
          {/* Head & Hair */}
          <circle cx="50" cy="28" r="7" fill="#F9C23C" />
          {/* Hair knot/bun */}
          <circle cx="50" cy="19" r="3.5" fill="#DC9612" />
          
          {/* Torso */}
          <path d="M43 38 C43 35, 57 35, 57 38 L54 53 L46 53 Z" fill="#F9A01B" />
          <path d="M46 35 L54 35 L52 46 L48 46 Z" fill="#F9C23C" /> {/* bare neck/chest skin */}

          {/* Left Arm, folded toward lap */}
          <path d="M43 37 Q34 44, 43 51 Q46 53, 48 51" stroke="#F9C23C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {/* Right Arm, folded toward lap */}
          <path d="M57 37 Q66 44, 57 51 Q54 53, 52 51" stroke="#F9C23C" strokeWidth="4.5" strokeLinecap="round" fill="none" />

          {/* Folded legs in lotus position (cross-legged) */}
          <path 
            d="M 28,58 C 28,50, 40,50, 50,56 C 60,50, 72,50, 72,58 C 72,66, 60,66, 50,62 C 40,66, 28,66, 28,58 Z" 
            fill="#F47F1F" 
          />
          
          {/* Lotus feet */}
          <circle cx="34" cy="56" r="3" fill="#F9C23C" />
          <circle cx="66" cy="56" r="3" fill="#F9C23C" />

          {/* Calm closed eyes (happy smile arcs) */}
          <path d="M 47,28 Q 48.5,29.5 49,28" stroke="#5E4017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
          <path d="M 51,28 Q 51.5,29.5 53,28" stroke="#5E4017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
          
          {/* Bindi dot (Third eye center) */}
          <circle cx="50" cy="24.5" r="0.7" fill="#EF4444" />
          
          {/* Zen hands in dhyanamudra */}
          <g id="hands" transform="translate(47.5, 49.5)">
            <ellipse cx="2.5" cy="2" rx="2" ry="1" fill="#F9C23C" />
          </g>
        </g>
      </svg>
    </div>
  );
}

import React from 'react';

interface AkshayPhotoProps {
  className?: string;
  size?: number | string;
}

export default function AkshayPhoto({ className = '', size = '100%' }: AkshayPhotoProps) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center bg-[#FDFDFD] p-1 sm:p-2 select-none ${className}`}
      style={{ width: size, height: 'auto', aspectRatio: '2/3' }}
      id="akshay-photo-vector"
    >
      {/* Soft warm surrounding ambient background halo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F9F6F0] via-white to-[#F9F6F0] opacity-40 rounded-xl" />
      
      <svg
        viewBox="0 0 400 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
      >
        {/* Soft elegant warm glow around the head/torso area */}
        <circle cx="200" cy="360" r="140" fill="url(#radial-warm-glow)" opacity="0.35" />

        {/* Minimalist modern concentric circular thin frame in the upper background */}
        <circle cx="200" cy="300" r="180" stroke="#E6D3C0" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.4" />
        <circle cx="200" cy="300" r="120" stroke="#E6D3C0" strokeWidth="0.5" opacity="0.25" />

        {/* The yoga space floor and mat perspective */}
        {/* Floor subtle line */}
        <line x1="20" y1="520" x2="380" y2="520" stroke="#E5E5E5" strokeWidth="0.75" />
        
        {/* Charcoal yoga mat under perspective */}
        <polygon 
          points="20,518 380,518 350,545 50,545" 
          fill="#1C1B1A" 
          stroke="#413E3A" 
          strokeWidth="0.5" 
          opacity="0.95"
        />

        {/* THE YOGI FIGURE */}
        <g id="akshay-instructor-pose">
          {/* 1. Extended Left Leg flat/resting on mat */}
          {/* Leg skin & thigh */}
          <path 
            d="M 90,522 C 100,490 145,490 160,505 C 165,510 165,518 160,522 Z" 
            fill="#C99877" 
            opacity="0.9"
          />
          {/* Extended left foot */}
          <path 
            d="M 68,524 Q 75,515 88,520 Q 95,524 88,527 Q 75,527 68,524 Z" 
            fill="#C99877"
          />

          {/* 2. Taupe Yoga Pants (covering the seat and legs) */}
          {/* Main pants body and leg bend */}
          <path 
            d="M 120,522 C 130,470 215,470 240,490 C 255,502 245,523 230,523 C 190,523 150,523 120,522 Z" 
            fill="#807268" 
          />
          <path 
            d="M 110,518 C 120,465 185,465 210,480 L 212,520 L 140,520 Z" 
            fill="#8E7F74" 
          />
          
          {/* White Sporty Stripe on the side of the pants following the leg contour */}
          <path 
            d="M 120,512 C 133,474 195,474 220,490" 
            stroke="#FFFFFF" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Extra accent stripe next to it for athletic style */}
          <path 
            d="M 122,508 C 134,478 190,478 212,492" 
            stroke="#DFD8D3" 
            strokeWidth="1" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.75"
          />

          {/* 3. Shirtless Torso and Spinal Arch */}
          {/* Hips / Lower belly */}
          <path 
            d="M 210,480 C 220,455 210,442 200,436 C 190,445 185,465 210,480 Z" 
            fill="#C99877" 
          />
          
          {/* Arching Upper Torso (bent backward towards the left) */}
          {/* Back muscles, shoulder blade & ribcage */}
          <path 
            d="M 200,436 C 180,410 150,380 180,355 C 195,355 215,385 212,410 C 210,425 210,436 200,436 Z" 
            fill="#C99877" 
            id="back-arch"
          />
          {/* Muscle Highlights */}
          <path 
            d="M 194,428 C 182,412 162,392 182,374" 
            stroke="#DBAD8F" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Chest & Abdominals defined contour */}
          <path 
            d="M 212,410 C 215,388 205,372 195,368 C 185,372 198,395 212,410 Z" 
            fill="#B28260" 
            opacity="0.4"
          />

          {/* 4. Left Arm (reaching backward up and grasping ankle) */}
          <path 
            d="M 185,360 C 182,340 180,320 220,314 C 235,314 240,328 240,345 C 240,370 215,360 185,360 Z" 
            fill="none" 
          />
          <path 
            d="M 190,360 Q 200,320 225,322 Q 240,325 235,360" 
            stroke="#C99877" 
            strokeWidth="9" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" 
          />
          <path 
            d="M 190,360 Q 200,320 225,322 Q 240,325 235,360" 
            stroke="#DFA47D" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" 
          />

          {/* 5. Right Arm (reaching over & grasping) */}
          <path 
            d="M 188,358 Q 185,310 210,312 Q 225,315 220,370" 
            stroke="#B28260" 
            strokeWidth="9" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" 
          />
          <path 
            d="M 188,358 Q 185,310 210,312 Q 225,315 220,370" 
            stroke="#C99877" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" 
          />

          {/* 6. Advanced Leg Archer (leg locked behind head/upper torso) */}
          {/* Calf and thigh reaching up on the right and locking over */}
          <path 
            d="M 235,488 Q 260,440 250,380 Q 245,350 224,342" 
            stroke="#8E7F74" 
            strokeWidth="11" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Pants coverage for the upper leg */}
          <path 
            d="M 235,488 Q 260,440 250,380 Q 245,350 224,342" 
            stroke="#FFFFFF" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.9"
          />

          {/* Bare skin of ankle/foot locked in hand grasp */}
          <path 
            d="M 226,344 Q 220,332 215,338 Q 212,344 220,350 Z" 
            fill="#C99877" 
          />
          {/* Toes details on foot */}
          <circle cx="212" cy="336" r="1.5" fill="#C99877" />
          <circle cx="214" cy="334" r="1.2" fill="#DFA47D" />
          <circle cx="216" cy="333" r="1.1" fill="#DFA47D" />

          {/* 7. Neck & Head Details */}
          {/* Strong neck straining back/upwards */}
          <path 
            d="M 174,364 Q 164,374 156,380 Q 164,388 174,380 Z" 
            fill="#C99877" 
          />
          <path 
            d="M 173,365 Q 163,375 157,381" 
            stroke="#DFD8D3" 
            strokeWidth="1" 
            fill="none" 
            opacity="0.3"
          />

          {/* Head profile (shirtless yogi facing right and slightly up, tucked in arch) */}
          {/* Head skin */}
          <path 
            d="M 156,380 C 148,382 144,390 146,398 C 148,406 156,410 164,406 C 172,402 170,390 164,384 Z" 
            fill="#C99877" 
          />
          {/* Beard detail */}
          <path 
            d="M 148,402 C 150,410 158,410 162,406 L 157,398 Z" 
            fill="#1C1B1A" 
            opacity="0.85" 
          />
          
          {/* Dark curly curly hair locks cascade */}
          {/* Back/top hair shape */}
          <path 
            d="M 164,382 C 168,375 178,380 182,388 C 182,394 176,398 171,400 Z" 
            fill="#1C1B1A" 
          />
          {/* Individual curls and curly silhouette */}
          <circle cx="164" cy="380" r="4.5" fill="#1C1B1A" />
          <circle cx="170" cy="378" r="5" fill="#282522" />
          <circle cx="175" cy="382" r="5" fill="#1C1B1A" />
          <circle cx="178" cy="388" r="4.5" fill="#282522" />
          <circle cx="179" cy="394" r="4" fill="#1C1B1A" />
          
          <circle cx="161" cy="383" r="3.5" fill="#1C1B1A" />
          <circle cx="166" cy="380" r="3" fill="#3D3732" />
          <circle cx="171" cy="381" r="3.5" fill="#3D3732" />
          <circle cx="176" cy="386" r="3" fill="#1C1B1A" />
          
          {/* Accent curl rings for realistic curly texture */}
          <path d="M 163,378 Q 165,376 167,379" stroke="#524A42" strokeWidth="0.8" fill="none" />
          <path d="M 169,376 Q 172,374 173,378" stroke="#524A42" strokeWidth="0.8" fill="none" />
          <path d="M 174,380 Q 177,378 178,382" stroke="#524A42" strokeWidth="0.8" fill="none" />
        </g>

        {/* Elegant clean signature/stamp representing Blees Yoga Studio in the lower corner */}
        <g id="studio-seal" transform="translate(305, 470)" opacity="0.8">
          <circle cx="20" cy="20" r="16" stroke="#DFB283" strokeWidth="0.5" strokeDasharray="1 2" />
          <path d="M 20,10 L 20,30" stroke="#DFB283" strokeWidth="0.5" opacity="0.6" />
          <path d="M 10,20 L 30,20" stroke="#DFB283" strokeWidth="0.5" opacity="0.6" />
          <circle cx="20" cy="20" r="2" fill="#DFB283" />
        </g>

        {/* GRADIENTS DEF */}
        <defs>
          <radialGradient id="radial-warm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F9F1E6" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

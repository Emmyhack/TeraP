'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full animate-float-slow"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-br from-pink-400/15 to-red-500/15 rounded-full animate-float-medium"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full animate-float-fast"></div>
      <div className="absolute top-1/3 right-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400/15 to-orange-500/15 rounded-full animate-float-slow"></div>
      <div className="absolute bottom-1/3 right-1/5 w-28 h-28 bg-gradient-to-br from-indigo-400/15 to-blue-600/15 rounded-full animate-float-medium"></div>

      {/* Animated gradient waves */}
      <div className="absolute inset-0">
        <svg className="w-full h-full" viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.08)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.04)" />
            </linearGradient>
          </defs>
          
          <path
            className="animate-wave-slow"
            fill="url(#wave1)"
            d="M0,160L48,186.7C96,213,192,267,288,277.3C384,288,480,256,576,229.3C672,203,768,181,864,181.3C960,181,1056,203,1152,208C1248,213,1344,203,1392,197.3L1440,192L1440,800L1392,800C1344,800,1248,800,1152,800C1056,800,960,800,864,800C768,800,672,800,576,800C480,800,384,800,288,800C192,800,96,800,48,800L0,800Z"
          />
          
          <path
            className="animate-wave-medium"
            fill="url(#wave2)"
            d="M0,320L48,309.3C96,299,192,277,288,277.3C384,277,480,299,576,293.3C672,288,768,256,864,240C960,224,1056,224,1152,234.7C1248,245,1344,267,1392,277.3L1440,288L1440,800L1392,800C1344,800,1248,800,1152,800C1056,800,960,800,864,800C768,800,672,800,576,800C480,800,384,800,288,800C192,800,96,800,48,800L0,800Z"
          />
        </svg>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-white/30 rounded-full animate-particle-${i % 3 === 0 ? 'slow' : i % 3 === 1 ? 'medium' : 'fast'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
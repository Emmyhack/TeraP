'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ size = 'lg', inline = false, text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3', 
    lg: 'w-16 h-16 border-4'
  };

  const spinnerClasses = `${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`;
  const overlaySpinnerClasses = `absolute inset-0 ${sizeClasses[size]} border-transparent border-r-accent-500 rounded-full animate-spin animate-reverse`;

  if (inline || size === 'sm') {
    return (
      <div className={`flex items-center justify-center ${className}`.trim()}>
        <div className="relative">
          <div className={spinnerClasses}></div>
          <div className={overlaySpinnerClasses}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 ${className}`.trim()}>
      <div className="text-center">
        <div className="relative">
          <div className={spinnerClasses}></div>
          <div className={overlaySpinnerClasses}></div>
        </div>
        {text && <p className="mt-4 text-neutral-600 font-medium">{text}</p>}
        {!text && size === 'lg' && <p className="mt-4 text-neutral-600 font-medium">Loading TeraP...</p>}
      </div>
    </div>
  );
}
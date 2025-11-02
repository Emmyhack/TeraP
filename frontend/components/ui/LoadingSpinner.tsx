'use client';

import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-accent-500 rounded-full animate-spin animate-reverse"></div>
        </div>
        <p className="mt-4 text-neutral-600 font-medium">Loading TeraP...</p>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import WellnessCircles from '../../components/wellness/WellnessCircles';

export default function WellnessPage() {
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'wellness-circles') router.push('/wellness');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-gray-900">Wellness Circles</h1>
              <p className="mt-2 text-gray-600">
                Join supportive communities focused on specific wellness goals and challenges. Circles, memberships and stakes live on-chain.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button onClick={() => router.push('/wellness/create')} className="btn-primary btn-sm">
                Create Circle
              </button>
            </div>
          </div>

          <WellnessCircles />
        </div>
      </main>
      <Footer />
    </div>
  );
}

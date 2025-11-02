'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/navigation/Navigation';
import Footer from '../../../components/ui/Footer';
import SessionBooking from '../../../components/booking/SessionBooking';
import { useApp } from '../../../stores/AppProvider';

export default function BookSessionPage() {
  const { state } = useApp();
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'book-session') router.push('/client/book-session');
  };

  if (!state.user?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="book-session" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="card card-hover text-center">
              <div className="text-indigo-500 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Book a Session
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to book therapy sessions with verified therapists.
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navigation currentPage="book-session" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="btn-ghost mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Book a Therapy Session
            </h1>
            <p className="mt-2 text-gray-600">
              Choose from verified therapists and schedule your session.
            </p>
          </div>
          <SessionBooking />
        </div>
      </main>
      <Footer />
    </div>
  );
}
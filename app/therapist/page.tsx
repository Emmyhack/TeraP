'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import TherapistDashboard from '../../components/dashboard/TherapistDashboard';
import { useApp } from '../../stores/AppProvider';

export default function TherapistPage() {
  const { state } = useApp();
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
  };

  // Check if user is connected and is a therapist
  const isTherapist = state.user?.profile && state.user?.isTherapist;

  if (!state.user?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="card card-hover text-center">
              <div className="text-indigo-500 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Therapist Dashboard
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to access your therapist dashboard and manage your practice.
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

  if (!isTherapist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="card card-hover text-center">
              <div className="text-amber-500 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Therapist Registration Required
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                You need to register as a therapist to access this dashboard. Please complete your therapist profile and credential verification.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/therapist/register')}
                  className="btn-primary mr-4"
                >
                  Register as Therapist
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="btn-secondary"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Therapist Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your practice, sessions, and earnings on the TeraP platform.
            </p>
          </div>
          <TherapistDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
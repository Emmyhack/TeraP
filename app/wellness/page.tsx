'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import WellnessCircles from '../../components/wellness/WellnessCircles';
import { useApp } from '../../stores/AppProvider';

export default function WellnessPage() {
  const { state } = useApp();
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'wellness-circles') router.push('/wellness');
  };

  if (!state.user.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="card card-hover text-center">
              <div className="text-indigo-500 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Wellness Circles
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to join wellness circles and participate in community support groups.
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
      <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Wellness Circles
            </h1>
            <p className="mt-2 text-gray-600">
              Join supportive communities focused on specific wellness goals and challenges.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Circles
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {state.platform?.totalCircles || 12}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Circles Joined
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {state.user?.wellnessCircles?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Your Reputation
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {state.user?.reputation || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h2 className="text-xl font-semibold text-gray-900">Available Circles</h2>
                <p className="mt-2 text-sm text-gray-700">
                  Browse and join wellness circles that match your interests and goals.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  onClick={() => router.push('/wellness/create')}
                  className="btn-primary btn-sm"
                >
                  Create Circle
                </button>
              </div>
            </div>
          </div>

          <WellnessCircles />
        </div>
      </main>
      <Footer />
    </div>
  );
}
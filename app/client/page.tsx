'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import ClientDashboard from '../../components/dashboard/ClientDashboard';
import { useApp } from '../../stores/AppProvider';

export default function ClientPage() {
  const { state } = useApp();
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'client-dashboard') router.push('/client');
  };

  // Show authentication prompt if user not logged in
  if (!state.user?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="client-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Client Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please create your anonymous identity to access the client dashboard
            </p>
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <p className="text-gray-700 mb-4">
                Connect your wallet and create an anonymous identity to start your wellness journey.
              </p>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <Navigation currentPage="client-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Wellness Journey
            </h1>
            <p className="mt-2 text-xl text-gray-600">
              Track your progress, manage sessions, and connect with your wellness community across all chains.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* User Identity Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Identity Status</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Anonymous Identity Active</span>
                </div>
                <div className="text-sm text-gray-500">
                  ID: {state.user?.profile?.id?.slice(0, 8)}...
                </div>
              </div>
            </div>
            
            {/* Platform Features */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Platform Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/client/book-session')}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
                >
                  <div className="text-blue-600 font-semibold">Book Session</div>
                  <div className="text-sm text-gray-600">Schedule therapy</div>
                </button>
                <button
                  onClick={() => router.push('/wellness')}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-all"
                >
                  <div className="text-green-600 font-semibold">Wellness Circles</div>
                  <div className="text-sm text-gray-600">Join communities</div>
                </button>
                <button
                  onClick={() => router.push('/dao')}
                  className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-all"
                >
                  <div className="text-purple-600 font-semibold">DAO Governance</div>
                  <div className="text-sm text-gray-600">Vote & propose</div>
                </button>
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="text-yellow-600 font-semibold">Tokens</div>
                  <div className="text-sm text-gray-600">Balance: 0 TRP</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Client Dashboard */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <ClientDashboard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
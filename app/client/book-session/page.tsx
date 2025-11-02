'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Heart, Shield, ArrowLeft, Clock, Users } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
        <Navigation currentPage="book-session" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
                Professional Therapy
                <span className="block text-3xl bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent mt-2">
                  When You Need It
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Connect with licensed mental health professionals through our secure, private platform
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Verified Professionals</h3>
                <p className="text-sm text-neutral-600">All therapists are licensed and DAO-verified</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Clock className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Flexible Scheduling</h3>
                <p className="text-sm text-neutral-600">Book sessions that fit your schedule</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Heart className="w-8 h-8 text-accent-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Compassionate Care</h3>
                <p className="text-sm text-neutral-600">Empathetic support for your wellness journey</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-4">Ready to Connect?</h2>
              <p className="text-lg mb-8 opacity-95">
                Create your secure identity to access our network of professional therapists
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
              >
                <span>Get Started</span>
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      <Navigation currentPage="book-session" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">
                  Book Therapy Session
                </h1>
                <p className="text-lg text-neutral-600 mt-1">
                  Connect with licensed mental health professionals
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-primary-500/10 to-purple-600/10 rounded-2xl p-4 border border-primary-200/50">
              <p className="text-neutral-700">
                Choose from our network of verified therapists and schedule sessions that fit your needs and schedule.
              </p>
            </div>
          </div>

          {/* Session Booking Component */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <SessionBooking />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Users, AlertTriangle, TrendingUp, Calendar, Award, DollarSign } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
        <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
                Professional Practice
                <span className="block text-3xl bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent mt-2">
                  Management
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join our network of licensed therapists and manage your practice with cutting-edge Web3 technology
              </p>
            </div>

            {/* Professional Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Secure Practice</h3>
                <p className="text-sm text-neutral-600">HIPAA-compliant with blockchain security</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Users className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Global Reach</h3>
                <p className="text-sm text-neutral-600">Connect with clients across all networks</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <TrendingUp className="w-8 h-8 text-accent-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Grow Practice</h3>
                <p className="text-sm text-neutral-600">Analytics and community-driven growth</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-4">Ready to Start?</h2>
              <p className="text-lg mb-8 opacity-95">
                Connect your wallet to access the professional therapist dashboard
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
              >
                <span>Connect Wallet</span>
                <Heart className="w-5 h-5" />
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
        <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            {/* Registration Required Section */}
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
                Professional Registration
                <span className="block text-3xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mt-2">
                  Required
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Complete your professional verification to access the therapist dashboard and start practicing on TeraP
              </p>
            </div>

            {/* Registration Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">DAO Verification</h3>
                <p className="text-sm text-neutral-600">Community-verified credentials and licensing</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Award className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Professional Status</h3>
                <p className="text-sm text-neutral-600">Verified therapist badge and credentials</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <DollarSign className="w-8 h-8 text-accent-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Earn TERAP</h3>
                <p className="text-sm text-neutral-600">Get paid in tokens for professional services</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-4">Join Our Network</h2>
              <p className="text-lg mb-8 opacity-95">
                Register as a licensed therapist and help transform mental healthcare
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/therapist/register')}
                  className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <span>Register as Therapist</span>
                  <Award className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="border-2 border-white/70 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white"
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Professional Header */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">
                  Professional Dashboard
                </h1>
                <p className="text-lg text-neutral-600 mt-1">
                  Manage your practice and help clients across the network
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary-500/10 to-purple-600/10 rounded-2xl p-4 border border-primary-200/50">
              <p className="text-neutral-700">
                Monitor your sessions, track earnings, and maintain professional excellence on the TeraP platform.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Sessions</h3>
                  <div className="text-2xl font-bold text-primary-600">24</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">This month</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Active Clients</h3>
                  <div className="text-2xl font-bold text-emerald-600">18</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Regular clients</p>
            </div>

            <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Earnings</h3>
                  <div className="text-2xl font-bold text-accent-600">5,420</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">TERAP tokens</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Rating</h3>
                  <div className="text-2xl font-bold text-purple-600">4.9</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Client satisfaction</p>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <TherapistDashboard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
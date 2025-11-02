'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Calendar, Users, Brain, TrendingUp, Award, Bell } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
        <Navigation currentPage="client-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
                Your Wellness Journey
                <span className="block text-3xl bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent mt-2">
                  Starts Here
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Access your personalized mental health dashboard with complete privacy and professional support
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Private & Secure</h3>
                <p className="text-sm text-neutral-600">Anonymous identity with end-to-end encryption</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Brain className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Professional Care</h3>
                <p className="text-sm text-neutral-600">Licensed therapists and evidence-based treatment</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Users className="w-8 h-8 text-accent-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Community Support</h3>
                <p className="text-sm text-neutral-600">Connect with others on similar wellness journeys</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-4">Ready to Begin?</h2>
              <p className="text-lg mb-8 opacity-95">
                Create your secure, anonymous identity and take the first step toward better mental health
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
              >
                <span>Start Your Journey</span>
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
      <Navigation currentPage="client-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">
                  My Wellness Journey
                </h1>
                <p className="text-lg text-neutral-600 mt-1">
                  Your personalized mental health dashboard
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary-500/10 to-purple-600/10 rounded-2xl p-4 border border-primary-200/50">
              <p className="text-neutral-700">
                Track your progress, manage sessions, and connect with your wellness community with complete privacy and professional support.
              </p>
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="grid lg:grid-cols-4 gap-6 mb-10">
            {/* Identity Status */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Identity Status</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-emerald-700">Secure & Private</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-neutral-600 bg-white/60 rounded-lg p-2">
                ID: {state.user?.profile?.id?.slice(0, 12)}...
              </div>
            </div>
            
            {/* Session Stats */}
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Sessions</h3>
                  <div className="text-2xl font-bold text-primary-600">12</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">This month</p>
            </div>

            {/* Progress Indicator */}
            <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Progress</h3>
                  <div className="text-2xl font-bold text-accent-600">85%</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Wellness goals</p>
            </div>

            {/* Notifications */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Updates</h3>
                  <div className="text-2xl font-bold text-purple-600">3</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">New notifications</p>
            </div>
          </div>
          
          {/* Action Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-display font-bold text-neutral-800 mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/client/book-session')}
                  className="group bg-gradient-to-br from-primary-50 to-purple-50 hover:from-primary-100 hover:to-purple-100 rounded-2xl p-6 border border-primary-200/50 hover:border-primary-300/50 transition-all duration-300 shadow-lg hover:shadow-xl text-left"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-800">Book Therapy Session</div>
                      <div className="text-sm text-neutral-600">Schedule with verified therapists</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/wellness')}
                  className="group bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl p-6 border border-emerald-200/50 hover:border-emerald-300/50 transition-all duration-300 shadow-lg hover:shadow-xl text-left"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-800">Join Wellness Circles</div>
                      <div className="text-sm text-neutral-600">Connect with support communities</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dao')}
                  className="group bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-2xl p-6 border border-purple-200/50 hover:border-purple-300/50 transition-all duration-300 shadow-lg hover:shadow-xl text-left"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-800">DAO Governance</div>
                      <div className="text-sm text-neutral-600">Vote on platform decisions</div>
                    </div>
                  </div>
                </button>

                <div className="group bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg text-left">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-800">TERAP Tokens</div>
                      <div className="text-sm text-neutral-600">Balance: 1,250 TRP</div>
                    </div>
                  </div>
                  <div className="text-xs text-accent-600 bg-white/60 rounded-lg p-2">
                    Earn more through participation
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-800 mb-6">Recent Activity</h2>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-primary-50/50 rounded-xl">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-800">Session completed</div>
                      <div className="text-xs text-neutral-600">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-emerald-50/50 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-800">Joined wellness circle</div>
                      <div className="text-xs text-neutral-600">1 day ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50/50 rounded-xl">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-800">Voted on proposal</div>
                      <div className="text-xs text-neutral-600">3 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Dashboard */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <ClientDashboard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { Heart, Brain, ArrowRight, Shield, Globe, Users, MessageCircle, Zap, Lock, Sparkles, Activity, UserCheck } from 'lucide-react';

export default function Hero() {
  const router = useRouter();
  const { isConnected, connectWallet } = useWeb3Wallet();
  const { contracts, isConfigured } = useTeraP();
  const platform = useContractQuery(() => contracts.getPlatformStats(), [contracts], { enabled: isConfigured });
  const stats = platform.data && !platform.loading ? platform.data : null;
  
  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleExplore = () => router.push('/client/book-session');
  const handleLearnMore = () => router.push('/resources');

  return (
    <section className="relative min-h-screen bg-primary-50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
          
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200 shadow-lg">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600">
                ZetaChain Universal App
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-neutral-800">Mental</span>
                <span className="block text-primary-600">
                  Wellness
                </span>
                <span className="block text-neutral-800">Reimagined</span>
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-xl text-neutral-600 leading-relaxed max-w-lg">
                Connect with verified therapists, join supportive communities, and take control of your mental health journey through our 
                <span className="font-semibold text-primary-600"> privacy-first, blockchain-powered</span> wellness platform.
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-neutral-500">
                <div className="flex items-center space-x-1">
                  <Lock className="w-4 h-4" />
                  <span>Zero-Knowledge Privacy</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Cross-Chain Payments</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="group relative px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button 
                  onClick={handleExplore}
                  className="group relative px-8 py-4 bg-accent-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <span>Explore Platform</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              )}
              
              <button 
                onClick={handleLearnMore}
                className="px-8 py-4 border-2 border-primary-500 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-300"
              >
                Learn More
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-8">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-accent-400 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-primary-400 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm text-neutral-600 font-medium">{stats ? stats.sessions.toLocaleString() : '—'} sessions booked</span>
              </div>
              <div className="flex items-center space-x-1">
                <UserCheck className="w-4 h-4 text-accent-600" />
                <span className="text-sm text-neutral-600 ml-1">{stats ? stats.verifiedTherapists.toLocaleString() : '—'} verified therapists</span>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="relative">
            {/* Main Illustration Container */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
              
              {/* Therapy Session Illustration */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800">Secure Session</h3>
                      <p className="text-sm text-neutral-500">End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Active</span>
                  </div>
                </div>

                {/* Chat Interface Mockup */}
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-neutral-700">How are you feeling today? Remember, this space is completely private and secure.</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 justify-end">
                    <div className="flex-1 bg-primary-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-12">
                      <p className="text-sm text-white">I&apos;ve been struggling with anxiety lately, but I feel safe talking here.</p>
                    </div>
                    <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-primary-50 rounded-xl p-4">
                    <Shield className="w-6 h-6 text-primary-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">ZK Privacy</h4>
                    <p className="text-xs text-neutral-600">Anonymous & secure</p>
                  </div>
                  <div className="bg-accent-50 rounded-xl p-4">
                    <Globe className="w-6 h-6 text-accent-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">Cross-Chain</h4>
                    <p className="text-xs text-neutral-600">Multi-blockchain</p>
                  </div>
                  <div className="bg-accent-50 rounded-xl p-4">
                    <MessageCircle className="w-6 h-6 text-accent-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">Real-time Chat</h4>
                    <p className="text-xs text-neutral-600">Instant support</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-4">
                    <Activity className="w-6 h-6 text-primary-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">Mood Tracking</h4>
                    <p className="text-xs text-neutral-600">AI insights</p>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                <Brain className="w-8 h-8 text-white" />
              </div>
              
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center shadow-lg transform -rotate-12">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Blockchain Network Indicators */}
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 space-y-4">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">ETH</span>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">BTC</span>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">ZET</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
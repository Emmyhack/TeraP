'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { Heart, Brain, ArrowRight, Shield, Globe, Users, Link, MessageCircle, Zap, Lock, Star, Sparkles, Activity } from 'lucide-react';

export default function Hero() {
  const router = useRouter();
  const { isConnected, connectWallet } = useWeb3Wallet();
  const { state, dispatch } = useApp();
  
  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleExplore = () => {
    // Navigate to book session page
    window.location.href = '#book-session';
    setTimeout(() => {
      const event = new CustomEvent('navigate', { detail: 'book-session' });
      window.dispatchEvent(event);
    }, 100);
  };

  const handleLearnMore = () => {
    // Navigate to resources page
    window.location.href = '#resources';
    setTimeout(() => {
      const event = new CustomEvent('navigate', { detail: 'resources' });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary-200/30 to-primary-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-accent-200/25 to-accent-300/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
          
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200 shadow-lg">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                ZetaChain Universal App
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-neutral-800">Mental</span>
                <span className="block bg-gradient-to-r from-primary-600 via-purple-600 to-accent-600 bg-clip-text text-transparent">
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
                  className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button 
                  onClick={handleExplore}
                  className="group relative px-8 py-4 bg-gradient-to-r from-accent-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <span>Explore Platform</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              )}
              
              <button 
                onClick={handleLearnMore}
                className="px-8 py-4 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:border-primary-500 hover:text-primary-600 transition-all duration-300 hover:bg-white/50"
              >
                Learn More
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-8">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm text-neutral-600 font-medium">1,200+ active users</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm text-neutral-600 ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="relative">
            {/* Main Illustration Container */}
            <div className="relative bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
              
              {/* Therapy Session Illustration */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
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
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-neutral-700">How are you feeling today? Remember, this space is completely private and secure.</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 justify-end">
                    <div className="flex-1 bg-primary-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-12">
                      <p className="text-sm text-white">I've been struggling with anxiety lately, but I feel safe talking here.</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4">
                    <Shield className="w-6 h-6 text-primary-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">ZK Privacy</h4>
                    <p className="text-xs text-neutral-600">Anonymous & secure</p>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4">
                    <Globe className="w-6 h-6 text-accent-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">Cross-Chain</h4>
                    <p className="text-xs text-neutral-600">Multi-blockchain</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <MessageCircle className="w-6 h-6 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">Real-time Chat</h4>
                    <p className="text-xs text-neutral-600">Instant support</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <Activity className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-sm text-neutral-800">Mood Tracking</h4>
                    <p className="text-xs text-neutral-600">AI insights</p>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                <Brain className="w-8 h-8 text-white" />
              </div>
              
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-12">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Blockchain Network Indicators */}
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">ETH</span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">BTC</span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">ZET</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
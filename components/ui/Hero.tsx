'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { Heart, Brain, ArrowRight, Shield, Globe, Users, Link } from 'lucide-react';

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
    if (state.user?.profile) {
      // User has profile, navigate to their dashboard
      if (state.user.isTherapist) {
        router.push('/therapist');
      } else {
        router.push('/client');
      }
    } else {
      // User needs to create identity first
      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'profile' });
    }
  };

  const handleLearnMore = () => {
    // Scroll to features section or navigate to about page
    const featuresElement = document.getElementById('features');
    if (featuresElement) {
      featuresElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 wellness-gradient rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 growth-gradient rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Hero Content */}
          <div className="flex justify-center items-center mb-8">
            <div className="relative">
              <Heart className="w-16 h-16 text-primary-500" />
              <Brain className="w-8 h-8 text-accent-500 absolute -top-2 -right-2" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-neutral-800 mb-6">
            <span className="text-primary-600">Healing,</span>{' '}
            <span className="text-accent-600">Together</span>
          </h1>

          <p className="text-xl sm:text-2xl text-neutral-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            TeraP Universal is a <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ZetaChain-powered</span> wellness DAO 
            bridging mental health care with cross-chain Web3 incentives. Connect with verified therapists, 
            join supportive communities, and own your wellness journey across 
            <span className="font-semibold text-primary-600"> Ethereum, Solana, Sui, TON, Bitcoin & more</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <span>Connect & Start</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleExplore}
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <span>Explore Platform</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={handleLearnMore}
              className="btn-outline text-lg px-8 py-4 border-2 border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
            >
              Learn More
            </button>
          </div>

          {/* Key Features Pills */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full border-2 border-indigo-200 shadow-lg">
              <Link className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-700">ZetaChain Omnichain</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full border-2 border-green-200 shadow-lg">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-gray-700">Privacy-First</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full border-2 border-purple-200 shadow-lg">
              <Globe className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-gray-700">Multi-Chain</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full border-2 border-blue-200 shadow-lg">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-700">DAO Governed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
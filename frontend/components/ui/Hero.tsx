'use client';

import React from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { Heart, Brain, ArrowRight, Shield, Globe, Users } from 'lucide-react';

export default function Hero() {
  const { state: walletState, actions: walletActions } = useWallet();

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
            TeraP is a decentralized wellness DAO bridging mental health care with Web3 incentives.
            Connect with verified therapists, join supportive communities, and own your wellness journey
            across <span className="font-semibold text-primary-600">Solana, Sui, TON, and beyond</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {!walletState.activeWallet ? (
              <button
                onClick={walletActions.connectEVM}
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2">
                <span>Explore Platform</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            
            <button className="btn-outline text-lg px-8 py-4">
              Learn More
            </button>
          </div>

          {/* Key Features Pills */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-neutral-200">
              <Shield className="w-4 h-4 text-primary-500" />
              <span className="font-medium text-neutral-700">Privacy-First</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-neutral-200">
              <Globe className="w-4 h-4 text-accent-500" />
              <span className="font-medium text-neutral-700">Cross-Chain</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-neutral-200">
              <Users className="w-4 h-4 text-wellness-peace" />
              <span className="font-medium text-neutral-700">Community-Governed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
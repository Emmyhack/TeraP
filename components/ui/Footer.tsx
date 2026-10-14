'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Brain, Github } from 'lucide-react';
import { CHAIN } from '@/config/contracts';

const GITHUB_URL = 'https://github.com/Emmyhack/TeraP';

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Heart className="w-8 h-8 text-primary-400" />
                <Brain className="w-4 h-4 text-accent-400 absolute -top-1 -right-1" />
              </div>
              <div className="text-2xl font-display font-bold">TeraP</div>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Healing, Together. A decentralized wellness DAO bridging mental health care with Web3
              incentives on ZetaChain.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><Link href="/therapist" className="hover:text-white transition-colors">Therapists</Link></li>
              <li><Link href="/client/book-session" className="hover:text-white transition-colors">Book a Session</Link></li>
              <li><Link href="/wellness" className="hover:text-white transition-colors">Wellness Circles</Link></li>
              <li><Link href="/dao" className="hover:text-white transition-colors">DAO Governance</Link></li>
              <li><Link href="/client/subscription" className="hover:text-white transition-colors">Subscriptions</Link></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="font-semibold mb-4">Developers</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><Link href="/documentation" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/smart-contracts" className="hover:text-white transition-colors">Smart Contracts</Link></li>
              <li><Link href="/apis" className="hover:text-white transition-colors">APIs</Link></li>
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Network */}
          <div>
            <h3 className="font-semibold mb-4">Network</h3>
            <ul className="space-y-2 text-neutral-300 text-sm">
              <li>{CHAIN.name} (chain id {CHAIN.id})</li>
              {CHAIN.explorerUrl && (
                <li>
                  <a href={CHAIN.explorerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Block explorer
                  </a>
                </li>
              )}
              <li className="text-neutral-400">
                Deposits from Bitcoin, Ethereum, Solana and other connected chains arrive through the
                ZetaChain gateway.
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-neutral-700 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-neutral-400 text-sm">
            TeraP. Open source under the MIT license.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

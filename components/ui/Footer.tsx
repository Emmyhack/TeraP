'use client';

import React from 'react';
import { Heart, Brain, Github, Twitter, Mail } from 'lucide-react';

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
              Healing, Together. A decentralized wellness DAO bridging mental health care 
              with Web3 incentives across multiple blockchains.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><a href="#" className="hover:text-white transition-colors">Find Therapists</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Wellness Circles</a></li>
              <li><a href="#" className="hover:text-white transition-colors">DAO Governance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TERAP Token</a></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="font-semibold mb-4">Developers</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Smart Contracts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">APIs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
            </ul>
          </div>
        </div>

        <hr className="border-neutral-700 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-neutral-400 text-sm">
            © 2025 TeraP. Building the future of decentralized wellness.
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Supported Chains */}
        <div className="mt-8 pt-8 border-t border-neutral-700">
          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-4">Supported Blockchains</p>
            <div className="flex justify-center items-center space-x-8 text-neutral-500">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"></div>
                <span className="text-sm">ZetaChain</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                <span className="text-sm">Solana</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
                <span className="text-sm">Sui</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                <span className="text-sm">TON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
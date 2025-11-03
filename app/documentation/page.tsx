'use client';

import React from 'react';
import { Book, Code, Shield, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">TeraP Universal Documentation</h1>
          <p className="text-xl text-neutral-600">
            Complete guide to building on the TeraP decentralized wellness platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Book className="h-8 w-8 text-primary-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Getting Started</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Learn the basics of TeraP Universal and how to integrate with our platform.
            </p>
            <ul className="space-y-2 text-neutral-700">
              <li>• Platform Overview</li>
              <li>• Wallet Connection</li>
              <li>• Token Economics</li>
              <li>• Cross-Chain Setup</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="h-8 w-8 text-accent-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Smart Contracts</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Interact with TeraP's smart contracts across multiple blockchains.
            </p>
            <ul className="space-y-2 text-neutral-700">
              <li>• TeraPToken Contract</li>
              <li>• TeraPCore Functions</li>
              <li>• Cross-Chain Calls</li>
              <li>• Event Listening</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Security</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Best practices for secure integration and user privacy protection.
            </p>
            <ul className="space-y-2 text-neutral-700">
              <li>• Encryption Standards</li>
              <li>• Privacy Controls</li>
              <li>• Audit Reports</li>
              <li>• Bug Bounty Program</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-8 w-8 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">APIs</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              RESTful APIs and WebSocket connections for real-time features.
            </p>
            <ul className="space-y-2 text-neutral-700">
              <li>• Authentication</li>
              <li>• Session Management</li>
              <li>• Real-time Chat</li>
              <li>• Payment Processing</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-neutral-800 mb-6">Contract Addresses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">ZetaChain Athens Testnet</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">TeraPToken:</span>
                  <code className="text-primary-600">0x301f106a714cD1b5524D9F9EEa6241fE4BBF14d0</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">TeraPCore:</span>
                  <code className="text-primary-600">0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Gateway:</span>
                  <code className="text-primary-600">0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7</code>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Network Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Chain ID:</span>
                  <span className="text-neutral-800">7001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">RPC URL:</span>
                  <span className="text-neutral-800">zetachain-athens-evm.blockpi.network</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Explorer:</span>
                  <span className="text-neutral-800">athens.explorer.zetachain.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
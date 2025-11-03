'use client';

import React from 'react';
import { Code, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SmartContracts() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">Smart Contracts</h1>
          <p className="text-xl text-neutral-600">
            Deployed smart contracts powering the TeraP Universal platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">TeraPToken</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              ERC20 governance token with staking and voting capabilities
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Contract Address:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs text-primary-600">0x301f106a714cD1b5524D9F9EEa6241fE4BBF14d0</code>
                  <button onClick={() => copyToClipboard('0x301f106a714cD1b5524D9F9EEa6241fE4BBF14d0')}>
                    <Copy className="h-4 w-4 text-neutral-500 hover:text-neutral-700" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Network:</span>
                <span className="text-sm text-neutral-800">ZetaChain Athens Testnet</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Total Supply:</span>
                <span className="text-sm text-neutral-800">100,000,000 TERAP</span>
              </div>
            </div>
            <a 
              href="https://athens.explorer.zetachain.com/address/0x301f106a714cD1b5524D9F9EEa6241fE4BBF14d0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mt-4"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Explorer</span>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="h-6 w-6 text-accent-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">TeraPCore</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Main platform contract handling sessions, circles, and DAO functions
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Contract Address:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs text-primary-600">0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37</code>
                  <button onClick={() => copyToClipboard('0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37')}>
                    <Copy className="h-4 w-4 text-neutral-500 hover:text-neutral-700" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Network:</span>
                <span className="text-sm text-neutral-800">ZetaChain Athens Testnet</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Type:</span>
                <span className="text-sm text-neutral-800">ERC721 + Platform Logic</span>
              </div>
            </div>
            <a 
              href="https://athens.explorer.zetachain.com/address/0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mt-4"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Explorer</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-3xl font-bold text-neutral-800 mb-6">Key Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">TeraPToken Functions</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>• <code>stake(uint256 amount)</code> - Stake tokens for voting power</li>
                <li>• <code>unstake(uint256 stakeIndex)</code> - Unstake after lock period</li>
                <li>• <code>getVotingPower(address account)</code> - Get voting power</li>
                <li>• <code>calculateStakingReward(address user, uint256 stakeIndex)</code> - Calculate rewards</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">TeraPCore Functions</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>• <code>registerTherapist(...)</code> - Register as therapist</li>
                <li>• <code>bookSession(address therapist, uint256 duration, string notes)</code> - Book session</li>
                <li>• <code>createWellnessCircle(string name, uint256 entryStake)</code> - Create circle</li>
                <li>• <code>createProposal(...)</code> - Create DAO proposal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
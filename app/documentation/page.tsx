'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, Code, Shield, Zap } from 'lucide-react';
import { CHAIN } from '@/config/contracts';

const GITHUB_URL = 'https://github.com/Emmyhack/TeraP';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">TeraP Documentation</h1>
          <p className="text-xl text-neutral-600">
            How the platform is put together and how to run it yourself. The source is on{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
              GitHub
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Book className="h-8 w-8 text-primary-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Getting started</h2>
            </div>
            <ol className="space-y-2 text-neutral-700 list-decimal list-inside text-sm">
              <li>Install Foundry and Node 18+, then <code>npm install</code>.</li>
              <li>Copy <code>.env.example</code> to <code>.env.local</code> and set <code>PRIVATE_KEY</code>.</li>
              <li>Deploy with <code>npm run deploy:testnet</code>; addresses are written to <code>deployments/&lt;chainId&gt;.json</code>.</li>
              <li>Paste those addresses into the <code>NEXT_PUBLIC_TERAP_*</code> variables and run <code>npm run dev</code>.</li>
              <li>After changing a contract, run <code>npm run abi</code> to refresh <code>config/abi/</code>.</li>
            </ol>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="h-8 w-8 text-accent-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Smart contracts</h2>
            </div>
            <p className="text-neutral-600 mb-4 text-sm">
              Six upgradeable (UUPS) contracts in <code>contracts/</code>. The frontend talks to them through a single
              integration layer, <code>services/TeraPContracts.ts</code>, and the <code>useTeraP()</code> hook.
            </p>
            <ul className="space-y-1 text-neutral-700 text-sm">
              <li>TeraPToken: ERC-20 with staking and voting power</li>
              <li>TeraPCore: therapists, sessions, wellness circles, treasury</li>
              <li>TeraPSubscription: prepaid therapy minutes</li>
              <li>TeraPGovernance: proposals and voting</li>
              <li>WellnessGameification: points, challenges, achievement NFTs</li>
              <li>ZKCredentialVerifier: credential commitments</li>
            </ul>
            <Link href="/smart-contracts" className="inline-block mt-4 text-primary-600 hover:text-primary-700 text-sm">
              Deployed addresses
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Privacy model</h2>
            </div>
            <ul className="space-y-2 text-neutral-700 text-sm">
              <li>Users act under an anonymous ZK identity derived from a wallet signature; no personal data is stored on-chain.</li>
              <li>Session notes and chat are encrypted client-side before they touch the chain or the network.</li>
              <li>Therapist credentials are stored as hashes/commitments and verified through DAO proposals.</li>
              <li>The contracts have not yet been externally audited. Use testnet funds.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-8 w-8 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">HTTP API</h2>
            </div>
            <p className="text-neutral-600 mb-4 text-sm">
              Three read-only JSON routes expose contract data without an RPC connection: therapists, a session by id,
              and platform statistics.
            </p>
            <Link href="/apis" className="text-primary-600 hover:text-primary-700 text-sm">
              API reference
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-neutral-800 mb-6">Network</h2>
          <div className="space-y-2 text-sm max-w-xl">
            <div className="flex justify-between">
              <span className="text-neutral-600">Network:</span>
              <span className="text-neutral-800">{CHAIN.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Chain ID:</span>
              <span className="text-neutral-800">{CHAIN.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">RPC URL:</span>
              <code className="text-neutral-800 break-all">{CHAIN.rpcUrl}</code>
            </div>
            {CHAIN.explorerUrl && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Explorer:</span>
                <a href={CHAIN.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                  {CHAIN.explorerUrl}
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-600">ZetaChain gateway:</span>
              <code className="text-neutral-800 break-all">{CHAIN.gateway}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Code, Copy, ExternalLink } from 'lucide-react';
import { ADDRESSES, CHAIN, CONTRACTS_CONFIGURED, explorerAddress } from '@/config/contracts';

type ContractKey = Exclude<keyof typeof ADDRESSES, 'Gateway'>;

const CONTRACTS: Array<{ key: ContractKey; description: string; functions: string[] }> = [
  {
    key: 'TeraPToken',
    description: 'ERC-20 platform token with staking, time-locked stakes and voting power.',
    functions: ['stake(uint256 amount)', 'unstake(uint256 stakeIndex)', 'getVotingPower(address)', 'calculateStakingReward(address, uint256)'],
  },
  {
    key: 'TeraPCore',
    description: 'Therapist registry, session booking and settlement, wellness circles and the DAO treasury.',
    functions: ['registerTherapist(...)', 'bookSession(address, uint256, uint256, string, bool)', 'completeSession(uint256, uint8)', 'createWellnessCircle(string, string, uint256)'],
  },
  {
    key: 'TeraPSubscription',
    description: 'Prepaid therapy-minute plans paid in TERAP; TeraPCore debits minutes when a session is booked with a subscription.',
    functions: ['getTiers()', 'subscribe(uint256 tierId, uint256 periods)', 'getSubscription(address)'],
  },
  {
    key: 'TeraPGovernance',
    description: 'Proposals and token-weighted voting: therapist verification, funding, parameter changes and emergency actions.',
    functions: ['createProposal(string, string, uint8, bytes)', 'vote(uint256, bool)', 'executeProposal(uint256)', 'proposalState(uint256)'],
  },
  {
    key: 'WellnessGameification',
    description: 'Wellness points, challenges and soulbound achievement NFTs.',
    functions: ['getUserStats(address)', 'unlockAchievement(uint256)', 'mintAchievementNFT(uint256)', 'redeemPoints(uint256)'],
  },
  {
    key: 'ZKCredentialVerifier',
    description: 'Stores therapist credential commitments so credentials can be checked without revealing them.',
    functions: ['submitCredentialCommitment(bytes32)', 'isUserVerified(address)'],
  },
];

function AddressRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  if (!address) {
    return <span className="text-sm text-neutral-500">Not configured on this deployment</span>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; the address is still visible */
    }
  };

  const explorer = explorerAddress(address);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <code className="text-xs text-primary-600 break-all">{address}</code>
      <button type="button" onClick={copy} title="Copy address" className="text-neutral-500 hover:text-neutral-700">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </button>
      {explorer && (
        <a href={explorer} target="_blank" rel="noopener noreferrer" title="View on explorer" className="text-neutral-500 hover:text-neutral-700">
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

export default function SmartContracts() {
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
            The contracts this frontend is configured to use on {CHAIN.name} (chain id {CHAIN.id}).
          </p>
          {!CONTRACTS_CONFIGURED && (
            <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No addresses are configured. Deploy with <code>npm run deploy:testnet</code> and copy{' '}
              <code>deployments/{CHAIN.id}.json</code> into <code>.env.local</code>.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {CONTRACTS.map(({ key, description, functions }) => (
            <div key={key} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Code className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-semibold text-neutral-800">{key}</h2>
              </div>
              <p className="text-neutral-600 mb-4 text-sm">{description}</p>
              <div className="p-3 bg-neutral-50 rounded-lg mb-4">
                <div className="text-xs text-neutral-500 mb-1">Proxy address</div>
                <AddressRow address={ADDRESSES[key]} />
              </div>
              <ul className="space-y-1 text-sm text-neutral-700">
                {functions.map((fn) => (
                  <li key={fn}>
                    <code>{fn}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mt-8 text-sm text-neutral-600">
          <p>
            ZetaChain gateway used for cross-chain deposits: <code className="break-all">{ADDRESSES.Gateway}</code>.
            Contracts are deployed behind UUPS proxies; ABIs live in <code>config/abi/</code> and are refreshed with{' '}
            <code>npm run abi</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

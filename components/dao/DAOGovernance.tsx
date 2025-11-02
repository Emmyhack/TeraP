// DAO Governance Component
'use client';

import React, { useState } from 'react';
import { Vote, DollarSign, Users, Clock, CheckCircle, X, TrendingUp } from 'lucide-react';
import { useZetaChainWallet } from '../wallet/ZetaChainWalletProvider';
import { useApp } from '../../stores/AppProvider';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  created: string;
  endDate: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  category: 'funding' | 'policy' | 'technical' | 'community';
  requiredQuorum: number;
  userVote?: 'for' | 'against' | null;
}

interface UserStake {
  amount: number;
  votingPower: number;
  rewards: number;
}

export function DAOGovernance() {
  const { connectedWallet } = useZetaChainWallet();
  const { dispatch } = useApp();
  const isConnected = !!connectedWallet;
  const address = connectedWallet?.address;
  const [activeTab, setActiveTab] = useState<'proposals' | 'staking' | 'treasury'>('proposals');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Mock data
  const [userStake] = useState<UserStake>({
    amount: 1500,
    votingPower: 3000, // 2x voting power for staked tokens
    rewards: 45.3
  });

  const [proposals] = useState<Proposal[]>([
    {
      id: '1',
      title: 'Increase Therapist Verification Standards',
      description: 'Proposal to implement additional verification requirements for therapist onboarding, including peer reviews and continuous education requirements.',
      proposer: '0x1234...5678',
      created: '2025-10-25',
      endDate: '2025-11-05',
      status: 'active',
      votesFor: 12500,
      votesAgainst: 3200,
      totalVotes: 15700,
      category: 'policy',
      requiredQuorum: 10000,
      userVote: null
    },
    {
      id: '2',
      title: 'Fund Mental Health Crisis Support Program',
      description: 'Allocate 50,000 TERAP tokens to develop and maintain a 24/7 crisis support system with trained volunteers.',
      proposer: '0xabcd...ef12',
      created: '2025-10-20',
      endDate: '2025-11-03',
      status: 'active',
      votesFor: 8900,
      votesAgainst: 1100,
      totalVotes: 10000,
      category: 'funding',
      requiredQuorum: 8000,
      userVote: 'for'
    },
    {
      id: '3',
      title: 'Implement Cross-Chain Bridge to Polygon',
      description: 'Technical proposal to expand TeraP to Polygon network for lower transaction costs and broader accessibility.',
      proposer: '0x9876...4321',
      created: '2025-10-15',
      endDate: '2025-10-30',
      status: 'passed',
      votesFor: 18500,
      votesAgainst: 2500,
      totalVotes: 21000,
      category: 'technical',
      requiredQuorum: 15000,
      userVote: 'for'
    }
  ]);

  const treasuryBalance = 125000; // TERAP tokens

  const activeProposals = proposals.filter(p => p.status === 'active');
  const passedProposals = proposals.filter(p => p.status === 'passed');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Connect Wallet</h2>
          <p className="text-neutral-600">Please connect your wallet to participate in DAO governance.</p>
        </div>
      </div>
    );
  }

  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type: 'success',
        title: 'Vote Submitted',
        message: `Vote submitted successfully! Your ${vote} vote has been recorded.`,
        timestamp: new Date()
      }
    });
    // In real app, this would submit to blockchain
  };

  const handleStakeTokens = (amount: number) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type: 'success',
        title: 'Tokens Staked',
        message: `Successfully staked ${amount} TERAP tokens!`,
        timestamp: new Date()
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">TeraP DAO Governance</h1>
              <p className="text-neutral-600 mt-2">Shape the future of decentralized mental health care</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{userStake.votingPower.toLocaleString()}</div>
                <div className="text-sm text-neutral-600">Voting Power</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">{activeProposals.length}</div>
                <div className="text-sm text-neutral-600">Active Proposals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">{userStake.rewards}</div>
                <div className="text-sm text-neutral-600">Earned Rewards</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Stake Info */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Governance Power</h2>
              <div className="flex items-center space-x-6">
                <div>
                  <div className="text-2xl font-bold">{userStake.amount.toLocaleString()}</div>
                  <div className="text-primary-100">TERAP Staked</div>
                </div>
                <div className="text-4xl text-primary-200">→</div>
                <div>
                  <div className="text-2xl font-bold">{userStake.votingPower.toLocaleString()}</div>
                  <div className="text-primary-100">Voting Power (2x multiplier)</div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('staking')}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              Manage Stake
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
            {(['proposals', 'staking', 'treasury'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {/* Create Proposal Button */}
            <div className="text-right">
              <button className="btn-primary">Create New Proposal</button>
            </div>

            {/* Active Proposals */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Active Proposals</h2>
              <div className="space-y-4">
                {activeProposals.map((proposal) => (
                  <div key={proposal.id} className="border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-800">{proposal.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            proposal.category === 'funding' ? 'bg-green-100 text-green-600' :
                            proposal.category === 'policy' ? 'bg-blue-100 text-blue-600' :
                            proposal.category === 'technical' ? 'bg-purple-100 text-purple-600' :
                            'bg-neutral-100 text-neutral-600'
                          }`}>
                            {proposal.category}
                          </span>
                        </div>
                        <p className="text-neutral-600 mb-3">{proposal.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-neutral-500">
                          <span>Proposed by {proposal.proposer}</span>
                          <span>•</span>
                          <span>Ends {proposal.endDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Voting Stats */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
                        <span>Voting Progress</span>
                        <span>{proposal.totalVotes.toLocaleString()} / {proposal.requiredQuorum.toLocaleString()} (quorum)</span>
                      </div>
                      <div className="bg-neutral-100 rounded-full h-3 mb-3">
                        <div className="flex h-full rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500"
                            style={{ width: `${(proposal.votesFor / proposal.totalVotes) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500"
                            style={{ width: `${(proposal.votesAgainst / proposal.totalVotes) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">For: {proposal.votesFor.toLocaleString()}</span>
                        <span className="text-red-600">Against: {proposal.votesAgainst.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Voting Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedProposal(proposal)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Details
                      </button>
                      {proposal.userVote ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-neutral-600">You voted:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            proposal.userVote === 'for' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {proposal.userVote.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleVote(proposal.id, 'against')}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            Vote Against
                          </button>
                          <button
                            onClick={() => handleVote(proposal.id, 'for')}
                            className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-medium"
                          >
                            Vote For
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Proposals */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Recent Proposals</h2>
              <div className="space-y-3">
                {passedProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-800">{proposal.title}</div>
                      <div className="text-sm text-neutral-600">{proposal.category} • {proposal.endDate}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                        PASSED
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staking' && (
          <div className="space-y-6">
            {/* Staking Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Staking Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-primary-50 rounded-lg">
                  <Vote className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-primary-600">{userStake.amount.toLocaleString()}</div>
                  <div className="text-sm text-neutral-600">TERAP Staked</div>
                </div>
                <div className="text-center p-6 bg-accent-50 rounded-lg">
                  <TrendingUp className="h-12 w-12 text-accent-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-accent-600">{userStake.votingPower.toLocaleString()}</div>
                  <div className="text-sm text-neutral-600">Voting Power</div>
                </div>
                <div className="text-center p-6 bg-secondary-50 rounded-lg">
                  <DollarSign className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-secondary-600">{userStake.rewards}</div>
                  <div className="text-sm text-neutral-600">Rewards Earned</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">Stake More Tokens</h3>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Amount to stake"
                      className="form-input w-full"
                    />
                    <button className="btn-primary w-full">Stake Tokens</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">Unstake Tokens</h3>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Amount to unstake"
                      className="form-input w-full"
                    />
                    <button className="btn-outline w-full">Unstake Tokens</button>
                    <p className="text-xs text-neutral-500">30-day cooldown period applies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-800">Staking Rewards</h2>
                <button className="btn-primary">Claim Rewards</button>
              </div>
              <div className="bg-gradient-to-r from-accent-50 to-secondary-50 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-600 mb-2">{userStake.rewards} TERAP</div>
                  <div className="text-neutral-600">Available to claim</div>
                  <div className="text-sm text-neutral-500 mt-2">
                    Earn 12% APY by staking TERAP tokens and participating in governance
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'treasury' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">DAO Treasury</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-6 bg-primary-50 rounded-lg">
                <DollarSign className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-primary-600">{treasuryBalance.toLocaleString()}</div>
                <div className="text-sm text-neutral-600">TERAP Balance</div>
              </div>
              <div className="text-center p-6 bg-accent-50 rounded-lg">
                <Users className="h-12 w-12 text-accent-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-accent-600">2,847</div>
                <div className="text-sm text-neutral-600">DAO Members</div>
              </div>
              <div className="text-center p-6 bg-secondary-50 rounded-lg">
                <Vote className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-secondary-600">{proposals.length}</div>
                <div className="text-sm text-neutral-600">Total Proposals</div>
              </div>
              <div className="text-center p-6 bg-neutral-50 rounded-lg">
                <Clock className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-neutral-600">24h</div>
                <div className="text-sm text-neutral-600">Avg. Response Time</div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Recent Treasury Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-neutral-800">Crisis Support Program Funding</span>
                  </div>
                  <span className="text-green-600 font-medium">-50,000 TERAP</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-neutral-800">Staking Rewards Distribution</span>
                  </div>
                  <span className="text-blue-600 font-medium">-12,500 TERAP</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-neutral-800">Platform Revenue (Session Fees)</span>
                  </div>
                  <span className="text-primary-600 font-medium">+8,750 TERAP</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-800">{selectedProposal.title}</h2>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-neutral-600 mb-6">{selectedProposal.description}</p>
              
              {/* Voting interface would go here */}
              <div className="border-t pt-4">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleVote(selectedProposal.id, 'for');
                      setSelectedProposal(null);
                    }}
                    className="btn-primary flex-1"
                  >
                    Vote For
                  </button>
                  <button
                    onClick={() => {
                      handleVote(selectedProposal.id, 'against');
                      setSelectedProposal(null);
                    }}
                    className="btn-outline flex-1"
                  >
                    Vote Against
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAOGovernance;
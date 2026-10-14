'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../../stores/AppProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import {
  CORE_PARAMS,
  EMERGENCY_ACTIONS,
  GOV_CORE_PARAM_OFFSET,
  GOV_PARAMS,
  ProposalType,
  TeraPContracts,
} from '@/services/TeraPContracts';
import { ADDRESSES, explorerTx } from '@/config/contracts';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';

const TYPE_OPTIONS: { value: ProposalType; label: string; help: string }[] = [
  { value: ProposalType.TherapistVerification, label: 'Therapist verification', help: 'Verify a registered therapist so they can accept bookings.' },
  { value: ProposalType.FundingAllocation, label: 'Funding allocation', help: 'Send tokens from the DAO treasury to a recipient.' },
  { value: ProposalType.ParameterChange, label: 'Parameter change', help: 'Change a governance or core platform parameter.' },
  { value: ProposalType.Emergency, label: 'Emergency', help: 'Pause/unpause the platform or revoke a therapist.' },
];

const PARAM_OPTIONS: { id: number; label: string; hint: string }[] = [
  { id: GOV_PARAMS.PROPOSAL_THRESHOLD, label: 'Governance: proposal threshold', hint: 'TERAP wei of voting power needed to propose' },
  { id: GOV_PARAMS.VOTING_PERIOD, label: 'Governance: voting period', hint: 'seconds (minimum 3600)' },
  { id: GOV_PARAMS.QUORUM_BPS, label: 'Governance: quorum', hint: 'basis points of total supply (0-10000)' },
  { id: CORE_PARAMS.PLATFORM_FEE_BPS + GOV_CORE_PARAM_OFFSET, label: 'Core: platform fee', hint: 'basis points of each session (max 2000)' },
  { id: CORE_PARAMS.CLAIM_DELAY + GOV_CORE_PARAM_OFFSET, label: 'Core: claim delay', hint: 'seconds before a therapist can claim payment' },
  { id: CORE_PARAMS.LATE_CANCEL_FEE_BPS + GOV_CORE_PARAM_OFFSET, label: 'Core: late cancel fee', hint: 'basis points charged for late cancellations' },
];

const EMERGENCY_OPTIONS: { id: number; label: string }[] = [
  { id: EMERGENCY_ACTIONS.PAUSE, label: 'Pause platform' },
  { id: EMERGENCY_ACTIONS.UNPAUSE, label: 'Unpause platform' },
  { id: EMERGENCY_ACTIONS.REVOKE_THERAPIST, label: 'Revoke therapist' },
];

function formatPeriod(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d > 0 ? `${d} day${d === 1 ? '' : 's'}${h ? ` ${h}h` : ''}` : `${h} hour${h === 1 ? '' : 's'}`;
}

export default function CreateProposalPage() {
  const { addNotification } = useApp();
  const router = useRouter();
  const { contracts, address, isConnected, wrongNetwork, canWrite, isConfigured, ensureNetwork, chain } = useTeraP();
  const { connectWallet } = useWeb3Wallet();
  const govConfigured = isConfigured && Boolean(ADDRESSES.TeraPGovernance);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: ProposalType.TherapistVerification as ProposalType,
    therapist: '',
    token: ADDRESSES.TeraPToken,
    recipient: '',
    amount: '',
    param: PARAM_OPTIONS[0].id,
    paramValue: '',
    emergencyAction: EMERGENCY_ACTIONS.PAUSE as number,
    target: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useContractQuery(() => contracts.getGovernanceParams(), [contracts], { enabled: govConfigured });
  const power = useContractQuery(() => (address ? contracts.getVotingPower(address) : Promise.resolve(0n)), [contracts, address], {
    enabled: govConfigured && Boolean(address),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const belowThreshold = params.data !== null && power.data !== null && power.data < params.data.proposalThreshold;

  const encode = (): string => {
    switch (form.type) {
      case ProposalType.TherapistVerification:
        if (!ethers.isAddress(form.therapist)) throw new Error('Enter a valid therapist address.');
        return TeraPContracts.encodeTherapistVerification(form.therapist);
      case ProposalType.FundingAllocation: {
        if (!ethers.isAddress(form.token)) throw new Error('Enter a valid token address.');
        if (!ethers.isAddress(form.recipient)) throw new Error('Enter a valid recipient address.');
        const amount = TeraPContracts.parseTerap(form.amount || '0');
        if (amount <= 0n) throw new Error('Amount must be greater than zero.');
        return TeraPContracts.encodeFundingAllocation(form.token, form.recipient, amount);
      }
      case ProposalType.ParameterChange: {
        if (!/^\d+$/.test(form.paramValue.trim())) throw new Error('Parameter value must be a whole number.');
        return TeraPContracts.encodeParameterChange(form.param, BigInt(form.paramValue.trim()));
      }
      case ProposalType.Emergency: {
        if (form.emergencyAction === EMERGENCY_ACTIONS.REVOKE_THERAPIST && !ethers.isAddress(form.target)) {
          throw new Error('Enter the therapist address to revoke.');
        }
        return TeraPContracts.encodeEmergency(
          form.emergencyAction,
          form.emergencyAction === EMERGENCY_ACTIONS.REVOKE_THERAPIST ? form.target : ethers.ZeroAddress,
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    let data: string;
    try {
      data = encode();
    } catch (err) {
      addNotification({ type: 'error', title: 'Check the proposal', message: err instanceof Error ? err.message : 'Invalid input' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await contracts.createProposal(form.title.trim(), form.description.trim(), form.type, data);
      addNotification({
        type: 'success',
        title: 'Proposal Created',
        message: `${res.proposalId ? `Proposal #${res.proposalId} is open for voting.` : 'Submitted.'}${explorerTx(res.hash) ? ` ${explorerTx(res.hash)}` : ''}`,
      });
      router.push('/dao');
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed to Create Proposal', message: err instanceof Error ? err.message : 'Transaction failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!govConfigured || !isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{!govConfigured ? 'Governance not configured' : 'Connect Wallet Required'}</h1>
          <p className="text-gray-600 mb-6">
            {!govConfigured ? 'Set NEXT_PUBLIC_TERAP_GOVERNANCE_ADDRESS (and token/core) in .env.local.' : 'Please connect your wallet to create a proposal.'}
          </p>
          <div className="flex justify-center gap-3">
            {govConfigured && <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>}
            <button onClick={() => router.push('/dao')} className="btn-secondary">Go to DAO</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Create New Proposal</h1>
                <p className="mt-2 text-indigo-100">Submit a proposal for the TeraP DAO community to vote on</p>
              </div>
              <button onClick={() => router.back()} className="text-indigo-200 hover:text-white" aria-label="Close">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {wrongNetwork && (
            <div className="bg-amber-50 border-b border-amber-200 px-8 py-4 flex items-center justify-between">
              <span className="text-sm text-amber-800 flex items-center"><AlertCircle className="h-4 w-4 mr-2" />Your wallet is on another network. Switch to {chain.name}.</span>
              <button onClick={ensureNetwork} className="btn-primary btn-sm">Switch network</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Title *</label>
                  <input type="text" required maxLength={120} value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} placeholder="e.g., Lower the platform fee to 2%" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select value={form.type} onChange={(e) => set('type', Number(e.target.value) as ProposalType)} className={inputCls}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">{TYPE_OPTIONS.find((t) => t.value === form.type)?.help}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea required rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls} placeholder="Explain the problem, the change and why the community should support it..." />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution Payload</h2>
              <p className="text-sm text-gray-600 mb-4">These fields are ABI-encoded and executed on-chain if the proposal passes.</p>

              {form.type === ProposalType.TherapistVerification && (
                <Field label="Therapist address *" hint="Must already be registered in TeraPCore.">
                  <input type="text" value={form.therapist} onChange={(e) => set('therapist', e.target.value)} className={inputCls} placeholder="0x..." />
                </Field>
              )}

              {form.type === ProposalType.FundingAllocation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Token address *" hint="Defaults to TERAP; any token held by the treasury works.">
                    <input type="text" value={form.token} onChange={(e) => set('token', e.target.value)} className={inputCls} placeholder="0x..." />
                  </Field>
                  <Field label="Recipient *">
                    <input type="text" value={form.recipient} onChange={(e) => set('recipient', e.target.value)} className={inputCls} placeholder="0x..." />
                  </Field>
                  <Field label="Amount (tokens, 18 decimals) *">
                    <input type="number" min="0" step="any" value={form.amount} onChange={(e) => set('amount', e.target.value)} className={inputCls} placeholder="0" />
                  </Field>
                </div>
              )}

              {form.type === ProposalType.ParameterChange && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Parameter *">
                    <select value={form.param} onChange={(e) => set('param', Number(e.target.value))} className={inputCls}>
                      {PARAM_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="New value *" hint={PARAM_OPTIONS.find((p) => p.id === form.param)?.hint}>
                    <input type="text" inputMode="numeric" value={form.paramValue} onChange={(e) => set('paramValue', e.target.value)} className={inputCls} placeholder="0" />
                  </Field>
                </div>
              )}

              {form.type === ProposalType.Emergency && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Action *">
                    <select value={form.emergencyAction} onChange={(e) => set('emergencyAction', Number(e.target.value))} className={inputCls}>
                      {EMERGENCY_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  {form.emergencyAction === EMERGENCY_ACTIONS.REVOKE_THERAPIST && (
                    <Field label="Therapist address *">
                      <input type="text" value={form.target} onChange={(e) => set('target', e.target.value)} className={inputCls} placeholder="0x..." />
                    </Field>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Voting Requirements</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>Proposal threshold: {params.data ? `${TeraPContracts.formatTerap(params.data.proposalThreshold)} TERAP voting power` : '—'}</li>
                <li>Voting period: {params.data ? formatPeriod(params.data.votingPeriod) : '—'} from creation</li>
                <li>Quorum: {params.data ? `${(params.data.quorumBps / 100).toFixed(1)}% of supply (${TeraPContracts.formatTerap(params.data.quorum, 0)} TERAP)` : '—'}</li>
                <li>Passes when votes for exceed votes against and quorum is met; anyone can execute after voting ends</li>
                <li className="pt-2 font-medium">
                  Your voting power: {power.data !== null ? `${TeraPContracts.formatTerap(power.data)} TERAP` : '—'}
                  {belowThreshold && <span className="text-red-700"> — below the threshold, the contract will reject this proposal.</span>}
                </li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-start mb-4">
                <input type="checkbox" required className="mt-1 mr-3" />
                <p className="text-sm text-gray-600">
                  I confirm that this proposal is submitted in good faith and for the benefit of the TeraP community.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || (!canWrite && !wrongNetwork)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : null}
                  {wrongNetwork ? `Switch to ${chain.name}` : isSubmitting ? 'Confirm in wallet...' : 'Create Proposal'}
                </button>
                <button type="button" onClick={() => router.push('/dao')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

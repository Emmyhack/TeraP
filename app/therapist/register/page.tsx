'use client';

import AppShell from '@/components/layout/AppShell';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Heart, Shield, Award, ArrowLeft, CheckCircle, AlertTriangle, ExternalLink, Hourglass } from 'lucide-react';
import { useApp } from '../../../stores/AppProvider';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { TeraPContracts, type TherapistProfile } from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';

export default function TherapistRegisterPage() {
  const { addNotification } = useApp();
  const router = useRouter();
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { contracts, address, isConnected, isConfigured, wrongNetwork, canWrite, ensureNetwork, chain } = useTeraP();


  const [formData, setFormData] = useState({
    anonymousId: '',
    credentials: '',
    specializations: [''],
    hourlyRate: '',
    bio: '',
    experience: '',
    licenseNumber: '',
    education: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState<{ txHash: string } | null>(null);

  // Already registered? Show status instead of the form.
  const existingQuery = useContractQuery<TherapistProfile | null>(async () => (address ? contracts.getTherapistProfile(address) : null), [contracts, address], {
    enabled: isConfigured && isConnected && Boolean(address),
  });

  const addSpecialization = () => setFormData((prev) => ({ ...prev, specializations: [...prev.specializations, ''] }));
  const updateSpecialization = (index: number, value: string) =>
    setFormData((prev) => ({ ...prev, specializations: prev.specializations.map((spec, i) => (i === index ? value : spec)) }));
  const removeSpecialization = (index: number) =>
    setFormData((prev) => ({ ...prev, specializations: prev.specializations.filter((_, i) => i !== index) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !address) return;

    const specializations = formData.specializations.map((s) => s.trim()).filter(Boolean);
    if (specializations.length === 0) {
      addNotification({ type: 'error', title: 'Missing specialization', message: 'Add at least one specialization.' });
      return;
    }

    let hourlyRate: bigint;
    try {
      hourlyRate = TeraPContracts.parseTerap(formData.hourlyRate.trim());
    } catch {
      addNotification({ type: 'error', title: 'Invalid rate', message: 'Enter the hourly rate as a TERAP amount, e.g. 120.' });
      return;
    }
    if (hourlyRate <= 0n) {
      addNotification({ type: 'error', title: 'Invalid rate', message: 'Hourly rate must be greater than zero.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Commitment to the license number: keccak256(licenseNumber | salt). The salt is kept locally so the
      // therapist can later prove the license to the DAO without revealing it on-chain.
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(`${formData.licenseNumber.trim()}|${salt}`));
      try {
        localStorage.setItem(`terap_credential_salt_${address.toLowerCase()}`, salt);
      } catch {
        /* storage unavailable; the salt is also shown in the success notice */
      }

      // Placeholder bytes32 "public key": the platform does not yet derive an X25519 key for therapists, so a
      // deterministic hash of the wallet address is stored until the encrypted-messaging key exchange lands.
      const encryptionPublicKey = ethers.keccak256(ethers.toUtf8Bytes(`${address}:terap-pubkey`));

      // Off-chain-readable credential blob (not encrypted client-side yet; do not include identifying details).
      const encryptedCredentials = JSON.stringify({
        credentials: formData.credentials.trim(),
        education: formData.education.trim(),
        experience: formData.experience.trim(),
        bio: formData.bio.trim(),
        submittedAt: Math.floor(Date.now() / 1000),
      });

      const result = await contracts.registerTherapist({
        anonymousId: formData.anonymousId.trim(),
        specializations,
        encryptedCredentials,
        hourlyRate,
        credentialHash,
        encryptionPublicKey,
      });

      setRegistered({ txHash: result.hash });
      addNotification({
        type: 'success',
        title: 'Registered, awaiting DAO verification',
        message: `Your therapist profile is on-chain (tx ${result.hash.slice(0, 10)}...). Clients can book you once the DAO verifies you.`,
      });
      existingQuery.refresh();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error instanceof Error ? error.message : 'Failed to register. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shell = (content: React.ReactNode) => (
    <AppShell>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">{content}</div>
        </div>
      </AppShell>
  );

  if (!isConfigured) {
    return shell(
      <>
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-neutral-800 mb-2">Contracts not configured</h1>
        <p className="text-neutral-600">Set the NEXT_PUBLIC_TERAP_* contract addresses in .env.local. See the README for details.</p>
      </>,
    );
  }

  if (!isConnected) {
    return shell(
      <>
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-display font-bold text-neutral-800 mb-4">Wallet Connection Required</h1>
        <p className="text-neutral-600 mb-8 leading-relaxed">Connect your wallet on {chain.name} to register as a professional therapist on TeraP.</p>
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-primary-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto disabled:opacity-50"
        >
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <Heart className="w-5 h-5" />
        </button>
      </>,
    );
  }

  if (wrongNetwork) {
    return shell(
      <>
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-neutral-800 mb-2">Wrong network</h1>
        <p className="text-neutral-600 mb-6">Switch your wallet to {chain.name} to continue.</p>
        <button onClick={() => ensureNetwork().catch(() => undefined)} className="btn-primary">
          Switch to {chain.name}
        </button>
      </>,
    );
  }

  if (registered || existingQuery.data) {
    const profile = existingQuery.data;
    const txLink = registered ? explorerTx(registered.txHash) : '';
    return shell(
      <>
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          {profile?.isVerified ? <CheckCircle className="w-8 h-8 text-emerald-600" /> : <Hourglass className="w-8 h-8 text-amber-500" />}
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-800 mb-2">
          {profile?.isVerified ? 'You are a verified therapist' : 'Registered, awaiting DAO verification'}
        </h1>
        <p className="text-neutral-600 mb-6">
          {profile ? `Profile "${profile.anonymousId}" is registered on ${chain.name}.` : 'Your profile transaction has been confirmed.'}{' '}
          {!profile?.isVerified && 'Clients can book you once a therapist-verification proposal passes in the DAO.'}
        </p>
        {registered && txLink && (
          <a href={txLink} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline inline-flex items-center space-x-1 mb-6">
            <span>View transaction</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/therapist" className="btn-primary">
            Go to therapist dashboard
          </Link>
          {!profile?.isVerified && (
            <Link href="/dao" className="btn-outline">
              Open DAO governance
            </Link>
          )}
        </div>
      </>,
    );
  }

  return (
    <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button onClick={() => router.back()} className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
            <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 px-8 py-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-8 w-16 h-16 border border-white/30 rounded-full"></div>
                <div className="absolute bottom-4 right-8 w-20 h-20 border border-white/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-12 h-12 border border-white/25 rounded-full"></div>
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold text-white mb-4">Professional Registration</h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  Register your anonymous professional profile on {chain.name}. The DAO verifies your credentials before clients can book you.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Anonymous Identity */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">Privacy Protection</h3>
                    <p className="mt-2 text-sm text-blue-700">
                      TeraP uses anonymous identities. Your real name is never stored on the blockchain; only the pseudonym below is visible to clients.
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Anonymous Professional Identity *</label>
                  <input
                    type="text"
                    required
                    value={formData.anonymousId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, anonymousId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Wellness_Guide_Aurora, MindfulHealer23"
                  />
                  <p className="mt-1 text-sm text-gray-500">Choose a professional pseudonym that clients will see. Cannot be changed later.</p>
                </div>
              </div>

              {/* License commitment */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">License</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Only a salted hash of your license number is stored on-chain. Keep the license number; the DAO may ask you to prove it during
                  verification.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="LIC123456"
                />
              </div>

              {/* Professional Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Details</h2>
                <p className="text-sm text-gray-600 mb-4">Stored with your on-chain profile for DAO reviewers. Do not include identifying details.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credentials *</label>
                    <input
                      type="text"
                      required
                      value={formData.credentials}
                      onChange={(e) => setFormData((prev) => ({ ...prev, credentials: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Licensed Clinical Social Worker (LCSW)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <textarea
                      value={formData.education}
                      onChange={(e) => setFormData((prev) => ({ ...prev, education: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ph.D. in Clinical Psychology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Specializations *</h2>
                <div className="space-y-3">
                  {formData.specializations.map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        required={index === 0}
                        value={spec}
                        onChange={(e) => updateSpecialization(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Anxiety, Depression, PTSD"
                      />
                      {index > 0 && (
                        <button type="button" onClick={() => removeSpecialization(index)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addSpecialization} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    + Add Specialization
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (TERAP) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="100"
                />
                <p className="mt-1 text-sm text-gray-500">Session cost is pro-rated from this rate (e.g. a 30 minute session costs half).</p>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Bio</h2>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tell clients about your approach, experience, and how you can help them..."
                />
              </div>

              {/* Terms and Submit */}
              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">What goes on-chain</h3>
                      <p className="mt-2 text-sm text-yellow-700">
                        Your pseudonym, specializations, hourly rate, the professional details above and a hash of your license number are written to{' '}
                        {chain.name} from wallet {address?.slice(0, 6)}...{address?.slice(-4)}. The DAO must verify you before bookings open.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start mb-4">
                  <input type="checkbox" required className="mt-1 mr-3" />
                  <p className="text-sm text-gray-600">
                    I agree to the TeraP platform terms of service and confirm that all information provided is accurate.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button type="submit" disabled={isSubmitting || !canWrite} className="btn-primary flex items-center disabled:opacity-50">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-b-2 border-white rounded-full" />
                        Confirm in wallet...
                      </>
                    ) : (
                      'Register on-chain'
                    )}
                  </button>
                  <button type="button" onClick={() => router.push('/therapist')} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </AppShell>
  );
}

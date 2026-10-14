'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';
import { SubscriptionPlanSelector } from '@/components/subscription/SubscriptionPlans';
import { useSubscription } from '@/hooks/useSubscription';
import { TeraPContracts } from '@/services/TeraPContracts';
import { ArrowLeft, Crown, Heart, Shield, Star } from 'lucide-react';

const ClientSubscriptionPage: React.FC = () => {
  const router = useRouter();
  const { subscription, tiers } = useSubscription();
  const currentTier = subscription ? tiers.find((t) => t.tierId === subscription.tierId) : undefined;

  return (
    <AppShell>
      {/* Professional Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-white/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Booking</span>
            </button>
            <div className="h-6 w-px bg-neutral-300" />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold text-neutral-800">
                Subscription Plans
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-5xl font-display font-bold text-neutral-800 mb-6">
            Mental Wellness
            <span className="block text-3xl text-primary-500 mt-2">
              Subscription Plans
            </span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Prepay session minutes in TERAP. Plans are enforced by the TeraP subscription contract, so your minutes and expiry are verifiable on-chain.
          </p>

          {/* Benefits Highlight */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Shield className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Privacy Protected</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Heart className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Verified Therapists</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Star className="w-6 h-6 text-accent-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Minutes Roll Into Sessions</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Crown className="w-6 h-6 text-accent-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Pay in TERAP</div>
            </div>
          </div>
        </div>

        {subscription && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-neutral-500">Current plan</div>
              <div className="text-lg font-semibold text-neutral-800">
                {currentTier?.name ?? `Tier #${subscription.tierId}`} · {subscription.isActive ? 'active' : 'expired'}
              </div>
            </div>
            <div className="text-sm text-neutral-600">
              {subscription.isActive ? `${subscription.minutesRemaining} minutes left · ends ${new Date(subscription.endTime * 1000).toLocaleDateString()}` : `Ended ${new Date(subscription.endTime * 1000).toLocaleDateString()}`}
              {' · '}paid {TeraPContracts.formatTerap(subscription.totalPaid)} TERAP so far
            </div>
          </div>
        )}

        {/* Subscription Plans Component */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
          <SubscriptionPlanSelector
            currentTierId={subscription?.tierId}
            onSubscribed={() => router.push('/client/book-session')}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default ClientSubscriptionPage;

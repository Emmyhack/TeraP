import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionPlanSelector from '@/components/subscription/SubscriptionPlans';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { SUBSCRIPTION_TIERS } from '@/config/subscriptionConfig';

export const SubscriptionManagement: React.FC = () => {
  const [view, setView] = useState<'plans' | 'current' | 'history'>('current');
  const { 
    currentSubscription, 
    subscriptions, 
    isLoading, 
    error, 
    subscribe, 
    cancelSubscription, 
    upgradeSubscription,
    getUsageStats 
  } = useSubscription();
  const { isConnected, address } = useWeb3Wallet();

  const [usageStats, setUsageStats] = useState<any>(null);

  React.useEffect(() => {
    const loadUsageStats = async () => {
      const stats = await getUsageStats();
      setUsageStats(stats);
    };
    
    if (currentSubscription) {
      loadUsageStats();
    }
  }, [currentSubscription, getUsageStats]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Wallet Not Connected</h3>
          <p className="text-yellow-600">Please connect your wallet to view subscription options.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading subscription data...</span>
        </div>
      </div>
    );
  }

  const renderCurrentSubscription = () => {
    if (!currentSubscription) {
      return (
        <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-4">Choose a plan to start your wellness journey with us.</p>
          <button
            onClick={() => setView('plans')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Plans
          </button>
        </div>
      );
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === currentSubscription.tierId);
    if (!tier) return null;

    const daysRemaining = Math.ceil(
      (new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="space-y-6">
        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div 
            className="h-2 w-full"
            style={{ backgroundColor: tier.color }}
          />
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600">{tier.description}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    currentSubscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {tier.monthlyPrice.toLocaleString()} TERAP
                </div>
                <div className="text-sm text-gray-500">per month</div>
              </div>
            </div>

            {/* Usage Stats */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{usageStats.usedMinutes}</div>
                  <div className="text-sm text-gray-500">Minutes Used</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{usageStats.remainingMinutes}</div>
                  <div className="text-sm text-gray-500">Minutes Remaining</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(usageStats.utilizationRate)}%</div>
                  <div className="text-sm text-gray-500">Utilization</div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {usageStats && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Session Minutes</span>
                  <span>{usageStats.usedMinutes} / {usageStats.totalMinutes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-blue-600"
                    style={{ width: `${Math.min(usageStats.utilizationRate, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subscription Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Subscription Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="text-gray-900">
                      {new Date(currentSubscription.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="text-gray-900">
                      {new Date(currentSubscription.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Remaining:</span>
                    <span className={`font-semibold ${daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                      {daysRemaining} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto Renewal:</span>
                    <span className={`font-semibold ${currentSubscription.autoRenewal ? 'text-green-600' : 'text-gray-600'}`}>
                      {currentSubscription.autoRenewal ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Plan Benefits</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{tier.benefits.sessionMinutesPerMonth} minutes/month</span>
                  </div>
                  
                  {tier.benefits.emergencySessionDiscount > 0 && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{tier.benefits.emergencySessionDiscount}% emergency discount</span>
                    </div>
                  )}
                  
                  {tier.benefits.priorityBooking && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Priority booking</span>
                    </div>
                  )}
                  
                  {tier.benefits.personalTherapistAssignment && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Personal therapist</span>
                    </div>
                  )}
                  
                  {tier.benefits.twentyFourSevenSupport && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>24/7 support</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setView('plans')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Upgrade Plan
              </button>
              
              {daysRemaining <= 7 && (
                <button
                  onClick={() => {/* TODO: Implement renewal */}}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Renew Now
                </button>
              )}
              
              <button
                onClick={() => cancelSubscription(currentSubscription.id)}
                className="border border-red-300 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionHistory = () => {
    if (subscriptions.length === 0) {
      return (
        <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscription History</h3>
          <p className="text-gray-600">Your past subscriptions will appear here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {subscriptions.map((subscription) => {
          const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tierId);
          if (!tier) return null;

          return (
            <div key={subscription.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : subscription.status === 'expired'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    {tier.monthlyPrice.toLocaleString()} TERAP/month
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your wellness plan and track your usage</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'current', label: 'Current Plan', count: currentSubscription ? 1 : 0 },
            { id: 'plans', label: 'Available Plans' },
            { id: 'history', label: 'History', count: subscriptions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  view === tab.id
                    ? 'bg-teal-100 text-teal-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {view === 'current' && renderCurrentSubscription()}
      {view === 'plans' && (
        <SubscriptionPlanSelector
          onSubscribe={subscribe}
          currentTier={currentSubscription?.tierId}
          isLoading={isLoading}
        />
      )}
      {view === 'history' && renderSubscriptionHistory()}
    </div>
  );
};

export default SubscriptionManagement;
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlanSelector } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionTier, CrossChainPayment } from '@/types/subscription';
import { useApp } from '@/stores/AppProvider';
import { ArrowLeft } from 'lucide-react';

const ClientSubscriptionPage: React.FC = () => {
  const router = useRouter();
  const { addNotification } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (tier: SubscriptionTier, payment: CrossChainPayment) => {
    setIsLoading(true);
    try {
      // Handle subscription logic here
      console.log('Subscribing to:', tier.name, 'with payment:', payment);
      
      addNotification({
        type: 'success',
        title: 'Subscription Successful',
        message: `Successfully subscribed to ${tier.name}! Your access will be active shortly.`
      });

      // Redirect back to booking after successful subscription
      setTimeout(() => {
        router.push('/client/book-session');
      }, 2000);
      
    } catch (error) {
      console.error('Subscription failed:', error);
      addNotification({
        type: 'error',
        title: 'Subscription Failed',
        message: 'Failed to process subscription. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">
              Subscription Plans
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose Your Mental Wellness Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Select the perfect subscription plan for your mental health journey. 
            All plans include end-to-end encrypted sessions and anonymous therapy with verified professionals.
          </p>
        </div>

        {/* Subscription Plans Component */}
        <SubscriptionPlanSelector 
          onSubscribe={handleSubscribe}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ClientSubscriptionPage;
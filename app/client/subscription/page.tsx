'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlanSelector } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionTier, CrossChainPayment } from '@/types/subscription';
import { useApp } from '@/stores/AppProvider';
import { ArrowLeft, Crown, Heart, Shield, Star } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border-b border-white/50 shadow-lg">
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
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
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
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-5xl font-display font-bold text-neutral-800 mb-6">
            Mental Wellness
            <span className="block text-3xl bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent mt-2">
              Subscription Plans
            </span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Choose the perfect plan for your mental health journey with professional support, privacy protection, and community access.
          </p>

          {/* Benefits Highlight */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Shield className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Privacy Protected</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Heart className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Licensed Therapists</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Star className="w-6 h-6 text-accent-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">24/7 Support</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
              <Crown className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-800">Premium Features</div>
            </div>
          </div>
        </div>

        {/* Subscription Plans Component */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
          <SubscriptionPlanSelector 
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-8 border border-emerald-200/50">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">500+</div>
                <div className="text-sm text-neutral-600">Verified Therapists</div>
              </div>
              <div className="w-px h-10 bg-neutral-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">10,000+</div>
                <div className="text-sm text-neutral-600">Sessions Completed</div>
              </div>
              <div className="w-px h-10 bg-neutral-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">98%</div>
                <div className="text-sm text-neutral-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSubscriptionPage;
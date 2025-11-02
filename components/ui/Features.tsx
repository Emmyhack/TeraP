'use client';

import React from 'react';
import { Shield, Users, Vote, Coins, Calendar, Heart, Brain, Globe } from 'lucide-react';

export default function Features() {
  const features = [
    {
      category: 'Therapy Services',
      icon: Heart,
      color: 'text-primary-600 bg-primary-100',
      items: [
        {
          title: 'Verified Professionals',
          description: 'Connect with licensed therapists verified through our DAO process',
          icon: Shield
        },
        {
          title: 'Cross-Chain Payments',
          description: 'Pay for sessions using TERAP tokens or stablecoins from any supported chain',
          icon: Coins
        },
        {
          title: 'Flexible Sessions',
          description: 'Book 1-on-1 or group sessions that fit your schedule and needs',
          icon: Calendar
        }
      ]
    },
    {
      category: 'Wellness Circles',
      icon: Users,
      color: 'text-accent-600 bg-accent-100',
      items: [
        {
          title: 'Anonymous Support Groups',
          description: 'Join token-gated communities focused on specific wellness topics',
          icon: Users
        },
        {
          title: 'Reputation System',
          description: 'Earn rewards for empathy, participation, and supporting others',
          icon: Heart
        },
        {
          title: 'Community Moderation',
          description: 'Verified facilitators ensure safe and supportive environments',
          icon: Shield
        }
      ]
    },
    {
      category: 'DAO Governance',
      icon: Vote,
      color: 'text-wellness-peace bg-purple-100',
      items: [
        {
          title: 'Community Voting',
          description: 'Vote on funding priorities, therapist verification, and platform changes',
          icon: Vote
        },
        {
          title: 'Mental Wellness Fund',
          description: 'Allocate resources to nonprofits and community wellness projects',
          icon: Coins
        },
        {
          title: 'Research Partnerships',
          description: 'Support mental health research with anonymized, opt-in data sharing',
          icon: Brain
        }
      ]
    },
    {
      category: 'Privacy & Ownership',
      icon: Shield,
      color: 'text-neutral-700 bg-neutral-100',
      items: [
        {
          title: 'Data Ownership',
          description: 'You own all your wellness data, journals, and assessments',
          icon: Shield
        },
        {
          title: 'Zero-Knowledge Privacy',
          description: 'Share insights for research while maintaining complete anonymity',
          icon: Brain
        },
        {
          title: 'Cross-Chain Identity',
          description: 'Your wellness journey follows you across all supported blockchains',
          icon: Globe
        }
      ]
    }
  ];

  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-neutral-800 mb-6">
            A New Paradigm for Mental Wellness
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            TeraP combines the best of traditional therapy with Web3 innovation,
            creating a transparent, accessible, and community-driven wellness ecosystem.
          </p>
        </div>

        <div className="space-y-16">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-bold text-neutral-800">
                  {category.category}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-neutral-600" />
                      <h4 className="text-lg font-semibold text-neutral-800">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 lg:p-12 text-white">
            <h3 className="text-3xl font-display font-bold mb-4">
              Ready to Join the Wellness Revolution?
            </h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Connect your wallet to start your journey with TeraP. 
              Whether you're seeking support or providing it, our community is here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 font-medium px-8 py-3 rounded-lg hover:bg-neutral-100 transition-colors">
                Connect Wallet
              </button>
              <button className="border-2 border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-white hover:text-primary-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
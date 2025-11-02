'use client';

import React from 'react';
import { Shield, Users, Vote, Coins, Calendar, Heart, Brain, Globe } from 'lucide-react';

export default function Features() {
  const features = [
    {
      category: 'Professional Therapy',
      icon: Heart,
      color: 'from-primary-500 to-purple-600',
      bgColor: 'from-primary-50 to-purple-50',
      items: [
        {
          title: 'Licensed Therapists',
          description: 'Connect with verified mental health professionals through our DAO-governed verification process',
          icon: Shield,
          metric: '500+ Verified'
        },
        {
          title: 'Secure Payments',
          description: 'Pay for sessions using TERAP tokens, stablecoins, or traditional payment methods across chains',
          icon: Coins,
          metric: 'Multi-Chain'
        },
        {
          title: 'Flexible Scheduling',
          description: 'Book individual or group sessions that work with your lifestyle and time zone',
          icon: Calendar,
          metric: '24/7 Available'
        }
      ]
    },
    {
      category: 'Community Wellness',
      icon: Users,
      color: 'from-accent-500 to-orange-500',
      bgColor: 'from-accent-50 to-orange-50',
      items: [
        {
          title: 'Support Communities',
          description: 'Join anonymous, token-gated support groups focused on specific mental health topics and goals',
          icon: Users,
          metric: '50+ Groups'
        },
        {
          title: 'Empathy Rewards',
          description: 'Earn TERAP tokens for meaningful participation, emotional support, and community building',
          icon: Heart,
          metric: 'Token Incentives'
        },
        {
          title: 'Safe Moderation',
          description: 'Licensed facilitators and AI-powered content moderation ensure supportive environments',
          icon: Shield,
          metric: 'Professional Led'
        }
      ]
    },
    {
      category: 'Decentralized Governance',
      icon: Vote,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'from-purple-50 to-indigo-50',
      items: [
        {
          title: 'Democratic Decisions',
          description: 'Vote on therapist verification, funding priorities, and platform governance with TERAP tokens',
          icon: Vote,
          metric: 'Token Voting'
        },
        {
          title: 'Wellness Treasury',
          description: 'Community-controlled fund supporting mental health nonprofits and research initiatives',
          icon: Coins,
          metric: '$2M+ Allocated'
        },
        {
          title: 'Research Impact',
          description: 'Contribute to breakthrough mental health research through anonymized data sharing',
          icon: Brain,
          metric: '10+ Studies'
        }
      ]
    },
    {
      category: 'Privacy & Data Sovereignty',
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      items: [
        {
          title: 'Complete Data Control',
          description: 'Own and control all your therapy sessions, wellness data, and personal health insights',
          icon: Shield,
          metric: 'Self-Custody'
        },
        {
          title: 'Zero-Knowledge Privacy',
          description: 'Advanced cryptography enables research participation while maintaining absolute anonymity',
          icon: Brain,
          metric: 'ZK-SNARK Powered'
        },
        {
          title: 'Universal Access',
          description: 'Your mental health journey and credentials seamlessly work across all blockchain networks',
          icon: Globe,
          metric: '15+ Chains'
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
            <div key={categoryIndex} className={`bg-gradient-to-br ${category.bgColor} border border-white/50 rounded-3xl shadow-xl p-8 lg:p-12 backdrop-blur-sm`}>
              <div className="flex items-center space-x-4 mb-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-neutral-800">
                  {category.category}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 hover:shadow-lg border border-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-neutral-700" />
                        </div>
                        <h4 className="text-lg font-semibold text-neutral-800">
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-xs font-medium text-neutral-600 bg-white/70 px-2 py-1 rounded-full">
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-neutral-700 leading-relaxed text-sm">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 rounded-3xl p-10 lg:p-16 text-white shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 border border-white/30 rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 border border-white/20 rounded-full"></div>
              <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-white/25 rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-4xl font-display font-bold mb-6">
                Transform Mental Healthcare Together
              </h3>
              <p className="text-xl mb-10 opacity-95 max-w-3xl mx-auto leading-relaxed">
                Join thousands in building the future of accessible, private, and community-driven mental health support. 
                Your wellness journey starts with a single connection.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button className="bg-white text-primary-600 font-semibold px-10 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2">
                  <span>Start Your Journey</span>
                  <Heart className="w-5 h-5" />
                </button>
                <button className="border-2 border-white/70 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white">
                  Explore Features
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import React from 'react';
import { UserCheck, Users, Vote, TrendingUp } from 'lucide-react';

export default function Stats() {
  const stats = [
    {
      label: 'Verified Therapists',
      value: '127',
      change: '+12%',
      icon: UserCheck,
      color: 'text-primary-600'
    },
    {
      label: 'Wellness Sessions',
      value: '2,847',
      change: '+34%',
      icon: TrendingUp,
      color: 'text-accent-600'
    },
    {
      label: 'Community Members',
      value: '8,492',
      change: '+28%',
      icon: Users,
      color: 'text-wellness-peace'
    },
    {
      label: 'DAO Treasury',
      value: '485K TERAP',
      change: '+18%',
      icon: Vote,
      color: 'text-neutral-700'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-neutral-800 mb-4">
            Platform Impact
          </h2>
          <p className="text-lg text-neutral-600">
            Growing together, one session at a time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card card-hover text-center">
              <div className="flex justify-center mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-neutral-800 mb-2">
                {stat.value}
              </div>
              <div className="text-neutral-600 mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-accent-600 font-medium">
                {stat.change} this month
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
'use client';

import React, { useState } from 'react';
import { Mail, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary-100 rounded-full">
                <Mail className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-neutral-800 mb-4">TeraP Newsletter</h1>
            <p className="text-xl text-neutral-600 mb-8">
              Stay informed about the latest developments in decentralized wellness and mental health technology
            </p>

            {!isSubscribed ? (
              <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                  <Check className="h-6 w-6" />
                  <span className="text-lg font-medium">Successfully Subscribed!</span>
                </div>
                <p className="text-neutral-600">
                  Thank you for subscribing to our newsletter. You'll receive updates about TeraP platform developments, wellness insights, and blockchain innovations.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-4">What You'll Receive</h2>
            <ul className="space-y-3 text-neutral-700">
              <li className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Platform updates and new feature announcements</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Insights on decentralized wellness and mental health</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Technical deep-dives and blockchain innovations</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Community highlights and success stories</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Early access to new features and beta programs</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Frequency & Privacy</h2>
            <div className="space-y-4 text-neutral-700">
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">Email Frequency</h3>
                <p>We send newsletters bi-weekly, with occasional special announcements. No spam, ever.</p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">Privacy First</h3>
                <p>Your email is encrypted and never shared with third parties. Unsubscribe anytime with one click.</p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">Content Quality</h3>
                <p>Each newsletter is carefully crafted with valuable insights, not promotional content.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-neutral-800 mb-6 text-center">Recent Newsletter Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">Mental Health Innovation</h3>
              <p className="text-sm text-neutral-600">Latest research and technology in digital mental health solutions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">Blockchain Updates</h3>
              <p className="text-sm text-neutral-600">Cross-chain developments and new network integrations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">Community Growth</h3>
              <p className="text-sm text-neutral-600">Success stories and community milestones from our platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
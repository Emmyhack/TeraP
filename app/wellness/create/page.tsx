'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/navigation/Navigation';
import Footer from '../../../components/ui/Footer';
import { useApp } from '../../../stores/AppProvider';

export default function CreateWellnessCirclePage() {
  const { state, addNotification } = useApp();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'support',
    isPrivate: false,
    maxMembers: '20',
    entryStake: '10',
    rules: [''],
    meetingSchedule: '',
    facilitatorBio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'book-session') router.push('/client/book-session');
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const updateRule = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate circle creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification({
        type: 'success',
        title: 'Circle Created',
        message: 'Your wellness circle has been created successfully.'
      });

      router.push('/wellness');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Create Circle',
        message: 'There was an error creating your wellness circle. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state.user.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="card text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Connect Wallet Required
              </h1>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to create a wellness circle.
              </p>
              <button
                onClick={() => router.push('/wellness')}
                className="btn-primary"
              >
                Go to Wellness
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Create Wellness Circle
                  </h1>
                  <p className="mt-2 text-primary-100">
                    Start a supportive community focused on wellness and growth
                  </p>
                </div>
                <button
                  onClick={() => router.back()}
                  className="text-primary-200 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Circle Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Circle Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Anxiety Support Circle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="support">Support Group</option>
                    <option value="education">Educational</option>
                    <option value="meditation">Meditation & Mindfulness</option>
                    <option value="fitness">Fitness & Physical Wellness</option>
                    <option value="addiction">Addiction Recovery</option>
                    <option value="grief">Grief & Loss</option>
                    <option value="relationships">Relationships</option>
                    <option value="career">Career & Life Transitions</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe the purpose, goals, and what members can expect from this circle..."
                  />
                </div>
              </div>
            </div>

            {/* Circle Settings */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Circle Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Members *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="100"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Stake (TERAP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.entryStake}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryStake: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Stake required to join (helps ensure commitment)
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="mr-3"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Private Circle
                    </label>
                    <p className="text-xs text-gray-500">
                      Requires approval to join. Otherwise, anyone can join by staking tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Circle Rules */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Circle Rules & Guidelines
              </h2>
              <div className="space-y-3">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      required={index === 0}
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={index === 0 ? "e.g., Be respectful and supportive to all members" : "Enter a rule or guideline"}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRule}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  + Add Rule
                </button>
              </div>
            </div>

            {/* Facilitator Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Facilitator Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    value={formData.meetingSchedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingSchedule: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Weekly on Wednesdays at 7 PM UTC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Background & Experience
                  </label>
                  <textarea
                    rows={4}
                    value={formData.facilitatorBio}
                    onChange={(e) => setFormData(prev => ({ ...prev, facilitatorBio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Share your experience and why you're qualified to facilitate this circle..."
                  />
                </div>
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="border-t pt-6">
              <div className="flex items-start mb-4">
                <input type="checkbox" required className="mt-1 mr-3" />
                <p className="text-sm text-gray-600">
                  I agree to facilitate this circle responsibly and create a safe, supportive environment for all members. I understand that as the facilitator, I have responsibilities to moderate discussions and enforce circle rules.
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Circle...
                    </>
                  ) : (
                    'Create Wellness Circle'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/wellness')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
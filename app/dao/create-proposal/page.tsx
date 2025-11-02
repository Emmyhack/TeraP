'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../stores/AppProvider';

export default function CreateProposalPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'platform',
    proposalData: '',
    requestedAmount: '',
    beneficiary: '',
    executionTimestamp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate proposal creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          title: 'Proposal Created',
          message: 'Your proposal has been submitted successfully.',
          timestamp: new Date()
        }
      });

      router.push('/dao');
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          title: 'Failed to Create Proposal',
          message: 'There was an error creating your proposal. Please try again.',
          timestamp: new Date()
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state.user.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Wallet Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create a proposal.
          </p>
          <button
            onClick={() => router.push('/dao')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to DAO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Create New Proposal
                </h1>
                <p className="mt-2 text-indigo-100">
                  Submit a proposal for the TeraP DAO community to vote on
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="text-indigo-200 hover:text-white"
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
                Proposal Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Increase Platform Fee to Support Development"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="platform">Platform Changes</option>
                    <option value="treasury">Treasury Management</option>
                    <option value="governance">Governance Updates</option>
                    <option value="partnership">Partnerships</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Provide a detailed description of your proposal, including the problem it solves, the benefits to the community, and how it should be implemented..."
                  />
                </div>
              </div>
            </div>

            {/* Financial Details (if applicable) */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Financial Information
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Only fill this section if your proposal involves treasury funds.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requested Amount (TERAP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.requestedAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary Address
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData(prev => ({ ...prev, beneficiary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0x..."
                  />
                </div>
              </div>
            </div>

            {/* Execution Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Execution Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Execution Timeline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.executionTimestamp}
                    onChange={(e) => setFormData(prev => ({ ...prev, executionTimestamp: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    When should this proposal be executed if approved?
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Implementation Data
                  </label>
                  <textarea
                    rows={4}
                    value={formData.proposalData}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposalData: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Any technical implementation details, smart contract calls, or specific parameters..."
                  />
                </div>
              </div>
            </div>

            {/* Voting Requirements */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">
                Voting Requirements
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Minimum 1,000 TERAP voting power required to create proposals
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Voting period: 7 days from proposal creation
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Minimum 20% quorum required for proposal to pass
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Simple majority (&gt;50%) required to pass
                </li>
              </ul>
            </div>

            {/* Terms and Submit */}
            <div className="border-t pt-6">
              <div className="flex items-start mb-4">
                <input type="checkbox" required className="mt-1 mr-3" />
                <p className="text-sm text-gray-600">
                  I confirm that this proposal is submitted in good faith and for the benefit of the TeraP community. I understand that malicious or spam proposals may result in penalties.
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Proposal...
                    </>
                  ) : (
                    'Create Proposal'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dao')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
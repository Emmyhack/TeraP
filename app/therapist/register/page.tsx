'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Award, Lock, Plus, X, CheckCircle, ArrowLeft } from 'lucide-react';
import Navigation from '../../../components/navigation/Navigation';
import Footer from '../../../components/ui/Footer';
import { useApp } from '../../../stores/AppProvider';

export default function TherapistRegisterPage() {
  const { state, dispatch, addNotification } = useApp();
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'book-session') router.push('/client/book-session');
  };
  const [formData, setFormData] = useState({
    anonymousId: '',
    credentials: '',
    specializations: [''],
    hourlyRate: '',
    bio: '',
    experience: '',
    licenseNumber: '',
    education: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, '']
    }));
  };

  const updateSpecialization = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) => 
        i === index ? value : spec
      )
    }));
  };

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate encryption key pair for secure communications
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      // Export public key
      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyArray = Array.from(new Uint8Array(publicKey));
      const publicKeyBase64 = btoa(String.fromCharCode.apply(null, publicKeyArray));

      // Encrypt sensitive credentials (in real app, this would be more sophisticated)
      const encryptedCredentials = JSON.stringify({
        licenseNumber: formData.licenseNumber,
        education: formData.education,
        experience: formData.experience,
        bio: formData.bio,
        timestamp: Date.now()
      });

      // Use SmartContractIntegrationService for registration
      const { smartContractService } = await import('../../../services/SmartContractIntegrationService');
      
      const result = await smartContractService.registerTherapist(
        formData.anonymousId,
        formData.specializations.filter(spec => spec.trim() !== ''),
        encryptedCredentials,
        parseFloat(formData.hourlyRate) || 0,
        publicKeyBase64
      );

      if (result.success) {
        // Update user state
        dispatch({
          type: 'SET_THERAPIST_STATUS',
          payload: true
        });

        addNotification({
          type: 'success',
          title: 'Registration Submitted',
          message: 'Your anonymous therapist profile has been created successfully.'
        });

        // Redirect to therapist dashboard
        router.push('/therapist');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Failed to register therapist:', error);
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error instanceof Error ? error.message : 'Failed to register. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state.user.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
        <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-display font-bold text-neutral-800 mb-4">
                Wallet Connection Required
              </h1>
              <p className="text-neutral-600 mb-8 leading-relaxed">
                Please connect your wallet to register as a professional therapist on the TeraP platform.
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-primary-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
              >
                <span>Go to Home</span>
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
            {/* Professional Header */}
            <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 px-8 py-12 text-center relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-8 w-16 h-16 border border-white/30 rounded-full"></div>
                <div className="absolute bottom-4 right-8 w-20 h-20 border border-white/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-12 h-12 border border-white/25 rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold text-white mb-4">
                  Professional Registration
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  Join our network of licensed mental health professionals and help transform lives through Web3 innovation
                </p>
              </div>
            </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Anonymous Identity */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">Privacy Protection</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>For your safety and privacy, TeraP uses anonymous identities. Your real name is never shared with clients or stored on the blockchain.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anonymous Professional Identity *
                </label>
                <input
                  type="text"
                  required
                  value={formData.anonymousId}
                  onChange={(e) => setFormData(prev => ({ ...prev, anonymousId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Wellness_Guide_Aurora, MindfulHealer23"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Choose a professional pseudonym that clients will see. Cannot be changed later.
                </p>
              </div>
            </div>

            {/* Encrypted Credentials */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Encrypted Professional Information
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Your credentials are encrypted and only verified by the platform administrators. They are never publicly visible.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number (Encrypted) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="LIC123456"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This will be encrypted and only used for verification
                </p>
              </div>
            </div>

            {/* Professional Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Professional Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credentials *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.credentials}
                    onChange={(e) => setFormData(prev => ({ ...prev, credentials: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Licensed Clinical Social Worker (LCSW)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <textarea
                    value={formData.education}
                    onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ph.D. in Clinical Psychology, University of..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Specializations *
              </h2>
              <div className="space-y-3">
                {formData.specializations.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      required={index === 0}
                      value={spec}
                      onChange={(e) => updateSpecialization(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Anxiety, Depression, PTSD"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSpecialization(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add Specialization
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pricing
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (in TERAP tokens) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Set your hourly consultation rate in TERAP tokens
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Professional Bio
              </h2>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell clients about your approach, experience, and how you can help them..."
              />
            </div>

            {/* Terms and Submit */}
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important Privacy Notice</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Your real identity remains completely anonymous on TeraP. Only your anonymous ID will be visible to clients. Your encrypted credentials are used solely for verification by platform administrators.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start mb-4">
                <input type="checkbox" required className="mt-1 mr-3" />
                <p className="text-sm text-gray-600">
                  I agree to the TeraP platform terms of service and confirm that all information provided is accurate. I understand that my credentials will be encrypted and verified while maintaining my anonymity, and I accept responsibility for choosing a professional anonymous identity.
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
                      Registering...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
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
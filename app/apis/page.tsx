'use client';

import React from 'react';
import { Zap, Database, Shield, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function APIs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">TeraP APIs</h1>
          <p className="text-xl text-neutral-600">
            RESTful APIs and WebSocket connections for seamless integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-8 w-8 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">REST API</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              HTTP-based API for standard operations and data retrieval.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Base URL:</span>
                <code className="text-primary-600">https://api.terap.io/v1</code>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Authentication:</span>
                <span className="text-neutral-800">Bearer Token</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Rate Limit:</span>
                <span className="text-neutral-800">1000 req/hour</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">WebSocket</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Real-time communication for chat and live session features.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Endpoint:</span>
                <code className="text-primary-600">wss://api.terap.io/ws</code>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Protocol:</span>
                <span className="text-neutral-800">WebSocket</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Encryption:</span>
                <span className="text-neutral-800">TLS 1.3</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">GraphQL</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Flexible query language for complex data requirements.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Endpoint:</span>
                <code className="text-primary-600">https://api.terap.io/graphql</code>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Playground:</span>
                <span className="text-neutral-800">Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Subscriptions:</span>
                <span className="text-neutral-800">Supported</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
              <h2 className="text-2xl font-semibold text-neutral-800">Security</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Enterprise-grade security for all API communications.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Encryption:</span>
                <span className="text-neutral-800">AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Auth Method:</span>
                <span className="text-neutral-800">JWT + Wallet Signature</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">CORS:</span>
                <span className="text-neutral-800">Configurable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-neutral-800 mb-6">API Endpoints</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Authentication</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">POST</span>
                  <code className="text-neutral-700">/auth/login</code>
                  <span className="text-neutral-600">- Authenticate with wallet signature</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">GET</span>
                  <code className="text-neutral-700">/auth/profile</code>
                  <span className="text-neutral-600">- Get user profile information</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Sessions</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">POST</span>
                  <code className="text-neutral-700">/sessions/book</code>
                  <span className="text-neutral-600">- Book a therapy session</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">GET</span>
                  <code className="text-neutral-700">/sessions/my</code>
                  <span className="text-neutral-600">- Get user's sessions</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">PUT</span>
                  <code className="text-neutral-700">/sessions/:id/complete</code>
                  <span className="text-neutral-600">- Complete a session</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Wellness Circles</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">GET</span>
                  <code className="text-neutral-700">/circles</code>
                  <span className="text-neutral-600">- List available wellness circles</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">POST</span>
                  <code className="text-neutral-700">/circles/create</code>
                  <span className="text-neutral-600">- Create a new wellness circle</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">POST</span>
                  <code className="text-neutral-700">/circles/:id/join</code>
                  <span className="text-neutral-600">- Join a wellness circle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
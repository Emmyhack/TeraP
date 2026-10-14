'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Globe, Lock } from 'lucide-react';
import { CHAIN, CONTRACTS_CONFIGURED } from '@/config/contracts';

/**
 * Developer page describing the read-only HTTP routes this Next.js app exposes.
 * Every route reads directly from the TeraP contracts on the configured chain; there is no
 * separate backend, API key or rate limit.
 */
const ROUTES = [
  {
    method: 'GET',
    path: '/api/therapists',
    query: 'specialty (optional, case-insensitive substring match)',
    description: 'Verified and active therapists from TeraPCore.',
    response: '{ therapists: TherapistProfile[], total: number, filters: { specialty } }',
  },
  {
    method: 'GET',
    path: '/api/sessions/:id',
    query: 'none',
    description: 'A single therapy session by id. Returns 404 when the id does not exist.',
    response: 'TherapySession with cost serialised as a string plus costTerap',
  },
  {
    method: 'GET',
    path: '/api/analytics',
    query: 'none',
    description: 'Platform-wide counters: therapists, sessions, circles, proposals, treasury, staking, supply.',
    response: 'PlatformStats with bigint fields serialised as strings',
  },
];

export default function APIs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">TeraP HTTP API</h1>
          <p className="text-xl text-neutral-600">
            Read-only JSON routes served by this app. They proxy public contract reads on {CHAIN.name} so
            integrators do not need an RPC connection of their own.
          </p>
          {!CONTRACTS_CONFIGURED && (
            <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Contract addresses are not configured on this deployment, so every route currently answers
              503 <code>{'{ error: "Contracts not configured" }'}</code>.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Globe className="h-7 w-7 text-blue-600" />
              <h2 className="text-xl font-semibold text-neutral-800">Base URL</h2>
            </div>
            <p className="text-neutral-600 text-sm">
              Same origin as this site, under <code>/api</code>. No authentication: all data is already public on-chain.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Database className="h-7 w-7 text-green-600" />
              <h2 className="text-xl font-semibold text-neutral-800">Data source</h2>
            </div>
            <p className="text-neutral-600 text-sm">
              Each request performs live <code>eth_call</code>s against TeraPCore, TeraPToken and TeraPGovernance.
              Responses are not cached.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Lock className="h-7 w-7 text-purple-600" />
              <h2 className="text-xl font-semibold text-neutral-800">Writes</h2>
            </div>
            <p className="text-neutral-600 text-sm">
              There are no write endpoints. Booking, staking, voting and circle actions are transactions signed by
              the user&apos;s wallet in the app.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-neutral-800 mb-6">Routes</h2>
          <div className="space-y-4">
            {ROUTES.map((r) => (
              <div key={r.path} className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{r.method}</span>
                  <code className="text-neutral-800">{r.path}</code>
                </div>
                <p className="text-neutral-600 text-sm mb-2">{r.description}</p>
                <dl className="text-sm grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-y-1">
                  <dt className="text-neutral-500">Query</dt>
                  <dd className="text-neutral-700">{r.query}</dd>
                  <dt className="text-neutral-500">Response</dt>
                  <dd className="text-neutral-700"><code>{r.response}</code></dd>
                </dl>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-500 mt-6">
            Types are defined in <code>services/TeraPContracts.ts</code>. Token amounts are TERAP wei encoded as
            decimal strings; fields suffixed <code>Terap</code> are human-readable.
          </p>
        </div>
      </div>
    </div>
  );
}

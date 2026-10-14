'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ZKIdentityManagement from '@/components/identity/ZKIdentityManagement';
import ZKTherapistProfile from '@/components/profile/ZKTherapistProfile';
import ZKClientProfile from '@/components/profile/ZKClientProfile';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';

/**
 * Profile: an optional anonymous identity (kept in the browser) plus the role-specific profile view.
 * Booking, circles and governance only need a connected wallet; the identity adds a pseudonym and
 * local-only tools (mood tracking, credential commitments).
 */
export default function ProfilePage() {
  const { isAuthenticated, currentSession } = useZKIdentity();

  return (
    <AppShell>
      {!isAuthenticated ? (
        <ZKIdentityManagement />
      ) : currentSession?.profile.role === 'therapist' ? (
        <ZKTherapistProfile />
      ) : (
        <ZKClientProfile />
      )}
    </AppShell>
  );
}

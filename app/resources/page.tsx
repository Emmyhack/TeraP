'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import MentalHealthResources from '@/components/resources/MentalHealthResources';

export default function ResourcesPage() {
  return (
    <AppShell>
      <MentalHealthResources />
    </AppShell>
  );
}

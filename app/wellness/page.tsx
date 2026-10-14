'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import WellnessCircles from '@/components/wellness/WellnessCircles';

export default function WellnessPage() {
  return (
    <AppShell>
      <WellnessCircles />
    </AppShell>
  );
}

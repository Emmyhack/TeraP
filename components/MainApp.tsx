'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import Hero from '@/components/ui/Hero';
import Stats from '@/components/ui/Stats';
import Features from '@/components/ui/Features';

/** Public landing page. Every feature lives on its own route (see components/navigation/Navigation.tsx). */
const MainApp: React.FC = () => (
  <AppShell fullBleed>
    <Hero />
    <Stats />
    <Features />
  </AppShell>
);

export default MainApp;

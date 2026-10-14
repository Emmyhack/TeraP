'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Users, Vote, User, MessageCircle, CreditCard, Menu, X, LogOut, Shield, BookOpen } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import MultiWalletConnection from '@/components/wallet/MultiWalletConnection';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Navigation: React.FC = () => {
  const pathname = usePathname() ?? '/';
  const { isConnected, address, disconnectWallet } = useWeb3Wallet();
  const { currentSession, isAuthenticated, logout } = useZKIdentity();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isTherapist = currentSession?.profile.role === 'therapist';
  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/client/book-session', label: 'Book Session', icon: Calendar },
    { href: '/wellness', label: 'Circles', icon: Users },
    { href: '/dao', label: 'DAO', icon: Vote },
    { href: '/client/subscription', label: 'Plans', icon: CreditCard },
    isTherapist
      ? { href: '/therapist', label: 'Therapist Hub', icon: User }
      : { href: '/client', label: 'My Journey', icon: MessageCircle },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: Shield },
  ];

  // Longest matching prefix wins, so /client/subscription highlights Plans rather than My Journey.
  const activeHref = navItems
    .map((i) => i.href)
    .filter((href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

  const formatAddress = (addr?: string | null) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Not connected');

  const Brand = (
    <Link href="/" className="flex items-center space-x-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
        <span className="text-lg font-bold text-white">T</span>
      </div>
      <div className="leading-tight">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">TeraP</span>
        <div className="text-xs font-medium text-gray-500">Universal</div>
      </div>
    </Link>
  );

  const Account = ({ stacked = false }: { stacked?: boolean }) => (
    <div className={stacked ? 'space-y-2' : 'flex items-center space-x-3'}>
      {isAuthenticated && (
        <div className="flex items-center justify-between space-x-2 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-accent-50 px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
            <span className="text-sm font-medium text-primary-700">{currentSession?.profile.displayName}</span>
          </div>
          <button onClick={logout} className="rounded p-1 text-red-600 hover:bg-red-50" title="Log out of anonymous identity">
            <LogOut className="h-3 w-3" />
          </button>
        </div>
      )}
      {isConnected ? (
        <div className="flex items-center justify-between space-x-2 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">{formatAddress(address)}</span>
          </div>
          <button onClick={disconnectWallet} className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Disconnect wallet">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <MultiWalletConnection />
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="rounded-2xl border border-gray-200/60 bg-white/95 shadow-lg backdrop-blur-sm">
        {/* Desktop */}
        <div className="hidden items-center gap-6 px-4 py-3 lg:flex">
          {Brand}
          <div className="flex flex-1 items-center justify-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <Account />
        </div>

        {/* Mobile / tablet */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {Brand}
            <button
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              className="rounded-xl p-2.5 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
          {isMobileMenuOpen && (
            <div className="space-y-1 border-t border-gray-200 px-4 py-3">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-left font-medium ${
                    isActive(href)
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-3">
                <Account stacked />
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navigation;

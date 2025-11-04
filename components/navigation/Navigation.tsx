'use client';

import React, { useState } from 'react';
import { Home, Calendar, Users, Vote, User, MessageCircle, Settings, Menu, X, Wallet, LogOut, Shield, BookOpen } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import MultiWalletConnection from '@/components/wallet/MultiWalletConnection';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3Wallet();
  const { currentSession, isAuthenticated, logout } = useZKIdentity();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };
  
  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };
  
  const formatAddress = (addr?: string | null) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { id: 'home', label: 'Home', icon: Home },
      ];
    }

    const baseItems = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'subscription', label: 'Subscription', icon: Settings },
      { id: 'book-session', label: 'Book Session', icon: Calendar },
      { id: 'wellness-circles', label: 'Wellness Circles', icon: Users },
    ];

    if (currentSession?.profile.role === 'therapist') {
      baseItems.push({ id: 'therapist-dashboard', label: 'Therapist Hub', icon: User });
    } else {
      baseItems.push({ id: 'client-dashboard', label: 'My Journey', icon: MessageCircle });
    }

    baseItems.push({ id: 'profile', label: 'Profile', icon: Shield });
    baseItems.push({ id: 'resources', label: 'Resources', icon: BookOpen });
    
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 rounded-2xl mx-6 mt-6 p-4 sticky top-6 z-50">
        <div className="flex items-center space-x-8 w-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TeraP</span>
              <div className="text-xs text-gray-500 font-medium">Universal</div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center space-x-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onPageChange(id)}
                className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  currentPage === id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:shadow-md'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform ${currentPage === id ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="font-medium text-sm">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl px-3 py-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary-700">
                  {currentSession?.profile.displayName}
                </span>
                <button
                  onClick={logout}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Logout Anonymous Identity"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">{formatAddress(address)}</span>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Disconnect Wallet"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <MultiWalletConnection />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden">
        <div className="bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 mx-4 mt-4 rounded-2xl p-4 sticky top-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TeraP</span>
                <div className="text-xs text-gray-500 font-medium">Universal</div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onPageChange(id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                    currentPage === id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:shadow-md'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
              
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                {isAuthenticated && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-primary-700">
                        {currentSession?.profile.displayName}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <LogOut className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {isConnected ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">{formatAddress(address)}</span>
                    </div>
                    <button
                      onClick={handleDisconnectWallet}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <LogOut className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <MultiWalletConnection />
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
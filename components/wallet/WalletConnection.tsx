/**
 * Wallet Connection Component
 * Implements ZetaChain wallet connection UI patterns
 */
'use client';

import React, { useState } from 'react';
import { Wallet, ChevronDown, ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useZetaChainWallet, SUPPORTED_NETWORKS, getNetworkInfo } from './ZetaChainWalletProvider';

export function WalletConnection() {
  const {
    wallets,
    connectedWallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useZetaChainWallet();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Copy address to clipboard
  const copyAddress = async () => {
    if (connectedWallet?.address) {
      await navigator.clipboard.writeText(connectedWallet.address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  // Handle wallet connection
  const handleWalletConnect = async (wallet: any) => {
    try {
      await connectWallet(wallet);
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Handle network switch
  const handleNetworkSwitch = async (chainId: number) => {
    try {
      await switchNetwork(chainId);
      setIsNetworkModalOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  // Get current network info
  const currentNetwork = connectedWallet ? getNetworkInfo(connectedWallet.chainId) : null;
  const isUnsupportedNetwork = connectedWallet && !currentNetwork;

  return (
    <div className="flex items-center gap-3">
      {/* Network Selector */}
      {connectedWallet && (
        <div className="relative">
          <button
            onClick={() => setIsNetworkModalOpen(!isNetworkModalOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              isUnsupportedNetwork
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              isUnsupportedNetwork ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium">
              {currentNetwork?.name || `Chain ${connectedWallet.chainId}`}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Network Dropdown */}
          {isNetworkModalOpen && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[250px]">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Select Network</h3>
              </div>
              <div className="p-2">
                {Object.entries(SUPPORTED_NETWORKS).map(([chainId, network]) => (
                  <button
                    key={chainId}
                    onClick={() => handleNetworkSwitch(Number(chainId))}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      connectedWallet.chainId === Number(chainId)
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      connectedWallet.chainId === Number(chainId) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="text-left">
                      <div className="font-medium">{network.name}</div>
                      <div className="text-sm text-gray-500">Chain ID: {chainId}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet Connection Button */}
      {!connectedWallet ? (
        <div className="relative">
          <button
            onClick={() => setIsWalletModalOpen(!isWalletModalOpen)}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>

          {/* Wallet Selection Modal */}
          {isWalletModalOpen && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[300px]">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Connect a Wallet</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose your preferred wallet to connect to TeraP Universal
                </p>
              </div>
              <div className="p-4">
                {wallets.length > 0 ? (
                  <div className="space-y-2">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.uuid}
                        onClick={() => handleWalletConnect(wallet)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-8 h-8 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiM2ODcyODAiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PC9zdmc+';
                          }}
                        />
                        <div className="text-left">
                          <div className="font-medium">{wallet.name}</div>
                          <div className="text-sm text-gray-500">EVM Compatible</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No wallets detected</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please install MetaMask or another EVM-compatible wallet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Connected Wallet Display */
        <div className="flex items-center gap-3">
          {/* Wallet Info */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border">
            <div className="flex flex-col text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatAddress(connectedWallet.address)}
              </div>
              {connectedWallet.balance && (
                <div className="text-xs text-gray-500">
                  {formatBalance(connectedWallet.balance)} {currentNetwork?.nativeCurrency.symbol || 'ETH'}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy Address"
              >
                {copySuccess ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              {currentNetwork && (
                <a
                  href={`${currentNetwork.explorerUrl}/address/${connectedWallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              )}
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnectWallet}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Unsupported Network Warning */}
      {isUnsupportedNetwork && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 rounded-lg p-3 z-50 max-w-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Unsupported Network</h4>
              <p className="text-sm text-red-700 mt-1">
                Please switch to a supported network to use TeraP Universal features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletConnection;
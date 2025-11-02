/**
 * Cross-Chain Transaction Component
 * Implements ZetaChain evmCall patterns from documentation
 */
'use client';

import React, { useState } from 'react';
import { Send, ExternalLink, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { evmCall } from '@zetachain/toolkit/chains/evm';
import { ethers, ZeroAddress } from 'ethers';
import { useZetaChainWallet, getNetworkInfo } from './ZetaChainWalletProvider';

// Transaction Status Enum
enum TransactionStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  SIGNING = 'signing',
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface CrossChainTransaction {
  sourceChainTxHash?: string;
  zetaChainTxHash?: string;
  status: TransactionStatus;
  error?: string;
}

// CCTX Polling Configuration (from ZetaChain docs)
const CCTX_POLLING_URL = 'https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/cctx';
const ZETACHAIN_EXPLORER_URL = 'https://zetachain-testnet.blockscout.com/tx/';

// Contract Addresses (update with your deployed contracts)
const TERAP_CORE_ADDRESS = process.env.NEXT_PUBLIC_TERAP_CORE_ADDRESS || '0x1343248Cbd4e291C6979e70a138f4c774e902561';

export function CrossChainTransaction() {
  const { connectedWallet } = useZetaChainWallet();
  const [transaction, setTransaction] = useState<CrossChainTransaction>({ status: TransactionStatus.IDLE });
  const [formData, setFormData] = useState({
    action: 'bookSession',
    therapistAddress: '',
    sessionDuration: '60',
    sessionNotes: '',
    therapistName: '',
    credentials: '',
    hourlyRate: '75'
  });

  // Poll for cross-chain status (from ZetaChain frontend tutorial)
  const pollCrosschainStatus = async (sourceChainTxHash: string) => {
    const maxAttempts = 20; // Poll for ~5 minutes (15s intervals)
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`${CCTX_POLLING_URL}/${sourceChainTxHash}`);
        
        if (response.ok) {
          const data = await response.json();
          const zetaChainTxHash = data.CrossChainTxs?.[0]?.outbound_params?.[0]?.hash;
          
          if (zetaChainTxHash) {
            setTransaction(prev => ({
              ...prev,
              zetaChainTxHash,
              status: TransactionStatus.SUCCESS
            }));
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 15000); // Poll every 15 seconds
        } else {
          setTransaction(prev => ({
            ...prev,
            status: TransactionStatus.ERROR,
            error: 'Cross-chain transaction timeout'
          }));
        }
      } catch (error) {
        console.error('Error polling CCTX:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 15000);
        } else {
          setTransaction(prev => ({
            ...prev,
            status: TransactionStatus.ERROR,
            error: 'Failed to track cross-chain transaction'
          }));
        }
      }
    };

    poll();
  };

  // Send cross-chain call (implementing ZetaChain evmCall pattern)
  const sendCrossChainCall = async () => {
    if (!connectedWallet?.signer) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setTransaction({ status: TransactionStatus.PREPARING });

      // Prepare call parameters based on action type
      let types: string[] = [];
      let values: (string | bigint | boolean)[] = [];

      if (formData.action === 'bookSession') {
        if (!formData.therapistAddress || !ethers.isAddress(formData.therapistAddress)) {
          throw new Error('Invalid therapist address');
        }
        types = ['address', 'uint256', 'string'];
        values = [formData.therapistAddress, BigInt(formData.sessionDuration), formData.sessionNotes];
      } else if (formData.action === 'registerTherapist') {
        types = ['string', 'string[]', 'string', 'uint256', 'bytes32'];
        // For therapist registration, we'll encode the specializations array as a string for simplicity
        const specializationsString = JSON.stringify(['General Therapy']);
        values = [
          formData.therapistName,
          specializationsString, // encoded specializations
          formData.credentials,
          ethers.parseEther(formData.hourlyRate),
          ethers.keccak256(ethers.toUtf8Bytes(formData.credentials))
        ];
      }

      // Build evmCall parameters (from ZetaChain tutorial)
      const evmCallParams = {
        receiver: TERAP_CORE_ADDRESS, // TeraP Core contract on ZetaChain
        types,
        values,
        revertOptions: {
          callOnRevert: false,
          revertAddress: ZeroAddress,
          revertMessage: '',
          abortAddress: ZeroAddress,
          onRevertGasLimit: 1000000,
        }
      };

      const evmCallOptions = {
        signer: connectedWallet.signer as any, // Type compatibility fix for ethers versions
        txOptions: {
          gasLimit: 1000000,
        }
      };

      setTransaction({ status: TransactionStatus.SIGNING });

      // Send the cross-chain call
      const result = await evmCall(evmCallParams, evmCallOptions);
      
      setTransaction({
        status: TransactionStatus.PENDING,
        sourceChainTxHash: result.hash
      });

      // Wait for transaction confirmation
      await result.wait();

      setTransaction(prev => ({
        ...prev,
        status: TransactionStatus.CONFIRMING
      }));

      // Start polling for cross-chain status
      pollCrosschainStatus(result.hash);

    } catch (error: any) {
      console.error('Cross-chain call failed:', error);
      setTransaction({
        status: TransactionStatus.ERROR,
        error: error.message || 'Transaction failed'
      });
    }
  };

  // Reset transaction state
  const resetTransaction = () => {
    setTransaction({ status: TransactionStatus.IDLE });
  };

  // Get current network info
  const currentNetwork = connectedWallet ? getNetworkInfo(connectedWallet.chainId) : null;
  const isZetaChain = connectedWallet?.chainId === 7001 || connectedWallet?.chainId === 7000;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Cross-Chain Transaction</h3>
      </div>

      {/* Network Warning */}
      {isZetaChain && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">ZetaChain Detected</h4>
              <p className="text-sm text-amber-700 mt-1">
                You're connected to ZetaChain. Switch to a connected chain (Ethereum, Arbitrum, Base) to send cross-chain calls.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Selector */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Action
          </label>
          <select
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={transaction.status !== TransactionStatus.IDLE}
          >
            <option value="bookSession">Book Therapy Session</option>
            <option value="registerTherapist">Register as Therapist</option>
          </select>
        </div>

        {/* Dynamic Form Fields */}
        {formData.action === 'bookSession' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Therapist Address
              </label>
              <input
                type="text"
                value={formData.therapistAddress}
                onChange={(e) => setFormData({ ...formData, therapistAddress: e.target.value })}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={transaction.status !== TransactionStatus.IDLE}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.sessionDuration}
                onChange={(e) => setFormData({ ...formData, sessionDuration: e.target.value })}
                min="30"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={transaction.status !== TransactionStatus.IDLE}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Notes (optional)
              </label>
              <textarea
                value={formData.sessionNotes}
                onChange={(e) => setFormData({ ...formData, sessionNotes: e.target.value })}
                placeholder="Any specific requirements or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={transaction.status !== TransactionStatus.IDLE}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.therapistName}
                onChange={(e) => setFormData({ ...formData, therapistName: e.target.value })}
                placeholder="Dr. Jane Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={transaction.status !== TransactionStatus.IDLE}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credentials
              </label>
              <input
                type="text"
                value={formData.credentials}
                onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                placeholder="Licensed Clinical Psychologist"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={transaction.status !== TransactionStatus.IDLE}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (TERAP tokens)
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                min="1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={transaction.status !== TransactionStatus.IDLE}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transaction Status */}
      {transaction.status !== TransactionStatus.IDLE && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            {transaction.status === TransactionStatus.ERROR ? (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : transaction.status === TransactionStatus.SUCCESS ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
            )}
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {transaction.status === TransactionStatus.PREPARING && 'Preparing Transaction...'}
                {transaction.status === TransactionStatus.SIGNING && 'Waiting for Signature...'}
                {transaction.status === TransactionStatus.PENDING && 'Transaction Submitted'}
                {transaction.status === TransactionStatus.CONFIRMING && 'Confirming Cross-Chain...'}
                {transaction.status === TransactionStatus.SUCCESS && 'Transaction Successful!'}
                {transaction.status === TransactionStatus.ERROR && 'Transaction Failed'}
              </h4>
              
              {transaction.error && (
                <p className="text-sm text-red-700 mt-1">{transaction.error}</p>
              )}
              
              {transaction.sourceChainTxHash && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Source Chain:</span>
                    <a
                      href={`${currentNetwork?.explorerUrl}/tx/${transaction.sourceChainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {transaction.sourceChainTxHash.slice(0, 10)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  {transaction.zetaChainTxHash && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">ZetaChain:</span>
                      <a
                        href={`${ZETACHAIN_EXPLORER_URL}${transaction.zetaChainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {transaction.zetaChainTxHash.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={sendCrossChainCall}
          disabled={!connectedWallet || isZetaChain || transaction.status !== TransactionStatus.IDLE}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {transaction.status === TransactionStatus.IDLE ? (
            <>
              <Send className="w-4 h-4" />
              Send Cross-Chain Transaction
            </>
          ) : (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          )}
        </button>
        
        {(transaction.status === TransactionStatus.SUCCESS || transaction.status === TransactionStatus.ERROR) && (
          <button
            onClick={resetTransaction}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            New Transaction
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          This will send a cross-chain transaction from {currentNetwork?.name || 'your current network'} to ZetaChain.
          Make sure you have enough {currentNetwork?.nativeCurrency.symbol || 'ETH'} for gas fees.
        </p>
      </div>
    </div>
  );
}

export default CrossChainTransaction;
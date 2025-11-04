import React, { useState, useCallback, useEffect } from 'react';
import { SUBSCRIPTION_TIERS, SUPPORTED_PAYMENT_CHAINS } from '@/config/subscriptionConfig';
import { SubscriptionTier, CrossChainPayment } from '@/types/subscription';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { crossChainPaymentService } from '@/services/CrossChainPaymentService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SubscriptionPlanSelectorProps {
  onSubscribe: (tier: SubscriptionTier, payment: CrossChainPayment) => Promise<void>;
  currentTier?: string;
  isLoading?: boolean;
}

export const SubscriptionPlanSelector: React.FC<SubscriptionPlanSelectorProps> = ({
  onSubscribe,
  currentTier,
  isLoading = false,
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_PAYMENT_CHAINS[0]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<'USDT' | 'NATIVE'>('USDT');
  const [paymentQuote, setPaymentQuote] = useState<any>(null);
  const [userBalances, setUserBalances] = useState<any>(null);
  
  const { isConnected, address, provider, signer } = useWeb3Wallet();

  const handleSelectPlan = useCallback((tier: SubscriptionTier) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setSelectedTier(tier);
    setShowPaymentModal(true);
  }, [isConnected]);

  // Load payment quote and balances when modal opens
  useEffect(() => {
    if (showPaymentModal && selectedTier && isConnected) {
      loadPaymentData();
    }
  }, [showPaymentModal, selectedTier, selectedChain, paymentCurrency, billingCycle, isConnected]);

  const loadPaymentData = async () => {
    if (!selectedTier || !isConnected || !address) return;

    const amount = billingCycle === 'monthly' ? selectedTier.monthlyPrice : selectedTier.yearlyPrice;

    try {
      // Initialize payment service with current wallet
      if (signer && provider) {
        try {
          await crossChainPaymentService.initializeWallet(provider, signer);
          
          const quote = await crossChainPaymentService.getPaymentQuote({
            amount,
            currency: paymentCurrency,
            sourceChain: selectedChain.id,
            destinationAddress: '0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37',
            metadata: {
              subscriptionTierId: selectedTier.id,
              userId: address,
              paymentType: 'subscription',
            },
          });
          setPaymentQuote(quote);

          const balances = await crossChainPaymentService.getUserBalances(
            address,
            selectedChain.chainId,
            selectedChain.symbol
          );
          setUserBalances(balances);
        } catch (error) {
          console.error('Payment verification failed:', error);
          // Use fallback data if verification fails
          setPaymentQuote({
            nativeTokenRequired: (amount / 3800).toFixed(6),
            usdtRequired: amount.toFixed(2),
            processingFee: amount * 0.01,
            estimatedGas: 21000,
            totalCostUSD: amount * 1.01,
          });
          setUserBalances({
            native: '0.1',
            usdt: '0.0',
            nativeSymbol: selectedChain.nativeToken,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
    }
  };

  const handlePayment = useCallback(async () => {
    if (!selectedTier || !isConnected || !address || !paymentQuote) return;
    
    setProcessing(true);
    try {
      const amount = billingCycle === 'monthly' ? selectedTier.monthlyPrice : selectedTier.yearlyPrice;
      
      // Process real cross-chain payment
      const result = await crossChainPaymentService.processPayment({
        amount,
        currency: paymentCurrency,
        sourceChain: selectedChain.id,
        destinationAddress: '0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37',
        metadata: {
          subscriptionTierId: selectedTier.id,
          userId: address,
          paymentType: 'subscription',
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // Create payment record for subscription hook
      const payment: CrossChainPayment = {
        id: `payment_${Date.now()}`,
        userId: address,
        amount,
        currency: paymentCurrency,
        sourceChain: selectedChain.id,
        targetChain: 'zetachain-mainnet',
        transactionHash: result.transactionHash!,
        zetaChainTxHash: result.zetaChainTxHash,
        status: 'confirmed',
        timestamp: new Date(),
        gasEstimate: selectedChain.gasEstimate,
        actualGasUsed: result.gasUsed,
      };
      
      await onSubscribe(selectedTier, payment);
      setShowPaymentModal(false);
      setSelectedTier(null);
      
      alert(`Payment successful! Transaction: ${result.transactionHash}`);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  }, [selectedTier, isConnected, address, billingCycle, selectedChain, paymentCurrency, paymentQuote, onSubscribe]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return Math.round(yearlyPrice / 12);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Wellness Plan
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Unlock personalized mental health support with our flexible subscription tiers
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className={`font-medium ${billingCycle === 'monthly' ? 'text-teal-600' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === 'yearly' ? 'bg-teal-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`font-medium ${billingCycle === 'yearly' ? 'text-teal-600' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-1 text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
              Save 17%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
              tier.popular 
                ? 'border-teal-500 scale-105' 
                : currentTier === tier.id 
                ? 'border-blue-500' 
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}

            <div className="p-8">
              {/* Tier Header */}
              <div className="text-center mb-8">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: tier.color }}
                >
                  {tier.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{tier.description}</p>
                
                {/* Price */}
                <div className="mb-6">
                  {billingCycle === 'monthly' ? (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(tier.monthlyPrice)}
                      </span>
                      <span className="text-gray-500 ml-2">/month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(getMonthlyEquivalent(tier.yearlyPrice))}
                      </span>
                      <span className="text-gray-500 ml-2">/month</span>
                      <div className="text-sm text-gray-500">
                        {formatPrice(tier.yearlyPrice)} billed annually
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    {tier.benefits.sessionMinutesPerMonth} minutes/month
                  </span>
                </div>
                
                {tier.benefits.emergencySessionDiscount > 0 && (
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {tier.benefits.emergencySessionDiscount}% emergency discount
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
                  {tier.benefits.priorityBooking ? (
                    <svg className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${tier.benefits.priorityBooking ? 'text-gray-700' : 'text-gray-400'}`}>
                    Priority booking
                  </span>
                </div>
                
                <div className="flex items-center">
                  {tier.benefits.personalTherapistAssignment ? (
                    <svg className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${tier.benefits.personalTherapistAssignment ? 'text-gray-700' : 'text-gray-400'}`}>
                    Personal therapist
                  </span>
                </div>
                
                <div className="flex items-center">
                  {tier.benefits.twentyFourSevenSupport ? (
                    <svg className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${tier.benefits.twentyFourSevenSupport ? 'text-gray-700' : 'text-gray-400'}`}>
                    24/7 support
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(tier)}
                disabled={isLoading || currentTier === tier.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  currentTier === tier.id
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {currentTier === tier.id ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Complete Payment
              </h3>
              <p className="text-gray-600">
                Subscribe to {selectedTier.name}
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold">{selectedTier.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Billing:</span>
                <span className="font-semibold capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  {formatPrice(
                    billingCycle === 'monthly' 
                      ? selectedTier.monthlyPrice 
                      : selectedTier.yearlyPrice
                  )}
                </span>
              </div>
              {paymentQuote && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span className="font-semibold">${paymentQuote.processingFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${paymentQuote.totalCostUSD.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setPaymentCurrency('USDT')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    paymentCurrency === 'USDT'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">USDT</div>
                  <div className="text-xs text-gray-500">
                    {paymentQuote ? `${paymentQuote.usdtRequired} USDT` : 'Stablecoin'}
                  </div>
                  {userBalances && (
                    <div className="text-xs text-gray-400">
                      Balance: {parseFloat(userBalances.usdt).toFixed(2)} USDT
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => setPaymentCurrency('NATIVE')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    paymentCurrency === 'NATIVE'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{selectedChain.nativeToken}</div>
                  <div className="text-xs text-gray-500">
                    {paymentQuote ? `${paymentQuote.nativeTokenRequired} ${selectedChain.nativeToken}` : 'Native Token'}
                  </div>
                  {userBalances && (
                    <div className="text-xs text-gray-400">
                      Balance: {parseFloat(userBalances.native).toFixed(4)} {userBalances.nativeSymbol}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Chain Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blockchain Network
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {SUPPORTED_PAYMENT_CHAINS.filter(chain => chain.isTestnet).map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain)}
                    className={`w-full p-3 text-left transition-all hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedChain.id === chain.id
                        ? 'bg-teal-50 border-l-4 border-l-teal-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{chain.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{chain.name}</div>
                          <div className="text-xs text-gray-500">
                            Fee: {chain.processingFee}% • Gas: ~{(chain.gasEstimate / 1000).toFixed(0)}k
                          </div>
                        </div>
                      </div>
                      {selectedChain.id === chain.id && (
                        <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={processing || !isConnected}
                className="flex-1 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {processing ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Pay Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cross-chain Payment Info */}
      <div className="text-center bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8">
        <svg className="h-12 w-12 text-teal-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 01 9-9" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Multi-Chain Payments Powered by ZetaChain
        </h3>
        <p className="text-gray-600 mb-4">
          Pay with USDT or native tokens from 8+ supported blockchain networks. 
          All payments are processed securely through ZetaChain&apos;s omnichain infrastructure.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {SUPPORTED_PAYMENT_CHAINS.filter(chain => chain.isTestnet).slice(0, 8).map((chain) => (
            <div key={chain.id} className="flex flex-col items-center text-sm text-gray-600 bg-white/50 rounded-lg p-3">
              <span className="text-2xl mb-1">{chain.icon}</span>
              <span className="font-medium">{chain.name.split(' ')[0]}</span>
              <span className="text-xs text-gray-500">{chain.processingFee}% fee</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanSelector;
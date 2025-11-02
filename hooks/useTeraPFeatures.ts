// Comprehensive hooks for TeraP platform features
'use client';

import { useState, useEffect } from 'react';
import { contractService } from '@/utils/contractService';
import { useZetaChainWallet } from '@/components/wallet/ZetaChainWalletProvider';
import { useApp } from '@/stores/AppProvider';

// Hook for token operations
export const useTokenOperations = () => {
  const { connectedWallet } = useZetaChainWallet();
  const { dispatch } = useApp();
  const address = connectedWallet?.address;
  const isConnected = !!connectedWallet;
  const [tokenBalance, setTokenBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [votingPower, setVotingPower] = useState('0');
  const [rewards, setRewards] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = async () => {
    if (!isConnected || !address) return;
    
    try {
      setIsLoading(true);
      const balance = await contractService.getTokenBalance(address);
      const power = await contractService.getVotingPower(address);
      
      setTokenBalance(balance);
      setVotingPower(power);
      
      // Mock staked amount and rewards for demo
      setStakedAmount((parseFloat(balance) * 0.6).toString());
      setRewards((parseFloat(balance) * 0.05).toString());
    } catch (error) {
      console.error('Error refreshing balance:', error);
      // Use mock data for demo
      setTokenBalance('2500');
      setStakedAmount('1500');
      setVotingPower('3000');
      setRewards('45.3');
    } finally {
      setIsLoading(false);
    }
  };

  const stakeTokens = async (amount: string) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          title: 'Wallet Not Connected',
          message: 'Please connect your wallet first',
          timestamp: new Date()
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      // For demo, simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Successfully staked ${amount} TERAP tokens!`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      await refreshBalance();
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to stake tokens. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const claimRewards = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      // For demo, simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Claimed ${rewards} TERAP rewards!`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      await refreshBalance();
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to claim rewards. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [isConnected, address]);

  return {
    tokenBalance,
    stakedAmount,
    votingPower,
    rewards,
    isLoading,
    stakeTokens,
    claimRewards,
    refreshBalance
  };
};

// Hook for session booking
export const useSessionBooking = () => {
  const { connectedWallet } = useZetaChainWallet();
  const isConnected = !!connectedWallet;
  const { dispatch } = useApp();
  const [isBooking, setIsBooking] = useState(false);

  const bookSession = async (
    therapistId: string,
    sessionType: number,
    dateTime: string,
    cost: string
  ) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet to book sessions',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsBooking(true);
      
      // For demo, simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Session booked successfully! Paid ${cost} TERAP.`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to book session. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsBooking(false);
    }
  };

  return { bookSession, isBooking };
};

// Hook for wellness circles
export const useWellnessCircles = () => {
  const { connectedWallet } = useZetaChainWallet();
  const isConnected = !!connectedWallet;
  const { dispatch } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createCircle = async (
    name: string,
    description: string,
    isPrivate: boolean,
    entryStake: string
  ) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet to create circles',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsCreating(true);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Wellness circle "${name}" created successfully!`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to create wellness circle. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const joinCircle = async (circleId: string, entryStake: string) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet to join circles',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsJoining(true);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Successfully joined wellness circle! Staked ${entryStake} TERAP.`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to join wellness circle. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  return { createCircle, joinCircle, isCreating, isJoining };
};

// Hook for DAO operations
export const useDAOOperations = () => {
  const { connectedWallet } = useZetaChainWallet();
  const isConnected = !!connectedWallet;
  const { dispatch } = useApp();
  const [isVoting, setIsVoting] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  const vote = async (proposalId: string, support: boolean) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet to vote',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsVoting(true);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Vote submitted successfully! You voted ${support ? 'FOR' : 'AGAINST'}.`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to submit vote. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsVoting(false);
    }
  };

  const createProposal = async (
    title: string,
    description: string,
    category: number
  ) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet to create proposals',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsCreatingProposal(true);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Proposal "${title}" created successfully!`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to create proposal. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsCreatingProposal(false);
    }
  };

  return { vote, createProposal, isVoting, isCreatingProposal };
};

// Hook for therapist operations
export const useTherapistOperations = () => {
  const { connectedWallet } = useZetaChainWallet();
  const isConnected = !!connectedWallet;
  const { dispatch } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerAsTherapist = async (
    licenseNumber: string,
    specializations: string[],
    hourlyRate: string
  ) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet to register as therapist',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsRegistering(true);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: 'Therapist registration submitted! Awaiting verification.',
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to register as therapist. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  return { registerAsTherapist, isRegistering };
};

// Hook for cross-chain operations
export const useCrossChain = () => {
  const { connectedWallet } = useZetaChainWallet();
  const isConnected = !!connectedWallet;
  const { dispatch } = useApp();
  const [isBridging, setIsBridging] = useState(false);

  const bridgeToChain = async (chainName: string, amount: string) => {
    if (!isConnected) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Please connect your wallet for cross-chain operations',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    }

    try {
      setIsBridging(true);
      
      // Simulate cross-chain bridge transaction
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Successfully bridged ${amount} TERAP to ${chainName}!`,
          title: "Success",
        timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Cross-chain bridge failed. Please try again.',
          title: "Success",
        timestamp: new Date()
        }
      });
      return false;
    } finally {
      setIsBridging(false);
    }
  };

  return { bridgeToChain, isBridging };
};
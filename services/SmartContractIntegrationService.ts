import { ethers } from 'ethers';

// TeraPCore contract ABI
const TERAP_CORE_ABI = [
  // Therapist management
  'function registerTherapist(string anonymousId, string[] specializations, string encryptedCredentials, uint256 hourlyRate, string encryptionPublicKey)',
  'function verifyTherapist(address therapist)',
  'function getTherapistProfile(address therapist) view returns (tuple(address therapist, string anonymousId, string[] specializations, string encryptedCredentials, uint256 hourlyRate, bool isVerified, bool isActive, uint256 totalSessions, uint256 rating, uint256 ratingCount, uint256 verificationTimestamp, string encryptionPublicKey))',
  
  // Session management
  'function bookSession(address therapist, uint256 duration, string encryptedNotes)',
  'function completeSession(uint256 sessionId, uint8 rating)',
  'function calculateSessionCost(address therapist, uint256 duration) view returns (uint256)',
  'function getSession(uint256 sessionId) view returns (tuple(uint256 sessionId, address therapist, address client, uint256 duration, uint256 cost, uint256 timestamp, bool isCompleted, bool isPaid, uint8 clientRating, string encryptedNotes))',
  
  // Subscription & Payment
  'function getUserSubscription(address user) view returns (tuple(bool active, uint256 tierId, uint256 startTime, uint256 endTime, uint256 usedMinutes, uint256 remainingMinutes))',
  'function getServiceLimits(address user) view returns (tuple(uint256 monthlyMinutes, uint256 usedMinutes, uint256 remainingMinutes, bool emergencyAccess, bool groupAccess, bool recordingAccess, bool priorityBooking, bool personalTherapist, bool support24x7))',
  'function verifyPayment(bytes32 txHash, address user, uint256 amount) view returns (bool)',
  
  // Wellness Circles
  'function createWellnessCircle(string name, uint256 entryStake)',
  'function joinWellnessCircle(uint256 circleId)',
  'function isCircleMember(uint256 circleId, address user) view returns (bool)',
  'function getCircleReputation(uint256 circleId, address user) view returns (uint256)',
  
  // DAO Governance
  'function createProposal(string title, string description, uint8 proposalType, bytes proposalData)',
  'function vote(uint256 proposalId, bool support)',
  
  // Cross-chain integration
  'function onCall(tuple(bytes origin, address sender, uint256 chainID) context, address zrc20, uint256 amount, bytes message)',
  'function bookSessionCrossChain(address therapist, uint256 duration, string encryptedNotes)',
  'function joinWellnessCircleCrossChain(uint256 circleId)',
  'function donateToDAOCrossChain()',
  
  // Events
  'event TherapistRegistered(address indexed therapist, string anonymousId)',
  'event TherapistVerified(address indexed therapist, uint256 timestamp)',
  'event SessionBooked(uint256 indexed sessionId, address indexed therapist, address indexed client)',
  'event SessionCompleted(uint256 indexed sessionId, uint8 clientRating)',
  'event WellnessCircleCreated(uint256 indexed circleId, string name, address facilitator)',
  'event CircleMemberJoined(uint256 indexed circleId, address indexed member)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title)',
  'event VoteCasted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)',
  'event CrossChainPaymentReceived(address indexed from, uint256 amount, uint256 chainId)',
];

// TeraPToken ABI
const TERAP_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function mint(address to, uint256 amount)',
  'function stake(uint256 amount)',
  'function unstake(uint256 stakeIndex)',
  'function calculateStakingReward(address user, uint256 stakeIndex) view returns (uint256)',
  'function getVotingPower(address account) view returns (uint256)',
  'function stakedBalances(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
];

interface ContractAddresses {
  terapCore: string;
  terapToken: string;
}

interface TherapistProfile {
  therapist: string;
  anonymousId: string;
  specializations: string[];
  encryptedCredentials: string;
  hourlyRate: bigint;
  isVerified: boolean;
  isActive: boolean;
  totalSessions: bigint;
  rating: bigint;
  ratingCount: bigint;
  verificationTimestamp: bigint;
  encryptionPublicKey: string;
}

interface TherapySession {
  sessionId: bigint;
  therapist: string;
  client: string;
  duration: bigint;
  cost: bigint;
  timestamp: bigint;
  isCompleted: boolean;
  isPaid: boolean;
  clientRating: number;
  encryptedNotes: string;
}

interface UserSubscription {
  active: boolean;
  tierId: bigint;
  startTime: bigint;
  endTime: bigint;
  usedMinutes: bigint;
  remainingMinutes: bigint;
}

export class SmartContractIntegrationService {
  private providers: Map<number, ethers.Provider> = new Map();
  private signers: Map<number, ethers.Signer> = new Map();
  
  // Contract addresses by chain ID
  private contractAddresses: Map<number, ContractAddresses> = new Map([
    // ZetaChain Mainnet
    [7000, {
      terapCore: '0x1234567890123456789012345678901234567890', // Replace with actual
      terapToken: '0x0987654321098765432109876543210987654321', // Replace with actual
    }],
    // ZetaChain Testnet  
    [7001, {
      terapCore: '0x9876543210987654321098765432109876543210', // Replace with actual
      terapToken: '0x1111111111111111111111111111111111111111', // Replace with actual
    }],
  ]);

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // ZetaChain Mainnet
    this.providers.set(7000, new ethers.JsonRpcProvider('https://zetachain-evm.blockpi.network/v1/rpc/public'));
    
    // ZetaChain Testnet
    this.providers.set(7001, new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public'));
  }

  async initializeSigner(chainId: number, signer: ethers.Signer) {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Provider not available for chain ${chainId}`);
    }

    this.signers.set(chainId, signer.connect(provider));
  }

  private getContract(contractType: 'terapCore' | 'terapToken', chainId: number, withSigner = false): ethers.Contract {
    const addresses = this.contractAddresses.get(chainId);
    if (!addresses) {
      throw new Error(`Contract addresses not configured for chain ${chainId}`);
    }

    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Provider not available for chain ${chainId}`);
    }

    const abi = contractType === 'terapCore' ? TERAP_CORE_ABI : TERAP_TOKEN_ABI;
    const address = contractType === 'terapCore' ? addresses.terapCore : addresses.terapToken;

    if (withSigner) {
      const signer = this.signers.get(chainId);
      if (!signer) {
        throw new Error(`Signer not initialized for chain ${chainId}`);
      }
      return new ethers.Contract(address, abi, signer);
    }

    return new ethers.Contract(address, abi, provider);
  }

  // ============= THERAPIST MANAGEMENT =============

  /**
   * Register as a therapist on the platform with anonymous identity
   */
  async registerTherapist(
    anonymousId: string,
    specializations: string[],
    encryptedCredentials: string,
    hourlyRateUSD: number,
    encryptionPublicKey: string,
    chainId: number = 7000
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      
      // Convert USD rate to TERAP tokens (assuming 1 TERAP = $1 for now)
      const hourlyRateTerap = ethers.parseEther(hourlyRateUSD.toString());
      
      const tx = await contract.registerTherapist(
        anonymousId,
        specializations,
        encryptedCredentials,
        hourlyRateTerap,
        encryptionPublicKey
      );

      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error registering therapist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Get therapist profile
   */
  async getTherapistProfile(therapistAddress: string, chainId: number = 7000): Promise<TherapistProfile | null> {
    try {
      const contract = this.getContract('terapCore', chainId);
      const profile = await contract.getTherapistProfile(therapistAddress);
      
      return {
        therapist: profile[0],
        anonymousId: profile[1],
        specializations: profile[2],
        encryptedCredentials: profile[3],
        hourlyRate: profile[4],
        isVerified: profile[5],
        isActive: profile[6],
        totalSessions: profile[7],
        rating: profile[8],
        ratingCount: profile[9],
        verificationTimestamp: profile[10],
        encryptionPublicKey: profile[11],
      };

    } catch (error) {
      console.error('Error fetching therapist profile:', error);
      return null;
    }
  }

  // ============= SESSION MANAGEMENT =============

  /**
   * Book a therapy session
   */
  async bookSession(
    therapistAddress: string,
    durationMinutes: number,
    encryptedNotes: string,
    chainId: number = 7000
  ): Promise<{ success: boolean; sessionId?: string; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      
      // Get session cost
      const cost = await contract.calculateSessionCost(therapistAddress, durationMinutes);
      
      // Check user's TERAP balance and approve if needed
      const tokenContract = this.getContract('terapToken', chainId, true);
      const userAddress = await this.signers.get(chainId)!.getAddress();
      const balance = await tokenContract.balanceOf(userAddress);
      
      if (balance < cost) {
        throw new Error('Insufficient TERAP token balance');
      }

      // Approve spending
      const allowance = await tokenContract.allowance(userAddress, contract.target);
      if (allowance < cost) {
        const approveTx = await tokenContract.approve(contract.target, cost);
        await approveTx.wait();
      }

      // Book the session
      const tx = await contract.bookSession(therapistAddress, durationMinutes, encryptedNotes);
      const receipt = await tx.wait();

      // Extract session ID from events
      const sessionBookedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('SessionBooked(uint256,address,address)')
      );
      
      let sessionId;
      if (sessionBookedEvent) {
        const decodedEvent = contract.interface.decodeEventLog(
          'SessionBooked',
          sessionBookedEvent.data,
          sessionBookedEvent.topics
        );
        sessionId = decodedEvent.sessionId.toString();
      }

      return {
        success: true,
        sessionId,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error booking session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed',
      };
    }
  }

  /**
   * Complete a therapy session
   */
  async completeSession(
    sessionId: string,
    rating: number,
    chainId: number = 7000
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      
      const tx = await contract.completeSession(sessionId, rating);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error completing session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session completion failed',
      };
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string, chainId: number = 7000): Promise<TherapySession | null> {
    try {
      const contract = this.getContract('terapCore', chainId);
      const session = await contract.getSession(sessionId);
      
      return {
        sessionId: session[0],
        therapist: session[1],
        client: session[2],
        duration: session[3],
        cost: session[4],
        timestamp: session[5],
        isCompleted: session[6],
        isPaid: session[7],
        clientRating: session[8],
        encryptedNotes: session[9],
      };

    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  }

  /**
   * Calculate session cost
   */
  async calculateSessionCost(
    therapistAddress: string,
    durationMinutes: number,
    chainId: number = 7000
  ): Promise<{ costTerap: string; costUSD: string } | null> {
    try {
      const contract = this.getContract('terapCore', chainId);
      const cost = await contract.calculateSessionCost(therapistAddress, durationMinutes);
      
      // Convert to readable format
      const costTerap = ethers.formatEther(cost);
      const costUSD = costTerap; // Assuming 1 TERAP = $1 for now
      
      return {
        costTerap,
        costUSD,
      };

    } catch (error) {
      console.error('Error calculating session cost:', error);
      return null;
    }
  }

  // ============= SUBSCRIPTION & SERVICE ACCESS =============

  /**
   * Get user subscription status
   */
  async getUserSubscription(userAddress: string, chainId: number = 7000): Promise<UserSubscription | null> {
    try {
      const contract = this.getContract('terapCore', chainId);
      const subscription = await contract.getUserSubscription(userAddress);
      
      return {
        active: subscription[0],
        tierId: subscription[1],
        startTime: subscription[2],
        endTime: subscription[3],
        usedMinutes: subscription[4],
        remainingMinutes: subscription[5],
      };

    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  /**
   * Get user service limits and permissions
   */
  async getServiceLimits(userAddress: string, chainId: number = 7000): Promise<{
    monthlyMinutes: bigint;
    usedMinutes: bigint;
    remainingMinutes: bigint;
    emergencyAccess: boolean;
    groupAccess: boolean;
    recordingAccess: boolean;
    priorityBooking: boolean;
    personalTherapist: boolean;
    support24x7: boolean;
  } | null> {
    try {
      const contract = this.getContract('terapCore', chainId);
      const limits = await contract.getServiceLimits(userAddress);
      
      return {
        monthlyMinutes: limits[0],
        usedMinutes: limits[1],
        remainingMinutes: limits[2],
        emergencyAccess: limits[3],
        groupAccess: limits[4],
        recordingAccess: limits[5],
        priorityBooking: limits[6],
        personalTherapist: limits[7],
        support24x7: limits[8],
      };

    } catch (error) {
      console.error('Error fetching service limits:', error);
      return null;
    }
  }

  /**
   * Verify payment on blockchain
   */
  async verifyPayment(
    transactionHash: string,
    userAddress: string,
    amountUSD: number,
    chainId: number = 7000
  ): Promise<boolean> {
    try {
      const contract = this.getContract('terapCore', chainId);
      const amountWei = ethers.parseEther(amountUSD.toString());
      
      const isVerified = await contract.verifyPayment(
        ethers.id(transactionHash),
        userAddress,
        amountWei
      );
      
      return isVerified;

    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // ============= WELLNESS CIRCLES =============

  /**
   * Create a wellness circle
   */
  async createWellnessCircle(
    name: string,
    entryStakeUSD: number,
    chainId: number = 7000
  ): Promise<{ success: boolean; circleId?: string; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      const tokenContract = this.getContract('terapToken', chainId, true);
      
      const entryStake = ethers.parseEther(entryStakeUSD.toString());
      
      // Check balance and approve
      const userAddress = await this.signers.get(chainId)!.getAddress();
      const balance = await tokenContract.balanceOf(userAddress);
      
      if (balance < entryStake) {
        throw new Error('Insufficient TERAP token balance');
      }

      const allowance = await tokenContract.allowance(userAddress, contract.target);
      if (allowance < entryStake) {
        const approveTx = await tokenContract.approve(contract.target, entryStake);
        await approveTx.wait();
      }

      const tx = await contract.createWellnessCircle(name, entryStake);
      const receipt = await tx.wait();

      // Extract circle ID from events
      const circleCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('WellnessCircleCreated(uint256,string,address)')
      );
      
      let circleId;
      if (circleCreatedEvent) {
        const decodedEvent = contract.interface.decodeEventLog(
          'WellnessCircleCreated',
          circleCreatedEvent.data,
          circleCreatedEvent.topics
        );
        circleId = decodedEvent.circleId.toString();
      }

      return {
        success: true,
        circleId,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error creating wellness circle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Circle creation failed',
      };
    }
  }

  /**
   * Join a wellness circle
   */
  async joinWellnessCircle(
    circleId: string,
    chainId: number = 7000
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      
      const tx = await contract.joinWellnessCircle(circleId);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error joining wellness circle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join circle',
      };
    }
  }

  // ============= TERAP TOKEN OPERATIONS =============

  /**
   * Get TERAP token balance
   */
  async getTerapBalance(userAddress: string, chainId: number = 7000): Promise<string> {
    try {
      const contract = this.getContract('terapToken', chainId);
      const balance = await contract.balanceOf(userAddress);
      return ethers.formatEther(balance);

    } catch (error) {
      console.error('Error fetching TERAP balance:', error);
      return '0';
    }
  }

  /**
   * Stake TERAP tokens
   */
  async stakeTerap(
    amount: number,
    chainId: number = 7000
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapToken', chainId, true);
      const stakeAmount = ethers.parseEther(amount.toString());
      
      const tx = await contract.stake(stakeAmount);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error staking TERAP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Staking failed',
      };
    }
  }

  /**
   * Get voting power
   */
  async getVotingPower(userAddress: string, chainId: number = 7000): Promise<string> {
    try {
      const contract = this.getContract('terapToken', chainId);
      const votingPower = await contract.getVotingPower(userAddress);
      return ethers.formatEther(votingPower);

    } catch (error) {
      console.error('Error fetching voting power:', error);
      return '0';
    }
  }

  // ============= DAO GOVERNANCE =============

  /**
   * Create a governance proposal
   */
  async createProposal(
    title: string,
    description: string,
    proposalType: number,
    proposalData: string,
    chainId: number = 7000
  ): Promise<{ success: boolean; proposalId?: string; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      
      const tx = await contract.createProposal(title, description, proposalType, proposalData);
      const receipt = await tx.wait();

      // Extract proposal ID from events
      const proposalCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('ProposalCreated(uint256,address,string)')
      );
      
      let proposalId;
      if (proposalCreatedEvent) {
        const decodedEvent = contract.interface.decodeEventLog(
          'ProposalCreated',
          proposalCreatedEvent.data,
          proposalCreatedEvent.topics
        );
        proposalId = decodedEvent.proposalId.toString();
      }

      return {
        success: true,
        proposalId,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error creating proposal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Proposal creation failed',
      };
    }
  }

  /**
   * Vote on a proposal
   */
  async vote(
    proposalId: string,
    support: boolean,
    chainId: number = 7000
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const contract = this.getContract('terapCore', chainId, true);
      
      const tx = await contract.vote(proposalId, support);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
      };

    } catch (error) {
      console.error('Error voting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Voting failed',
      };
    }
  }

  // ============= UTILITIES =============

  /**
   * Listen for contract events
   */
  setupEventListeners(chainId: number = 7000) {
    const contract = this.getContract('terapCore', chainId);

    contract.on('SessionBooked', (sessionId, therapist, client, event) => {
      console.log('Session booked:', { sessionId, therapist, client });
      // Emit custom event or call callback
    });

    contract.on('SessionCompleted', (sessionId, rating, event) => {
      console.log('Session completed:', { sessionId, rating });
    });

    contract.on('TherapistRegistered', (therapist, anonymousId, event) => {
      console.log('Therapist registered:', { therapist, anonymousId });
    });

    // Add more event listeners as needed
  }

  /**
   * Get transaction receipt and decode logs
   */
  async getTransactionDetails(txHash: string, chainId: number = 7000): Promise<any> {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) throw new Error('Provider not available');

      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) return null;

      const contract = this.getContract('terapCore', chainId);
      
      // Decode logs
      const decodedLogs = receipt.logs.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);

      return {
        ...receipt,
        decodedLogs,
      };

    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }
}

// Singleton instance
export const smartContractService = new SmartContractIntegrationService();
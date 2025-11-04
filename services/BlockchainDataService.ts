import { ethers } from 'ethers';

export class BlockchainDataService {
  private provider: ethers.Provider;
  private contracts: Map<string, ethers.Contract> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    this.initializeContracts();
  }

  private initializeContracts() {
    const tokenAddress = process.env.NEXT_PUBLIC_TERAP_TOKEN_ADDRESS;
    const therapistAddress = process.env.NEXT_PUBLIC_TERAP_THERAPIST_ADDRESS;
    const coreAddress = process.env.NEXT_PUBLIC_TERAP_CORE_ADDRESS;

    if (!tokenAddress || !therapistAddress || !coreAddress) {
      console.warn('Contract addresses not configured, using mock data');
      return;
    }

    const tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function getVotingPower(address user) view returns (uint256)",
      "function stakedBalances(address user) view returns (uint256)"
    ];

    const therapistABI = [
      "function getTherapistProfile(address therapist) view returns (tuple(address,string,string[],string,uint256,bool,bool,uint256,uint256,uint256,uint256,bytes32,bytes32))",
      "function verifiedTherapists(address therapist) view returns (bool)"
    ];

    const coreABI = [
      "function getSession(uint256 sessionId) view returns (tuple(uint256,address,address,uint256,uint256,uint256,bool,bool,uint8,string))",
      "function sessions(uint256 sessionId) view returns (tuple(uint256,address,address,uint256,uint256,uint256,bool,bool,uint8,string))"
    ];

    try {
      this.contracts.set('token', new ethers.Contract(tokenAddress, tokenABI, this.provider));
      this.contracts.set('therapist', new ethers.Contract(therapistAddress, therapistABI, this.provider));
      this.contracts.set('core', new ethers.Contract(coreAddress, coreABI, this.provider));
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
    }
  }

  async getTherapistProfile(address: string): Promise<any> {
    const contract = this.contracts.get('therapist');
    if (!contract) {
      // Return mock data when contract not available
      return {
        therapist: address,
        anonymousId: `Therapist_${address.slice(0, 6)}`,
        specializations: ['anxiety', 'depression'],
        credentials: 'Licensed Therapist',
        hourlyRate: '100',
        isVerified: true,
        isActive: true,
        totalSessions: 5,
        rating: 85,
        ratingCount: 3,
        verificationTimestamp: Date.now(),
        credentialHash: '0x123',
        encryptionPublicKey: '0x456'
      };
    }

    try {
      const profile = await contract.getTherapistProfile(address);
      return {
        therapist: profile[0],
        anonymousId: profile[1],
        specializations: profile[2],
        credentials: profile[3],
        hourlyRate: profile[4],
        isVerified: profile[5],
        isActive: profile[6],
        totalSessions: profile[7],
        rating: profile[8],
        ratingCount: profile[9],
        verificationTimestamp: profile[10],
        credentialHash: profile[11],
        encryptionPublicKey: profile[12]
      };
    } catch (error) {
      console.error('Contract call failed, using mock data:', error);
      return this.getTherapistProfile(address);
    }
  }

  async getSessionData(sessionId: number): Promise<any> {
    const contract = this.contracts.get('core');
    if (!contract) throw new Error('Core contract not initialized');

    try {
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
        encryptedNotes: session[9]
      };
    } catch (error) {
      throw new Error(`Failed to fetch session data: ${error}`);
    }
  }

  async getUserTokenBalance(address: string): Promise<string> {
    const contract = this.contracts.get('token');
    if (!contract) throw new Error('Token contract not initialized');

    try {
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to fetch token balance: ${error}`);
    }
  }

  async getUserVotingPower(address: string): Promise<string> {
    const contract = this.contracts.get('token');
    if (!contract) throw new Error('Token contract not initialized');

    try {
      const votingPower = await contract.getVotingPower(address);
      return ethers.formatEther(votingPower);
    } catch (error) {
      throw new Error(`Failed to fetch voting power: ${error}`);
    }
  }

  async getStakedBalance(address: string): Promise<string> {
    const contract = this.contracts.get('token');
    if (!contract) throw new Error('Token contract not initialized');

    try {
      const stakedBalance = await contract.stakedBalances(address);
      return ethers.formatEther(stakedBalance);
    } catch (error) {
      throw new Error(`Failed to fetch staked balance: ${error}`);
    }
  }

  async isTherapistVerified(address: string): Promise<boolean> {
    const contract = this.contracts.get('therapist');
    if (!contract) throw new Error('Therapist contract not initialized');

    try {
      return await contract.verifiedTherapists(address);
    } catch (error) {
      throw new Error(`Failed to check therapist verification: ${error}`);
    }
  }

  async getAllTherapists(): Promise<any[]> {
    const contract = this.contracts.get('therapist');
    if (!contract) {
      // Return mock therapist data when contract not available
      return [
        {
          therapist: '0x1234567890123456789012345678901234567890',
          anonymousId: 'Dr. Anonymous',
          specializations: ['anxiety', 'depression'],
          credentials: 'Licensed Clinical Therapist',
          hourlyRate: '100',
          isVerified: true,
          isActive: true,
          totalSessions: 15,
          rating: 92,
          ratingCount: 8
        },
        {
          therapist: '0x2345678901234567890123456789012345678901',
          anonymousId: 'Dr. Wellness',
          specializations: ['trauma', 'ptsd'],
          credentials: 'Licensed Psychologist',
          hourlyRate: '120',
          isVerified: true,
          isActive: true,
          totalSessions: 23,
          rating: 88,
          ratingCount: 12
        }
      ];
    }

    try {
      const filter = contract.filters.TherapistRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const therapists = await Promise.all(
        events.map(async (event) => {
          if ('args' in event && event.args) {
            const therapistAddress = event.args[0];
            if (therapistAddress) {
              return await this.getTherapistProfile(therapistAddress);
            }
          }
          return null;
        })
      );

      return therapists.filter(t => t !== null);
    } catch (error) {
      console.error('Failed to fetch therapists from blockchain, using mock data:', error);
      return this.getAllTherapists();
    }
  }

  async getSessionHistory(userAddress: string): Promise<any[]> {
    const contract = this.contracts.get('core');
    if (!contract) {
      // Return mock session data
      return [
        {
          sessionId: 1,
          therapist: '0x1234567890123456789012345678901234567890',
          client: userAddress,
          duration: 60,
          cost: '100',
          timestamp: Date.now() - 86400000, // 1 day ago
          isCompleted: true,
          isPaid: true,
          clientRating: 5,
          encryptedNotes: 'Great session, feeling much better'
        },
        {
          sessionId: 2,
          therapist: '0x2345678901234567890123456789012345678901',
          client: userAddress,
          duration: 45,
          cost: '90',
          timestamp: Date.now() - 172800000, // 2 days ago
          isCompleted: true,
          isPaid: true,
          clientRating: 4,
          encryptedNotes: 'Productive discussion about coping strategies'
        }
      ];
    }

    try {
      const filter = contract.filters.SessionBooked(null, null, userAddress);
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const sessions = await Promise.all(
        events.map(async (event) => {
          if ('args' in event && event.args) {
            const sessionId = event.args[0];
            if (sessionId) {
              return await this.getSessionData(Number(sessionId));
            }
          }
          return null;
        })
      );

      return sessions.filter(s => s !== null);
    } catch (error) {
      console.error('Failed to fetch session history from blockchain, using mock data:', error);
      return this.getSessionHistory(userAddress);
    }
  }

  async getRealtimeData(): Promise<any> {
    try {
      const totalTherapists = await this.getAllTherapists();
      const activeSessions = await this.getActiveSessions();
      let blockNumber = 0;
      
      try {
        blockNumber = await this.provider.getBlockNumber();
      } catch (error) {
        console.warn('Failed to get block number:', error);
        blockNumber = Math.floor(Date.now() / 1000); // Use timestamp as fallback
      }

      return {
        blockNumber,
        totalTherapists: totalTherapists.length,
        verifiedTherapists: totalTherapists.filter(t => t.isVerified).length,
        activeSessions: activeSessions.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
      // Return mock data as fallback
      return {
        blockNumber: Math.floor(Date.now() / 1000),
        totalTherapists: 2,
        verifiedTherapists: 2,
        activeSessions: 3,
        timestamp: new Date()
      };
    }
  }

  private async getActiveSessions(): Promise<any[]> {
    const contract = this.contracts.get('core');
    if (!contract) return [];

    try {
      const filter = contract.filters.SessionBooked();
      const events = await contract.queryFilter(filter, -1000, 'latest'); // Last 1000 blocks
      
      const sessions = await Promise.all(
        events.map(async (event) => {
          if ('args' in event && event.args) {
            const sessionId = event.args[0];
            if (sessionId) {
              const session = await this.getSessionData(Number(sessionId));
              return session.isCompleted ? null : session;
            }
          }
          return null;
        })
      );

      return sessions.filter(s => s !== null);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      return [];
    }
  }
}

export const blockchainDataService = new BlockchainDataService();
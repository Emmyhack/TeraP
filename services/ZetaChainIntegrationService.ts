import { ethers } from 'ethers';

export class ZetaChainIntegrationService {
  private zetaClient: any = null;
  private isTestnet: boolean;

  constructor(isTestnet: boolean = false) {
    this.isTestnet = isTestnet;
  }

  async initialize(signer?: ethers.Signer) {
    try {
      if (typeof window === 'undefined') return null;
      // ZetaChain toolkit integration - optional dependency
      try {
        const toolkit = await import('@zetachain/toolkit' as any);
        this.zetaClient = new toolkit.ZetaChainClient({
          network: this.isTestnet ? 'testnet' : 'mainnet',
          signer
        });
        return this.zetaClient;
      } catch (importError) {
        console.warn('ZetaChain toolkit not available - using fallback');
        return null;
      }
    } catch (error) {
      console.warn('ZetaChain client initialization failed:', error);
      return null;
    }
  }

  async callContract(params: {
    destination: string;
    receiver: string;
    message: string;
    gasLimit: number;
  }) {
    if (!this.zetaClient) {
      throw new Error('ZetaChain client not initialized');
    }

    try {
      const tx = await this.zetaClient.call(params);
      return await tx.wait();
    } catch (error) {
      throw new Error(`ZetaChain contract call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTransactionStatus(txHash: string) {
    if (!this.zetaClient) {
      throw new Error('ZetaChain client not initialized');
    }

    try {
      return await this.zetaClient.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const zetaChainService = new ZetaChainIntegrationService();
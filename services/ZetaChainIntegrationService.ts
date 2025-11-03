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
      const toolkit = await import('@zetachain/toolkit').catch(() => null);
      if (!toolkit) {
        console.warn('ZetaChain toolkit not available');
        return null;
      }
      this.zetaClient = new toolkit.ZetaChainClient({
        network: this.isTestnet ? 'testnet' : 'mainnet',
        signer
      });
      return this.zetaClient;
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
declare global {
  interface Window {
    ethereum?: any;
    solana?: {
      isPhantom: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      signTransaction(transaction: any): Promise<any>;
      publicKey: { toString(): string };
    };
    suiWallet?: {
      connect(): Promise<void>;
      signAndExecuteTransactionBlock(params: any): Promise<any>;
    };
    tonConnectUI?: any;
  }
}

export {};
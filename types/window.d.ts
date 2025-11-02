interface EthereumProvider {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

interface SolanaProvider {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: any): Promise<any>;
  signAllTransactions(transactions: any[]): Promise<any[]>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

interface SuiProvider {
  connect(): Promise<any>;
  disconnect(): Promise<void>;
  signAndExecuteTransactionBlock(options: any): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

interface TonProvider {
  send(method: string, params?: any[]): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    solana?: SolanaProvider;
    suiWallet?: SuiProvider;
    ton?: TonProvider;
  }
}

export {};

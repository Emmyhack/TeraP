declare global {
  interface Window {
    /** EIP-1193 provider injected by the user's EVM wallet (MetaMask, Rabby, Coinbase Wallet, ...). */
    ethereum?: any;
  }
}

export {};

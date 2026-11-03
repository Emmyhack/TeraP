import type { Eip1193Provider } from 'ethers';

interface InjectedProvider extends Eip1193Provider {
  isMetaMask?: boolean;
  providers?: InjectedProvider[];
}

declare global {
  interface Window {
    /** EIP-1193 provider injected by the user's EVM wallet (MetaMask, Rabby, Coinbase Wallet, ...). */
    ethereum?: InjectedProvider;
  }
}

export {};

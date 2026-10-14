/**
 * Chain + contract configuration for the TeraP frontend.
 *
 * Addresses come from NEXT_PUBLIC_* environment variables (see .env.example). After running
 * `forge script script/Deploy.s.sol`, copy the addresses from deployments/<chainId>.json.
 */
import TeraPTokenABI from './abi/TeraPToken.json';
import TeraPCoreABI from './abi/TeraPCore.json';
import TeraPSubscriptionABI from './abi/TeraPSubscription.json';
import TeraPGovernanceABI from './abi/TeraPGovernance.json';
import WellnessGameificationABI from './abi/WellnessGameification.json';
import ZKCredentialVerifierABI from './abi/ZKCredentialVerifier.json';

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  gateway: string;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  7001: {
    id: 7001,
    name: 'ZetaChain Athens Testnet',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    explorerUrl: 'https://athens.explorer.zetachain.com',
    nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
    gateway: '0x6c533f7fE93fAE114d0954697069Df33C9B74fD7',
  },
  7000: {
    id: 7000,
    name: 'ZetaChain Mainnet',
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    explorerUrl: 'https://explorer.zetachain.com',
    nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
    gateway: '0x6c533f7fE93fAE114d0954697069Df33C9B74fD7',
  },
  31337: {
    id: 31337,
    name: 'Local Anvil',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    gateway: '0x000000000000000000000000000000000000dEaD',
  },
};

const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 7001);

export const CHAIN: ChainConfig = {
  ...(SUPPORTED_CHAINS[envChainId] ?? SUPPORTED_CHAINS[7001]),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || (SUPPORTED_CHAINS[envChainId] ?? SUPPORTED_CHAINS[7001]).rpcUrl,
};

const ZERO = '0x0000000000000000000000000000000000000000';
const addr = (v?: string) => (v && /^0x[0-9a-fA-F]{40}$/.test(v) && v !== ZERO ? v : '');

export const ADDRESSES = {
  TeraPToken: addr(process.env.NEXT_PUBLIC_TERAP_TOKEN_ADDRESS),
  TeraPCore: addr(process.env.NEXT_PUBLIC_TERAP_CORE_ADDRESS),
  TeraPSubscription: addr(process.env.NEXT_PUBLIC_TERAP_SUBSCRIPTION_ADDRESS),
  TeraPGovernance: addr(process.env.NEXT_PUBLIC_TERAP_GOVERNANCE_ADDRESS),
  WellnessGameification: addr(process.env.NEXT_PUBLIC_TERAP_GAMIFICATION_ADDRESS),
  ZKCredentialVerifier: addr(process.env.NEXT_PUBLIC_TERAP_CREDENTIAL_VERIFIER_ADDRESS),
  Gateway: addr(process.env.NEXT_PUBLIC_ZETACHAIN_GATEWAY) || CHAIN.gateway,
};

/** True when the two contracts every screen depends on are configured. */
export const CONTRACTS_CONFIGURED = Boolean(ADDRESSES.TeraPToken && ADDRESSES.TeraPCore);

export const ABIS = {
  TeraPToken: TeraPTokenABI,
  TeraPCore: TeraPCoreABI,
  TeraPSubscription: TeraPSubscriptionABI,
  TeraPGovernance: TeraPGovernanceABI,
  WellnessGameification: WellnessGameificationABI,
  ZKCredentialVerifier: ZKCredentialVerifierABI,
} as const;

export const explorerTx = (hash: string) => (CHAIN.explorerUrl ? `${CHAIN.explorerUrl}/tx/${hash}` : '');
export const explorerAddress = (a: string) => (CHAIN.explorerUrl ? `${CHAIN.explorerUrl}/address/${a}` : '');

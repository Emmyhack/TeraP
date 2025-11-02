/**
 * ZetaChain Configuration for TeraP Universal Platform
 * This configuration enables seamless multi-chain deployment and interaction
 */

const config = {
  // Project Configuration
  name: "terap-universal",
  version: "1.0.0",
  
  // Network Configuration
  networks: {
    zetachain_testnet: {
      chainId: 7001,
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      gateway: "0x3c85e0cA1001F085AC2c95c50Dd0a2E5A0C0E5b7", // Athens testnet gateway
      tss: "0x3c85e0cA1001F085AC2c95c50Dd0a2E5A0C0E5b7"
    },
    zetachain_mainnet: {
      chainId: 7000,
      url: "https://zetachain-evm.blockpi.network/v1/rpc/public", 
      gateway: "0x3c85e0cA1001F085AC2c95c50Dd0a2E5A0C0E5b7", // Mainnet gateway
      tss: "0x3c85e0cA1001F085AC2c95c50Dd0a2E5A0C0E5b7"
    },
    ethereum_testnet: {
      chainId: 11155111, // Sepolia
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      gateway: "0x3c85e0cA1001F085AC2c95c50Dd0a2E5A0C0E5b7"
    },
    bitcoin_testnet: {
      chainId: 18332, // Bitcoin testnet
      gateway: "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    },
    solana_devnet: {
      chainId: 90001,
      url: "https://api.devnet.solana.com"
    }
  },

  // Contract Configuration
  contracts: {
    TeraPCore: {
      path: "./contracts/TeraPCore.sol",
      args: [], // Constructor args for universal contract
      upgradeable: true
    },
    TeraPToken: {
      path: "./contracts/TeraPToken.sol", 
      args: [],
      upgradeable: true
    },
    UniversalContract: {
      path: "./contracts/UniversalContract.sol",
      args: []
    }
  },

  // ZetaChain CLI Integration
  cli: {
    // Account management
    accounts: {
      default: {
        type: "evm",
        name: "terap-deployer"
      }
    },
    
    // Deployment settings
    deployment: {
      network: "zetachain_testnet",
      verify: true,
      gasLimit: "5000000"
    },
    
    // Cross-chain operations
    crossChain: {
      supportedChains: ["ethereum", "bitcoin", "solana", "sui", "ton"],
      defaultGasLimit: "1000000"
    }
  },

  // Development settings
  development: {
    localnet: {
      port: 8545,
      chains: ["solana", "bitcoin"],
      autoStart: true
    }
  }
};

module.exports = config;
# TeraP Universal

**A decentralized therapy and wellness DAO platform built on ZetaChain for universal cross-chain access to mental health services.**

## Overview

TeraP Universal is a comprehensive blockchain-based platform that democratizes access to mental health services through decentralized governance, cross-chain functionality, and privacy-preserving technologies. The platform enables secure therapy sessions, community wellness circles, and transparent DAO governance across multiple blockchain networks.

## Key Features

### Core Platform
- **Decentralized Therapy Sessions**: Book and conduct secure therapy sessions with verified therapists
- **Wellness Circles**: Join community support groups with stake-based participation
- **DAO Governance**: Democratic decision-making for platform development and policies
- **Cross-Chain Compatibility**: Access services from any supported blockchain network
- **Privacy-First Design**: Zero-knowledge proofs and encrypted communications

### Token Economics
- **TERAP Token**: Native governance and utility token with staking rewards
- **Session NFTs**: Proof of completed therapy sessions for insurance and records
- **Staking Rewards**: Enhanced voting power and yield for token holders
- **Cross-Chain Payments**: Seamless payments across different blockchain networks

### Supported Networks
- ZetaChain (Primary)
- Ethereum
- Bitcoin
- Solana
- Sui
- TON
- Somnia
- BSC, Polygon, Avalanche, Arbitrum, Optimism, Base

## Architecture

### Smart Contracts
- **TeraPToken**: ERC20 governance token with staking and voting capabilities
- **TeraPCore**: Main platform contract handling sessions, circles, and DAO functions
- **UniversalContract**: ZetaChain integration for cross-chain messaging

### Frontend
- **Next.js 14**: Modern React framework with TypeScript
- **Multi-Chain Wallet Support**: MetaMask, Phantom, Sui Wallet, TON Wallet
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-Time Features**: Live session management and notifications

## Deployed Contracts

### ZetaChain Athens Testnet
- **TeraPToken**: `0x301f106a714cD1b5524D9F9EEa6241fE4BBF14d0`
- **TeraPCore**: `0x00D92e7A9Ea96F7efb28A5e8fD8dA8772bb4dc37`
- **Gateway**: `0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7`
- **Chain ID**: 7001

## Quick Start

### Prerequisites
- Node.js 18+
- Foundry toolkit
- Git

### Installation
```bash
git clone https://github.com/Emmyhack/TeraP.git
cd TeraP
npm install
```

### Environment Setup
```bash
cp .env.deployed .env.local
```

### Development
```bash
# Start frontend
npm run dev

# Compile contracts
npm run compile

# Run tests
npm run test
```

### Deployment
```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

## Smart Contract Development

### Build Contracts
```bash
forge build
```

### Run Tests
```bash
forge test
```

### Deploy Contracts
```bash
forge script script/ZetaChainProxyDeploy.s.sol --rpc-url $RPC_URL --broadcast
```

### Verify Contracts
```bash
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_PATH> --chain-id 7001
```

## Cross-Chain Operations

### ZetaChain CLI Integration
```bash
# Query contract balance
zetachain query balances --evm <CONTRACT_ADDRESS> --network testnet

# Call from Ethereum
zetachain evm call --chain-id 11155111 --receiver <CONTRACT_ADDRESS> --types 'string,string,uint256' --values 'therapist,certified,100'

# Monitor transactions
zetachain query cctx --hash <TRANSACTION_HASH>
```

## Platform Usage

### For Therapists
1. Register with credentials and specializations
2. Set hourly rates in TERAP tokens
3. Get verified by DAO governance
4. Accept session bookings
5. Conduct secure therapy sessions

### For Clients
1. Connect multi-chain wallet
2. Purchase TERAP tokens
3. Book sessions with verified therapists
4. Join wellness circles
5. Participate in DAO governance

### For DAO Members
1. Stake TERAP tokens for voting power
2. Create and vote on proposals
3. Verify therapist credentials
4. Govern platform parameters

## Security Features

- **Upgradeable Contracts**: UUPS proxy pattern for secure upgrades
- **Access Control**: Role-based permissions and multi-sig governance
- **Encrypted Communications**: End-to-end encryption for therapy sessions
- **Zero-Knowledge Proofs**: Privacy-preserving identity verification
- **Cross-Chain Security**: ZetaChain's validated cross-chain messaging

## Testing

The platform includes comprehensive test coverage:
- Unit tests for all smart contract functions
- Integration tests for cross-chain operations
- Frontend component testing
- End-to-end user workflow testing

```bash
# Run all tests
npm test

# Smart contract tests only
forge test

# Frontend tests
npm run test:frontend
```

## Documentation

- [Project Status](PROJECT_STATUS.md)
- [Deployment Guide](DEPLOYMENT_STATUS.md)
- [ZetaChain Integration](ZETACHAIN_DEPLOYMENT.md)
- [Privacy Documentation](PRIVACY_DOCUMENTATION.md)
- [Payment System](PAYMENT_SYSTEM_DOCUMENTATION.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Discord**: [ZetaChain Community](https://discord.gg/zetachain)
- **Documentation**: [ZetaChain Docs](https://zetachain.com/docs)
- **Issues**: [GitHub Issues](https://github.com/Emmyhack/TeraP/issues)

## Acknowledgments

- ZetaChain for cross-chain infrastructure
- OpenZeppelin for security standards
- Foundry for development toolkit
- Next.js for frontend framework
- Amazon Q Developer for AI-assisted development and code optimization

---

**TeraP Universal - Democratizing Mental Health Through Blockchain Technology**

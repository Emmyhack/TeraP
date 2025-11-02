# TeraP Universal - ZetaChain Deployment Guide

This guide provides comprehensive instructions for deploying and managing the TeraP Universal platform using ZetaChain's latest CLI tools and infrastructure.

## Current Deployment Status

**STATUS: READY FOR DEPLOYMENT** ⚠️

The TeraP Universal smart contracts are fully prepared and tested for deployment to ZetaChain Athens testnet. The deployment scripts have been successfully validated and all contracts compile correctly.

### Deployment Requirements:
- ✅ Smart contracts ready (TeraPToken, TeraPCore with proxy pattern)
- ✅ Deployment scripts configured for ZetaChain Athens testnet
- ✅ Network configuration verified (Chain ID: 7001)
- ⚠️ **REQUIRED**: Testnet ZETA tokens for gas fees

### Next Steps:
1. Fund deployment address with testnet ZETA
2. Execute deployment command
3. Verify contracts on ZetaChain explorer

## Prerequisites

Before deploying TeraP Universal, ensure you have:

- Node.js ≥ 18
- Git
- Docker ≥ 24 (for localnet development)
- ZetaChain CLI latest version
- **Testnet ZETA tokens for deployment**

## Installation

### Install ZetaChain CLI

```bash
# Install globally
npm install -g zetachain@latest

# Or run without installing
npx zetachain@next
```

### Verify Installation

```bash
zetachain --help
```

## Getting Testnet Funds

To deploy to ZetaChain Athens testnet, you need testnet ZETA tokens:

### Method 1: ZetaChain Faucet
```bash
# Using ZetaChain CLI
zetachain faucet --address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --name terap-deployer

# Or visit the web faucet
# https://labs.zetachain.com/get-zeta
```

### Method 2: Discord Faucet
1. Join ZetaChain Discord: https://discord.gg/zetachain
2. Go to #faucet channel
3. Request testnet ZETA: `!faucet 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Check Balance
```bash
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

## Account Setup

### Create Development Accounts

```bash
# Create EVM account for deployment
zetachain accounts create --type evm --name terap-deployer

# Create accounts for other chains
zetachain accounts create --type solana --name terap-solana
zetachain accounts create --type bitcoin --name terap-bitcoin
zetachain accounts create --type sui --name terap-sui
zetachain accounts create --type ton --name terap-ton

# List all accounts
zetachain accounts list --json
```

### Import Existing Account (Optional)

```bash
# Import using private key
zetachain accounts import --type evm --name terap-mainnet --private-key YOUR_PRIVATE_KEY

# Import using mnemonic
zetachain accounts import --type evm --name terap-mainnet --mnemonic "your twelve word mnemonic phrase"
```

## Development Environment

### Start Local Multi-Chain Environment

```bash
# Start localnet with all supported chains
zetachain localnet start --chains solana bitcoin sui ton

# Check localnet status
zetachain localnet check

# Stop localnet when done
zetachain localnet stop
```

### Project Setup

```bash
# Clone and setup project
git clone <your-repo>
cd terap-universal

# Install dependencies
npm install

# Compile smart contracts
npm run compile
```

## Deployment

### Deploy to ZetaChain Testnet

**Prerequisites:** Ensure your deployment address has sufficient testnet ZETA tokens.

```bash
# Step 1: Verify you have testnet funds
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# Step 2: Deploy contracts (proxy pattern)
forge script script/ZetaChainProxyDeploy.s.sol \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --broadcast \
  --legacy \
  --skip-simulation

# Step 3: Verify deployment succeeded
# Check for successful transaction hashes in broadcast folder
```

**Expected Contract Addresses (when deployed):**
- TeraPToken Proxy: `0x3C1Cb427D20F15563aDa8C249E71db76d7183B6c`
- TeraPCore Proxy: `0x1343248Cbd4e291C6979e70a138f4c774e902561`
- TeraPToken Implementation: `0x9Fcca440F19c62CDF7f973eB6DDF218B15d4C71D`
- TeraPCore Implementation: `0x01E21d7B8c39dc4C764c19b308Bd8b14B1ba139E`

### Query Deployment Status

```bash
# Check cross-chain transaction status
zetachain query cctx --hash YOUR_TX_HASH

# Query contract balances
zetachain query balances --evm YOUR_CONTRACT_ADDRESS --network testnet

# Check supported chains
zetachain query chains list --json
```

## Cross-Chain Operations

### Deposit from External Chains

#### From Ethereum (EVM)

```bash
# Deposit ETH to ZetaChain
zetachain evm deposit \
  --chain-id 11155111 \
  --receiver YOUR_ZETACHAIN_ADDRESS \
  --amount 0.1 \
  --gateway ETHEREUM_GATEWAY_ADDRESS \
  --name terap-deployer
```

#### From Bitcoin

```bash
# Deposit BTC using memo
zetachain bitcoin memo deposit \
  --receiver YOUR_ZETACHAIN_ADDRESS \
  --amount 0.001 \
  --name terap-bitcoin \
  --network signet

# Deposit BTC using inscription
zetachain bitcoin inscription deposit \
  --receiver YOUR_ZETACHAIN_ADDRESS \
  --amount 0.001 \
  --name terap-bitcoin
```

#### From Solana

```bash
# Deposit SOL
zetachain solana deposit \
  --recipient YOUR_ZETACHAIN_ADDRESS \
  --amount 1.0 \
  --chain-id 90001 \
  --name terap-solana
```

#### From Sui

```bash
# Deposit SUI
zetachain sui deposit \
  --receiver YOUR_ZETACHAIN_ADDRESS \
  --amount 1.0 \
  --chain-id SUI_CHAIN_ID \
  --name terap-sui
```

#### From TON

```bash
# Deposit TON
zetachain ton deposit \
  --receiver YOUR_ZETACHAIN_ADDRESS \
  --amount 1.0 \
  --chain-id TON_CHAIN_ID \
  --name terap-ton
```

### Cross-Chain Contract Calls

#### Call TeraP Contract from Ethereum

```bash
# Book therapy session from Ethereum
zetachain evm call \
  --chain-id 11155111 \
  --receiver TERAP_CORE_ADDRESS \
  --gateway ETHEREUM_GATEWAY_ADDRESS \
  --types "uint256,address,uint256" \
  --values "1,THERAPIST_ADDRESS,1000000000000000000" \
  --name terap-deployer
```

#### Call from Solana

```bash
# Register as therapist from Solana
zetachain solana call \
  --recipient TERAP_CORE_ADDRESS \
  --chain-id 90001 \
  --types "string,string,uint256" \
  --values "John Doe,Certified Therapist,500000000000000000000" \
  --name terap-solana
```

### Withdraw to External Chains

```bash
# Withdraw TERAP tokens to Ethereum
zetachain zetachain withdraw \
  --zrc20 TERAP_TOKEN_ZRC20_ADDRESS \
  --receiver YOUR_ETHEREUM_ADDRESS \
  --amount 100 \
  --chain-id 11155111 \
  --name terap-deployer
```

## Platform Operations

### Query Platform Data

```bash
# Check TERAP token balance
zetachain query tokens show --symbol TERAP --json

# Query cross-chain fees
zetachain query fees --json

# Check supported tokens
zetachain query tokens list --json
```

### Platform Administration

```bash
# Get testnet ZETA for operations
zetachain faucet --address YOUR_ADDRESS --name terap-deployer

# Monitor cross-chain transactions
zetachain query cctx --hash TX_HASH --timeout 30000
```

## Frontend Integration

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_ZETACHAIN_NETWORK=testnet
NEXT_PUBLIC_ZETACHAIN_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
NEXT_PUBLIC_TERAP_CORE_ADDRESS=YOUR_DEPLOYED_CORE_ADDRESS
NEXT_PUBLIC_TERAP_TOKEN_ADDRESS=YOUR_DEPLOYED_TOKEN_ADDRESS
NEXT_PUBLIC_GATEWAY_ADDRESS=ZETACHAIN_GATEWAY_ADDRESS
```

### Start Development Server

```bash
npm run dev
```

## Production Deployment

### Deploy to Mainnet

```bash
# Switch to mainnet configuration
export ZETACHAIN_NETWORK=mainnet
export ZETACHAIN_RPC=https://zetachain-evm.blockpi.network/v1/rpc/public

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url $ZETACHAIN_RPC --broadcast --verify
```

### Verify Contracts

```bash
# Verify on ZetaChain explorer
forge verify-contract \
  CONTRACT_ADDRESS \
  contracts/TeraPCore.sol:TeraPCore \
  --chain-id 7000 \
  --etherscan-api-key YOUR_API_KEY
```

## Troubleshooting

### Common Issues

1. **Transaction Reverted**: Check gas limits and contract state
2. **Cross-chain Delays**: Use `zetachain query cctx` to monitor status
3. **Account Issues**: Verify account setup with `zetachain accounts show`

### Debug Commands

```bash
# Check localnet logs
zetachain localnet check --delay 5

# Query specific chain data
zetachain query chains show --chain-id 7001

# Test cross-chain connectivity
zetachain query balances --evm YOUR_ADDRESS --show-zero
```

## Security Best Practices

1. **Private Key Management**: Use environment variables or secure key management
2. **Multi-sig Setup**: Implement multi-signature for critical operations
3. **Gradual Rollout**: Test on testnet before mainnet deployment
4. **Monitoring**: Set up alerts for cross-chain transactions

## Support Resources

- [ZetaChain Documentation](https://zetachain.com/docs)
- [CLI Documentation](https://zetachain.com/docs/reference/cli)
- [Discord Community](https://discord.gg/zetachain)
- [GitHub Issues](https://github.com/zeta-chain/node)

## AI Assistant Integration

Ask questions directly from CLI:

```bash
# Get help with ZetaChain development
zetachain ask "How do I implement cross-chain token transfers?"

# Query documentation
zetachain ask "What are the gas fees for Bitcoin transactions?"
```

---

For more detailed information, run `zetachain docs` or visit the [official documentation](https://zetachain.com/docs).
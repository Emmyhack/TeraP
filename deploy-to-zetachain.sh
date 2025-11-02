#!/bin/bash
echo "🚀 Deploying TeraP Universal to ZetaChain Athens Testnet..."
echo "📍 Using funded address: 0x9dd7413f7876aa2dc2ef3ca66a70e65841c190bf"
echo "💰 Current balance: $(cast balance 0x9dd7413f7876aa2dc2ef3ca66a70e65841c190bf --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public)"
echo ""
echo "⚡ Starting deployment..."
forge script script/ZetaChainProxyDeploy.s.sol \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --broadcast \
  --legacy \
  --skip-simulation \
  --verify \
  --etherscan-api-key YOUR_API_KEY_HERE
echo ""
echo "✅ Deployment completed!"


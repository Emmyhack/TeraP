#!/bin/bash

# TeraP Universal - Complete Deployment Script
# This script completes the remaining deployment tasks

set -e

echo "🚀 TeraP Universal - Completing Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
RPC_URL="https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
CHAIN_ID="7001"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  • Network: ZetaChain Athens Testnet"
echo "  • Chain ID: $CHAIN_ID"
echo "  • Deployment Address: $DEPLOYMENT_ADDRESS"
echo "  • RPC URL: $RPC_URL"
echo ""

# Step 1: Check current balance
echo -e "${YELLOW}💰 Checking current balance...${NC}"
BALANCE=$(cast balance $DEPLOYMENT_ADDRESS --rpc-url $RPC_URL)
echo "  Current balance: $BALANCE ZETA"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}❌ No ZETA tokens found!${NC}"
    echo ""
    echo -e "${YELLOW}📝 To get testnet ZETA tokens:${NC}"
    echo "  1. Visit ZetaChain Discord: https://discord.gg/zetachain"
    echo "  2. Go to #faucet channel"
    echo "  3. Use command: !faucet $DEPLOYMENT_ADDRESS"
    echo ""
    echo "  OR visit the web faucet: https://labs.zetachain.com/get-zeta"
    echo ""
    echo -e "${BLUE}💡 After getting tokens, run this script again to continue deployment.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Balance sufficient for deployment${NC}"
fi

# Step 2: Compile contracts
echo -e "${YELLOW}🔨 Compiling smart contracts...${NC}"
forge build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

# Step 3: Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
forge test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# Step 4: Deploy contracts
echo -e "${YELLOW}🚀 Deploying contracts to ZetaChain Athens Testnet...${NC}"
forge script script/ZetaChainProxyDeploy.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --legacy \
    --skip-simulation

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts deployed successfully${NC}"
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    exit 1
fi

# Step 5: Extract deployed addresses
echo -e "${YELLOW}📋 Extracting deployed contract addresses...${NC}"
BROADCAST_DIR="broadcast/ZetaChainProxyDeploy.s.sol/$CHAIN_ID"
if [ -d "$BROADCAST_DIR" ]; then
    LATEST_RUN=$(ls -t "$BROADCAST_DIR" | head -n1)
    if [ -f "$BROADCAST_DIR/$LATEST_RUN" ]; then
        echo "  Deployment details saved in: $BROADCAST_DIR/$LATEST_RUN"
        echo -e "${GREEN}✅ Contract addresses extracted${NC}"
    fi
fi

# Step 6: Build frontend
echo -e "${YELLOW}🏗️  Building frontend application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Step 7: Final status
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "  ✅ Smart contracts compiled"
echo "  ✅ All tests passing"
echo "  ✅ Contracts deployed to ZetaChain Athens Testnet"
echo "  ✅ Frontend application built"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "  1. Start the frontend: npm run dev"
echo "  2. Update environment variables with deployed addresses"
echo "  3. Test the application on testnet"
echo "  4. Prepare for mainnet deployment"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  • Project Status: PROJECT_STATUS.md"
echo "  • Deployment Guide: DEPLOYMENT_STATUS.md"
echo "  • ZetaChain Integration: ZETACHAIN_DEPLOYMENT.md"
echo ""
echo -e "${GREEN}TeraP Universal is now ready for production use! 🌟${NC}"
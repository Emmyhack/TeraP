import { NextResponse } from 'next/server';
import { CHAIN, CONTRACTS_CONFIGURED } from '@/config/contracts';
import { TeraPContracts, terapContracts } from '@/services/TeraPContracts';

export const dynamic = 'force-dynamic';

/** GET /api/analytics — on-chain platform statistics (bigints serialised as strings). */
export async function GET() {
  if (!CONTRACTS_CONFIGURED) {
    return NextResponse.json({ error: 'Contracts not configured' }, { status: 503 });
  }

  try {
    const stats = await terapContracts.getPlatformStats();
    return NextResponse.json({
      ...stats,
      treasury: stats.treasury.toString(),
      treasuryTerap: TeraPContracts.formatTerap(stats.treasury),
      totalStaked: stats.totalStaked.toString(),
      totalStakedTerap: TeraPContracts.formatTerap(stats.totalStaked),
      totalSupply: stats.totalSupply.toString(),
      totalSupplyTerap: TeraPContracts.formatTerap(stats.totalSupply),
      chainId: CHAIN.id,
      chainName: CHAIN.name,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: TeraPContracts.parseError(error) }, { status: 500 });
  }
}

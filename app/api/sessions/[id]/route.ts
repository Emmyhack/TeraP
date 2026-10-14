import { NextRequest, NextResponse } from 'next/server';
import { CONTRACTS_CONFIGURED } from '@/config/contracts';
import { TeraPContracts, terapContracts } from '@/services/TeraPContracts';

export const dynamic = 'force-dynamic';

/** GET /api/sessions/:id — a single session read from TeraPCore (bigints serialised as strings). */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!CONTRACTS_CONFIGURED) {
    return NextResponse.json({ error: 'Contracts not configured' }, { status: 503 });
  }

  const sessionId = Number(params.id);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  try {
    const session = await terapContracts.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...session,
      cost: session.cost.toString(),
      costTerap: TeraPContracts.formatTerap(session.cost),
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: TeraPContracts.parseError(error) }, { status: 500 });
  }
}

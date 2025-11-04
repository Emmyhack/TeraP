import { NextRequest, NextResponse } from 'next/server';
import { blockchainDataService } from '@/services/BlockchainDataService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id);
    
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const sessionData = await blockchainDataService.getSessionData(sessionId);
    
    const enrichedData = {
      ...sessionData,
      messages: [`Session ${sessionId} data`],
      metadata: {
        blockchain: 'zetachain',
        verified: true,
        encrypted: true
      }
    };

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    );
  }
}
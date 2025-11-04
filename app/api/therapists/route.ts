import { NextRequest, NextResponse } from 'next/server';
import { blockchainDataService } from '@/services/BlockchainDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const verified = searchParams.get('verified') === 'true';

    let therapists = await blockchainDataService.getAllTherapists();
    
    if (specialty) {
      therapists = therapists.filter(t => 
        t.specializations.includes(specialty.toLowerCase())
      );
    }
    
    if (verified) {
      therapists = therapists.filter(t => t.isVerified);
    }

    return NextResponse.json({
      therapists,
      total: therapists.length,
      filters: { specialty, verified }
    });
  } catch (error) {
    console.error('Therapists API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch therapists' },
      { status: 500 }
    );
  }
}
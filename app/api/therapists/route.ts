import { NextRequest, NextResponse } from 'next/server';
import { CONTRACTS_CONFIGURED } from '@/config/contracts';
import { TeraPContracts, terapContracts, TherapistProfile } from '@/services/TeraPContracts';

export const dynamic = 'force-dynamic';

/** Serialise a profile for JSON: bigints become strings, hourlyRate also as a TERAP string. */
function serialise(t: TherapistProfile) {
  return {
    ...t,
    hourlyRate: t.hourlyRate.toString(),
    hourlyRateTerap: TeraPContracts.formatTerap(t.hourlyRate),
  };
}

/** GET /api/therapists?specialty=<text> — verified, active therapists read from TeraPCore. */
export async function GET(request: NextRequest) {
  if (!CONTRACTS_CONFIGURED) {
    return NextResponse.json({ error: 'Contracts not configured' }, { status: 503 });
  }

  const specialty = request.nextUrl.searchParams.get('specialty')?.trim().toLowerCase() || null;

  try {
    let therapists = await terapContracts.getVerifiedTherapists();
    if (specialty) {
      therapists = therapists.filter((t) => t.specializations.some((s) => s.toLowerCase().includes(specialty)));
    }
    return NextResponse.json({
      therapists: therapists.map(serialise),
      total: therapists.length,
      filters: { specialty },
    });
  } catch (error) {
    console.error('Therapists API error:', error);
    return NextResponse.json({ error: TeraPContracts.parseError(error) }, { status: 500 });
  }
}

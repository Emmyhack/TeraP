import { NextRequest, NextResponse } from 'next/server';
import { privateAnalyticsService } from '@/services/PrivateAnalyticsService';
import { blockchainDataService } from '@/services/BlockchainDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'population';

    switch (type) {
      case 'population': {
        const realtimeData = await blockchainDataService.getRealtimeData();
        const encryptedData = {
          sessionData: [{ data: 'encrypted_session_data' }],
          userMetrics: [{ data: 'encrypted_user_metrics' }],
          treatmentOutcomes: [{ data: 'encrypted_outcomes' }]
        };
        
        const insights = await privateAnalyticsService.generatePopulationInsights(encryptedData);
        
        return NextResponse.json({
          ...insights,
          metadata: {
            totalTherapists: realtimeData.totalTherapists,
            verifiedTherapists: realtimeData.verifiedTherapists,
            activeSessions: realtimeData.activeSessions,
            lastUpdated: realtimeData.timestamp
          }
        });
      }
      
      case 'trends': {
        const predictions = await privateAnalyticsService.predictMentalHealthTrends({
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'daily'
        });
        
        return NextResponse.json(predictions);
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
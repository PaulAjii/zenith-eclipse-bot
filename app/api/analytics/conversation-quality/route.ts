import { NextRequest, NextResponse } from 'next/server';
import { getConversationQualityMetrics } from '@/utils/analytics';
import { ensureAnalyticsInitialized } from '@/app/api/init';

/**
 * @route GET /api/analytics/conversation-quality
 * @description Get conversation quality metrics
 * @query days - Number of days to analyze (default: 7)
 */
export async function GET(req: NextRequest) {
  try {
    // Ensure analytics is initialized
    const initError = await ensureAnalyticsInitialized();
    if (initError) return initError;
    
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 7;
    
    const metrics = await getConversationQualityMetrics(days);
    
    if (!metrics) {
      return NextResponse.json(
        {
          status: 'Error',
          message: 'Analytics service is not available'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        status: 'Success',
        data: metrics
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Conversation quality metrics error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve conversation quality metrics'
      },
      { status: 500 }
    );
  }
} 
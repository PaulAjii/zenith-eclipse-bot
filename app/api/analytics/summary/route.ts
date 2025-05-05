import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/utils/analytics';

/**
 * @route GET /api/analytics/summary
 * @description Get overall analytics summary
 * @query days - Number of days to analyze (default: 7)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 7;
    
    const summary = await getAnalyticsSummary(days);
    
    if (!summary) {
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
        data: summary
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics summary error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve analytics summary'
      },
      { status: 500 }
    );
  }
} 
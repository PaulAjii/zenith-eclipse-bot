import { NextRequest, NextResponse } from 'next/server';
import { getTopSessionTopics } from '@/utils/analytics';
import { ensureAnalyticsInitialized } from '@/app/api/init';

/**
 * @route GET /api/analytics/top-topics
 * @description Get the most common topics by session interactions
 * @query days - Number of days to analyze (default: 30)
 * @query limit - Maximum number of topics to return (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    // Ensure analytics is initialized
    const initError = await ensureAnalyticsInitialized();
    if (initError) return initError;
    
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const limitParam = url.searchParams.get('limit');
    
    const days = daysParam ? parseInt(daysParam) : 30;
    const limit = limitParam ? parseInt(limitParam) : 10;
    
    const topics = await getTopSessionTopics(days, limit);
    
    if (!topics) {
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
        data: topics
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Top topics error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve top topics'
      },
      { status: 500 }
    );
  }
} 
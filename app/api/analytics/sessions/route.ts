import { NextRequest, NextResponse } from 'next/server';
import { getSessionSummaries } from '@/utils/analytics';
import { ensureAnalyticsInitialized } from '@/app/api/init';

/**
 * @route GET /api/analytics/sessions
 * @description Get a list of session summaries for the given time range
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

    const sessions = await getSessionSummaries(days);

    if (!sessions) {
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
        data: sessions
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sessions list error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve sessions list'
      },
      { status: 500 }
    );
  }
} 
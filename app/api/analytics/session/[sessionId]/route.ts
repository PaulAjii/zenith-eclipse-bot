import { NextRequest, NextResponse } from 'next/server';
import { getSessionAnalytics } from '@/utils/analytics';

/**
 * @route GET /api/analytics/session/[sessionId]
 * @description Get analytics for a specific session
 * @param sessionId - The ID of the session to analyze
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        {
          status: 'Error',
          message: 'Session ID is required'
        },
        { status: 400 }
      );
    }
    
    const sessionAnalytics = await getSessionAnalytics(sessionId);
    
    if (!sessionAnalytics) {
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
        data: sessionAnalytics
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session analytics error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve session analytics'
      },
      { status: 500 }
    );
  }
} 
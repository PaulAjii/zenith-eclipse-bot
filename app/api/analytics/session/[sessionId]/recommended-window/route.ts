import { NextRequest, NextResponse } from 'next/server';
import { getSessionAnalytics } from '@/utils/analytics';
import { ensureAnalyticsInitialized } from '@/app/api/init';

/**
 * @route GET /api/analytics/session/[sessionId]/recommended-window
 * @description Get recommended window size for a specific session
 * @param sessionId - The ID of the session to analyze
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Ensure analytics is initialized
    const initError = await ensureAnalyticsInitialized();
    if (initError) return initError;
    
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
    
    // First get session analytics
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
    
    // Calculate recommended window size based on session complexity
    const interactionCount = sessionAnalytics.interactionCount || 0;
    let recommendedWindowSize = 5; // Default
    
    if (interactionCount <= 3) {
      recommendedWindowSize = 3; // Small window for short conversations
    } else if (interactionCount <= 7) {
      recommendedWindowSize = 5; // Medium window
    } else if (interactionCount <= 15) {
      recommendedWindowSize = 8; // Larger window
    } else {
      recommendedWindowSize = 10; // Maximum window
    }
    
    // Check if any interactions needed human assistance
    const needsMoreContext = sessionAnalytics.hasHumanAssistance || false;
    
    if (needsMoreContext && recommendedWindowSize < 10) {
      // If human assistance was needed, consider providing more context
      recommendedWindowSize += 2;
    }
    
    return NextResponse.json(
      {
        status: 'Success',
        data: {
          sessionId,
          recommendedWindowSize,
          interactionCount,
          needsMoreContext
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Recommended window calculation error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to calculate recommended window size'
      },
      { status: 500 }
    );
  }
} 
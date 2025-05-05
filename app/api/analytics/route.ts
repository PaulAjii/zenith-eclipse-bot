import { NextResponse } from 'next/server';
// We'll import analytics functions only where they're actually used

/**
 * Main analytics entry point
 * @route GET /api/analytics
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'Success',
        message: 'Analytics API is working',
        endpoints: [
          '/api/analytics/summary',
          '/api/analytics/session/[sessionId]',
          '/api/analytics/conversation-quality',
          '/api/analytics/follow-up-patterns',
          '/api/analytics/user-retention',
          '/api/analytics/top-topics',
          '/api/analytics/conversation-windows',
          '/api/analytics/session/[sessionId]/recommended-window'
        ]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { status: 'Error', message: 'Analytics service error' },
      { status: 500 }
    );
  }
} 
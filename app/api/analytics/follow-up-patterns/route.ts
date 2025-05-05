import { NextRequest, NextResponse } from 'next/server';
import { analyzeFollowUpPatterns } from '@/utils/analytics';

/**
 * @route GET /api/analytics/follow-up-patterns
 * @description Get follow-up question patterns
 * @query limit - Maximum number of sessions to analyze (default: 100)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 100;
    
    const patterns = await analyzeFollowUpPatterns(limit);
    
    if (!patterns) {
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
        data: patterns
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Follow-up patterns error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve follow-up patterns'
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { analyzeUserRetention } from '@/utils/analytics';

/**
 * @route GET /api/analytics/user-retention
 * @description Get user retention data
 * @query days - Number of days to analyze (default: 30)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;
    
    const retention = await analyzeUserRetention(days);
    
    if (!retention) {
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
        data: retention
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User retention error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to retrieve user retention data'
      },
      { status: 500 }
    );
  }
} 
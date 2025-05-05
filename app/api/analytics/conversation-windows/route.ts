import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversationWindows } from '@/utils/analytics';

/**
 * @route GET /api/analytics/conversation-windows
 * @description Get analysis of conversation window effectiveness
 * @query days - Number of days to analyze (default: 30)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;
    
    const analysis = await analyzeConversationWindows(days);
    
    if (!analysis) {
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
        data: analysis
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Conversation windows analysis error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Failed to analyze conversation windows'
      },
      { status: 500 }
    );
  }
} 
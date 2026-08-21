import { NextRequest, NextResponse } from 'next/server';
import { healBrightDataScraper } from '@/lib/bright-data/scraper-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, url } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      );
    }

    console.log(`[BrightData Heal] ${description}`);
    const result = await healBrightDataScraper(description, url || '');

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('[BrightData Heal] Error:', error);
    return NextResponse.json(
      {
        error: 'Heal failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

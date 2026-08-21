import { NextRequest, NextResponse } from 'next/server';
import { triggerScraper } from '@/lib/bright-data/scraper-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[BrightData Trigger] ${url}`);
    const result = await triggerScraper(url);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      collectionId: result.collectionId,
      message: 'Scraping started. Poll /api/scraper/brightdata/poll for results.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { pollResults, insertScrapedJobs } from '@/lib/bright-data/scraper-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');
    const url = searchParams.get('url') || '';

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }

    const result = await pollResults(collectionId);

    if (result.status === 'done' && result.data) {
      const insertResult = await insertScrapedJobs(result.data, url);
      return NextResponse.json({
        status: 'done',
        totalFound: result.data.length,
        inserted: insertResult.inserted,
        skipped: insertResult.skipped,
        highRisk: insertResult.highRisk,
        sample: result.data.slice(0, 5).map(j => ({
          title: j.product_page_url.split('/').pop()?.replace(/-/g, ' ') || 'Unknown',
          company: j.company_name,
          url: j.product_page_url,
        })),
      });
    }

    if (result.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: result.error });
    }

    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getDemoScraperRuns } from '@/lib/demo-data';

export async function GET() {
  try {
    const runs = getDemoScraperRuns();
    return NextResponse.json({ runs });
  } catch (error) {
    console.error('[API /scraper/runs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch scraper runs' }, { status: 500 });
  }
}

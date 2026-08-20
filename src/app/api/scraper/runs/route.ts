import { NextResponse } from 'next/server';
import { fetchScraperRuns } from '@/lib/db';

export async function GET() {
  try {
    const runs = await fetchScraperRuns();
    return NextResponse.json({ runs });
  } catch (error) {
    console.error('[API /scraper/runs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch scraper runs' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { fetchScraperHealth } from '@/lib/db';

export async function GET() {
  try {
    const health = await fetchScraperHealth();
    if (!health) {
      return NextResponse.json({ error: 'No health data found' }, { status: 404 });
    }
    return NextResponse.json(health);
  } catch (error) {
    console.error('[API /scraper/health] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch scraper health' }, { status: 500 });
  }
}

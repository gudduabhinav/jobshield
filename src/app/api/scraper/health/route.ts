import { NextResponse } from 'next/server';
import { getDemoScraperHealth } from '@/lib/demo-data';

export async function GET() {
  try {
    const health = getDemoScraperHealth();
    return NextResponse.json(health);
  } catch (error) {
    console.error('[API /scraper/health] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch scraper health' }, { status: 500 });
  }
}

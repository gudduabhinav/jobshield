import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const runId = `run-${Date.now()}`;
    return NextResponse.json({
      message: 'Scraper run initiated',
      runId,
      status: 'completed',
      note: 'Demo mode - in production this triggers Bright Data Scraper Studio',
    });
  } catch (error) {
    console.error('[API /scraper/run] Error:', error);
    return NextResponse.json({ error: 'Failed to start scraper run' }, { status: 500 });
  }
}

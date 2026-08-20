import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const runId = `run-${Date.now()}`;
    const now = new Date().toISOString();

    await db.from('scraper_runs').insert({
      id: runId,
      collector_id: 'job-collector-indeed',
      status: 'completed',
      started_at: now,
      completed_at: now,
      records_found: 0,
      valid_records: 0,
      invalid_records: 0,
      extraction_quality: 0,
    });

    return NextResponse.json({
      message: 'Scraper run initiated',
      runId,
      status: 'completed',
      note: 'Demo mode — in production this triggers Bright Data Scraper Studio',
    });
  } catch (error) {
    console.error('[API /scraper/run] Error:', error);
    return NextResponse.json({ error: 'Failed to start scraper run' }, { status: 500 });
  }
}

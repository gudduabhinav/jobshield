import { NextResponse } from 'next/server';
import { fetchScraperHealth } from '@/lib/db';
import { ScraperHealth } from '@/types/scraper';

const defaultHealth: ScraperHealth = {
  id: 'default',
  collectorId: 'live-scraper-all',
  status: 'IDLE',
  lastSuccessfulRun: null,
  lastFailedRun: null,
  totalRecordsExtracted: 0,
  extractionQuality: 0,
  fieldCompleteness: {
    title: 0,
    company: 0,
    location: 0,
    description: 0,
    applicationUrl: 0,
  },
  recoveryRate: 0,
  totalHealingEvents: 0,
  averageRecoveryTime: 0,
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const health = await fetchScraperHealth();
    return NextResponse.json(health || defaultHealth);
  } catch (error) {
    console.error('[API /scraper/health] Error:', error);
    return NextResponse.json(defaultHealth);
  }
}
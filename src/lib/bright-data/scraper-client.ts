import { db } from '@/lib/db';
import { calculateRiskScore } from '@/lib/risk-engine/scoring';
import { RiskLevel } from '@/types/jobs';

const BRIGHT_DATA_API_KEY = process.env.BRIGHT_DATA_API_KEY;
const BRIGHT_DATA_COLLECTOR_ID = process.env.BRIGHT_DATA_COLLECTOR_ID || 'c_mt2zxzmn1hc5ekd0hr';
const BRIGHT_DATA_API_BASE = 'https://api.brightdata.com';

export interface BrightDataJob {
  company_name: string;
  product_page_url: string;
  input?: { url: string };
}

export interface TriggerResult {
  success: boolean;
  collectionId: string;
  error?: string;
}

export interface PollResult {
  status: 'pending' | 'done' | 'failed';
  data?: BrightDataJob[];
  error?: string;
}

export interface ScrapeResult {
  success: boolean;
  jobs: BrightDataJob[];
  totalFound: number;
  inserted: number;
  skipped: number;
  highRisk: number;
  healingEvents: number;
  processingTimeMs: number;
  collectorId: string;
  error?: string;
}

export async function triggerScraper(url: string): Promise<TriggerResult> {
  const triggerUrl = new URL(`${BRIGHT_DATA_API_BASE}/dca/trigger`);
  triggerUrl.searchParams.set('collector', BRIGHT_DATA_COLLECTOR_ID);
  triggerUrl.searchParams.set('queue_next', '1');

  console.log(`[BrightData] Triggering: ${BRIGHT_DATA_COLLECTOR_ID}`);

  try {
    const res = await fetch(triggerUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ url }]),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, collectionId: '', error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json();
    const collectionId = data.collection_id || data.response_id || data.id;
    console.log(`[BrightData] Triggered: ${collectionId}`);
    return { success: true, collectionId };
  } catch (err) {
    return { success: false, collectionId: '', error: err instanceof Error ? err.message : 'Trigger failed' };
  }
}

export async function pollResults(collectionId: string): Promise<PollResult> {
  try {
    const res = await fetch(`${BRIGHT_DATA_API_BASE}/dca/dataset?id=${collectionId}`, {
      headers: { 'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}` },
    });

    if (!res.ok) {
      return { status: 'pending' };
    }

    const data = await res.json();

    // Bright Data returns a direct array when done, or an object with status
    if (Array.isArray(data)) {
      return { status: 'done', data };
    }

    if (data.status === 'done' || data.status === 'completed') {
      return { status: 'done', data: data.data || data.results || data };
    }
    if (data.status === 'failed') {
      return { status: 'failed', error: 'Scraper failed' };
    }

    return { status: 'pending' };
  } catch {
    return { status: 'pending' };
  }
}

export async function insertScrapedJobs(
  jobs: BrightDataJob[],
  url: string
): Promise<{ inserted: number; skipped: number; highRisk: number }> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = 'unknown';
  }

  let inserted = 0;
  let skipped = 0;
  let highRisk = 0;

  for (const job of jobs) {
    const jobTitle = job.product_page_url
      .split('/').pop()?.replace(/-/g, ' ') || 'Unknown Position';

    if (!jobTitle || jobTitle.length < 2) {
      skipped++;
      continue;
    }

    const risk = calculateRiskScore({
      title: jobTitle,
      companyName: job.company_name || 'Unknown',
      description: '',
      applicationUrl: job.product_page_url || url,
      companyUrl: null,
      salary: null,
      isReposted: false,
      duplicateGroupId: null,
    });

    if (risk.level === 'HIGH') highRisk++;

    const jobId = `bd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${inserted}`;

    const { error } = await db.from('jobs').insert({
      id: jobId,
      title: jobTitle,
      company_name: job.company_name || 'Unknown',
      location: 'Not specified',
      description: '',
      application_url: job.product_page_url || url,
      source_name: hostname,
      skills: [],
      salary: null,
      posted_date: null,
      scraped_at: new Date().toISOString(),
      risk_score: risk.score,
      risk_level: risk.level as RiskLevel,
      risk_reasons: risk.reasons,
    });

    if (error) skipped++;
    else inserted++;
  }

  // Log scraper run
  await db.from('scraper_runs').insert({
    id: `bd-${Date.now()}`,
    collector_id: `brightdata-${hostname}`,
    status: 'completed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    records_found: jobs.length,
    valid_records: inserted,
    invalid_records: skipped,
    extraction_quality: jobs.length > 0 ? Math.round((inserted / jobs.length) * 100) : 0,
  });

  // Update health
  const existing = await db.from('scraper_health')
    .select('id, total_runs, successful_runs, failed_runs')
    .eq('collector_id', `brightdata-${hostname}`)
    .single();

  if (existing.data) {
    const h = existing.data;
    const newTotal = (h.total_runs || 0) + 1;
    const newSuccessful = (h.successful_runs || 0) + 1;
    await db.from('scraper_health').update({
      total_runs: newTotal,
      successful_runs: newSuccessful,
      health_score: Math.round((newSuccessful / newTotal) * 100),
      last_run_at: new Date().toISOString(),
      last_status: 'healthy',
    }).eq('collector_id', `brightdata-${hostname}`);
  } else {
    await db.from('scraper_health').insert({
      id: `health-bd-${hostname}-${Date.now()}`,
      collector_id: `brightdata-${hostname}`,
      collector_type: 'brightdata',
      health_score: 100,
      status: 'healthy',
      last_run_at: new Date().toISOString(),
      last_status: 'healthy',
      total_runs: 1,
      successful_runs: 1,
      failed_runs: 0,
      next_scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      field_completeness: {
        applicationUrl: { completeness: 100, isTracked: true },
        title: { completeness: 100, isTracked: true },
        company: { completeness: 100, isTracked: true },
      },
    });
  }

  return { inserted, skipped, highRisk };
}

export async function healBrightDataScraper(
  description: string,
  url: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BRIGHT_DATA_API_BASE}/dca/collectors/${BRIGHT_DATA_COLLECTOR_ID}/refactor_template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: description, url }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, message: `HTTP ${res.status}: ${text}` };
    }

    return { success: true, message: 'Healer triggered' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Heal failed' };
  }
}

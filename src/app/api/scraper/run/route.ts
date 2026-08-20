import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchAllSources, LiveJob } from '@/lib/scraper/live-sources';
import { calculateRiskScore } from '@/lib/risk-engine/scoring';
import { RiskLevel } from '@/types/jobs';

interface ProcessedJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  application_url: string;
  source_name: string;
  skills: string[];
  salary: string | null;
  posted_date: string | null;
  scraped_at: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_reasons: { ruleId: string; name: string; weight: number; description: string }[];
}

function generateJobId(job: LiveJob): string {
  const slug = `${job.source}-${job.url}`.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug.substring(0, 80) || `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function processLiveJob(job: LiveJob): Promise<ProcessedJob> {
  const risk = calculateRiskScore({
    title: job.title,
    companyName: job.company,
    description: job.description,
    applicationUrl: job.url,
    companyUrl: null,
    salary: job.salary_min ? `$${job.salary_min}` : null,
    isReposted: false,
    duplicateGroupId: null,
  });

  return {
    id: generateJobId(job),
    title: job.title,
    company_name: job.company,
    location: job.location,
    description: job.description.substring(0, 2000),
    application_url: job.url,
    source_name: job.source,
    skills: job.tags.slice(0, 20),
    salary: job.salary_min ? `$${job.salary_min}` + (job.salary_max ? ` - $${job.salary_max}` : '') : null,
    posted_date: job.date,
    scraped_at: new Date().toISOString(),
    risk_score: risk.score,
    risk_level: risk.level,
    risk_reasons: risk.reasons,
  };
}

export async function POST() {
  const startTime = Date.now();
  const runId = `run-${Date.now()}`;

  try {
    const startedAt = new Date().toISOString();

    await db.from('scraper_runs').insert({
      id: runId,
      collector_id: 'live-scraper-all',
      status: 'running',
      started_at: startedAt,
      completed_at: null,
      records_found: 0,
      valid_records: 0,
      invalid_records: 0,
      extraction_quality: 0,
    });

    console.log('[Scraper Run] Fetching live jobs from all sources...');
    const scrapeResult = await fetchAllSources();
    console.log(`[Scraper Run] Fetched ${scrapeResult.jobs.length} jobs`);

    const processedJobs: ProcessedJob[] = [];
    for (const job of scrapeResult.jobs) {
      try {
        const processed = await processLiveJob(job);
        processedJobs.push(processed);
      } catch {
        // skip invalid
      }
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const job of processedJobs) {
      const { error: insertError } = await db.from('jobs').insert(job);
      if (insertError) {
        if (insertError.code === '23505') {
          skippedCount++;
        } else {
          console.error(`[Scraper Run] Insert error for "${job.title}" (${job.source_name}):`, insertError.code, insertError.message);
          skippedCount++;
        }
      } else {
        insertedCount++;
      }
    }

    const highRiskCount = processedJobs.filter((j) => j.risk_level === "HIGH").length;
    const mediumRiskCount = processedJobs.filter((j) => j.risk_level === "MEDIUM").length;
    const lowRiskCount = processedJobs.filter((j) => j.risk_level === "LOW").length;
    const processingTimeMs = Date.now() - startTime;

    const completedAt = new Date().toISOString();
    const quality = scrapeResult.jobs.length > 0
      ? Math.round((insertedCount / scrapeResult.jobs.length) * 100)
      : 0;

    await db.from('scraper_runs').update({
      status: 'completed',
      completed_at: completedAt,
      records_found: scrapeResult.jobs.length,
      valid_records: insertedCount,
      invalid_records: skippedCount,
      extraction_quality: quality,
    }).eq('id', runId);

    const { data: existingHealth } = await db.from('scraper_health')
      .select('id')
      .eq('collector_id', 'live-scraper-all')
      .single();

    if (existingHealth) {
      await db.from('scraper_health').update({
        status: 'HEALTHY',
        last_successful_run: completedAt,
        total_records_extracted: insertedCount,
        extraction_quality: quality,
        recovery_rate: 100,
        updated_at: completedAt,
      }).eq('collector_id', 'live-scraper-all');
    } else {
      await db.from('scraper_health').insert({
        id: `health-${Date.now()}`,
        collector_id: 'live-scraper-all',
        status: 'HEALTHY',
        last_successful_run: completedAt,
        total_records_extracted: insertedCount,
        extraction_quality: quality,
        field_completeness: {
          title: 1,
          company: 1,
          location: 0.9,
          description: 0.95,
          applicationUrl: 0.98,
        },
        recovery_rate: 100,
        total_healing_events: 0,
        average_recovery_time: 0,
      });
    }

    console.log(`[Scraper Run] Complete: ${insertedCount} inserted, ${skippedCount} skipped in ${processingTimeMs}ms`);

    return NextResponse.json({
      message: `Scraped ${scrapeResult.jobs.length} real jobs from live sources`,
      runId,
      stats: {
        totalFetched: scrapeResult.jobs.length,
        inserted: insertedCount,
        skipped: skippedCount,
        bySource: scrapeResult.stats.bySource,
        riskBreakdown: {
          high: highRiskCount,
          medium: mediumRiskCount,
          low: lowRiskCount,
        },
        processingTimeMs,
      },
      fetchTime: scrapeResult.stats.fetchTime,
    });
  } catch (error) {
    console.error('[API /scraper/run] Critical error:', error);

    await db.from('scraper_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
    }).eq('id', runId);

    return NextResponse.json(
      {
        error: 'Scraper run failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}